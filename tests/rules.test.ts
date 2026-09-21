import { after, before, beforeEach, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, Timestamp, serverTimestamp, writeBatch, runTransaction } from 'firebase/firestore';
import { getBytes, ref, uploadBytes } from 'firebase/storage';
let env: RulesTestEnvironment;
const date = Timestamp.fromDate(new Date(2026, 8, 19, 12));
const publicOrder = () => ({ customerId: 'c1', vehicleId: 'ABC1D23', ownerUid: 'alice', createdBy: 'admin', vehicle: 'Onix', plate: 'ABC1D23', entryDate: date, deliveryDate: date, status: 'Veículo recebido', publicNotes: '', history: [], totalCents: 40000, paidCents: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
const internal = { customerName: 'Ana Souza', phone: '51999999999', description: 'Reparar pintura', laborCents: 30000, partsCents: 10000, internalNotes: 'Custo interno confidencial' };
const admin = () => env.authenticatedContext('admin', { admin: true }).firestore();
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-sgo',
    firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync('firestore.rules', 'utf8') },
    storage: { host: '127.0.0.1', port: 9199, rules: readFileSync('storage.rules', 'utf8') },
  });
});
beforeEach(async () => {
  await env.clearFirestore(); await env.clearStorage();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'users/alice'), { role: 'client', customerId: 'c1', mustChangePassword: false }),
      setDoc(doc(db, 'users/aliceSecondPlate'), { role: 'client', customerId: 'c1', mustChangePassword: false }),
      setDoc(doc(db, 'users/bob'), { role: 'client', customerId: 'c2', mustChangePassword: false }),
      setDoc(doc(db, 'users/initial'), { role: 'client', customerId: 'c1', mustChangePassword: true }),
      setDoc(doc(db, 'customers/c1'), { name: 'Ana', ownerUid: 'alice' }),
      setDoc(doc(db, 'vehicles/ABC1D23'), { plate: 'ABC1D23', customerId: 'c1' }),
    ]);
  });
});
after(async () => { await env?.cleanup(); });
test('administrador cria com transação (inclui leitura de documento inexistente), edita e consulta OS', async () => {
  const db = admin(), ref = doc(db, 'serviceOrders/os1');
  await assertSucceeds(runTransaction(db, async tx => {
    if (!(await tx.get(ref)).exists()) {
      tx.set(ref, publicOrder()); tx.set(doc(db, 'serviceOrderInternal/os1'), internal);
    }
  }));
  await assertSucceeds(updateDoc(ref, { publicNotes: 'Previsão confirmada', updatedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(doc(db, 'serviceOrderInternal/os1'), { internalNotes: 'Somente oficina' }));
  await assertSucceeds(getDocs(collection(db, 'serviceOrders')));
});
test('cliente lê somente OS do seu vínculo; segunda placa do mesmo cliente também lê', async () => {
  await setDoc(doc(admin(), 'serviceOrders/os1'), publicOrder());
  for (const uid of ['alice', 'aliceSecondPlate']) {
    const db = env.authenticatedContext(uid).firestore();
    await assertSucceeds(getDoc(doc(db, 'serviceOrders/os1')));
    await assertSucceeds(getDocs(query(collection(db, 'serviceOrders'), where('customerId', '==', 'c1'))));
    await assertFails(getDocs(collection(db, 'serviceOrders')));
    await assertFails(getDocs(query(collection(db, 'serviceOrders'), where('customerId', '==', 'c2'))));
    await assertFails(setDoc(doc(db, 'serviceOrders/os2'), publicOrder()));
    await assertFails(updateDoc(doc(db, 'serviceOrders/os1'), { status: 'Entregue', updatedAt: serverTimestamp() }));
  }
  for (const db of [env.authenticatedContext('bob').firestore(), env.unauthenticatedContext().firestore(), env.authenticatedContext('initial').firestore()]) {
    await assertFails(getDoc(doc(db, 'serviceOrders/os1')));
    await assertFails(setDoc(doc(db, 'serviceOrders/os2'), publicOrder()));
  }
});
test('campos internos, perfis falsos e vínculos adulterados são bloqueados', async () => {
  const db = admin();
  await setDoc(doc(db, 'serviceOrders/os1'), publicOrder());
  await setDoc(doc(db, 'serviceOrderInternal/os1'), internal);
  const client = env.authenticatedContext('alice').firestore();
  await assertFails(getDoc(doc(client, 'serviceOrderInternal/os1')));
  await assertFails(getDoc(doc(client, 'customers/c1')));
  await assertFails(getDoc(doc(client, 'vehicles/ABC1D23')));
  await assertFails(updateDoc(doc(client, 'users/alice'), { role: 'admin', customerId: 'c2', mustChangePassword: false }));
  await assertFails(setDoc(doc(db, 'users/admin'), { role: 'admin' }));
  await assertFails(setDoc(doc(db, 'serviceOrders/invalid'), { ...publicOrder(), internalNotes: 'secret' }));
  await assertFails(setDoc(doc(db, 'serviceOrders/invalid'), { ...publicOrder(), cpf: '52998224725' }));
  await assertFails(setDoc(doc(db, 'serviceOrders/invalid'), { ...publicOrder(), customerId: 'c2' }));
  await assertFails(setDoc(doc(db, 'serviceOrders/invalid'), { ...publicOrder(), deliveryDate: Timestamp.fromMillis(1) }));
  await assertFails(updateDoc(doc(db, 'serviceOrders/os1'), { createdBy: 'intruder', updatedAt: serverTimestamp() }));
  await env.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'users/impostor'), { role: 'admin' }));
  await assertFails(setDoc(doc(env.authenticatedContext('impostor').firestore(), 'serviceOrders/os2'), publicOrder()));
});
test('atualização pública é imutável e segue vínculo e status da OS', async () => {
  const db = admin(); await setDoc(doc(db, 'serviceOrders/os1'), publicOrder());
  const event = { orderId: 'os1', customerId: 'c1', createdBy: 'admin', status: 'Em diagnóstico', publicNotes: 'Em avaliação', occurredAt: date, createdAt: serverTimestamp() };
  const batch = writeBatch(db);
  batch.update(doc(db, 'serviceOrders/os1'), { status: 'Em diagnóstico', updatedAt: serverTimestamp() });
  batch.set(doc(db, 'serviceOrderUpdates/update1'), event);
  await assertSucceeds(batch.commit());
  await assertSucceeds(getDoc(doc(env.authenticatedContext('alice').firestore(), 'serviceOrderUpdates/update1')));
  await assertFails(getDoc(doc(env.authenticatedContext('bob').firestore(), 'serviceOrderUpdates/update1')));
  await assertFails(setDoc(doc(db, 'serviceOrderUpdates/update2'), { ...event, customerId: 'c2' }));
  await assertFails(updateDoc(doc(db, 'serviceOrderUpdates/update1'), { publicNotes: 'Alterado' }));
});
test('troca inicial bloqueia ID token antigo; nova autenticação libera dados', async () => {
  await setDoc(doc(admin(), 'serviceOrders/os1'), { ...publicOrder(), deliveryDate: null });
  await env.withSecurityRulesDisabled(async context => {
    await updateDoc(doc(context.firestore(), 'users/alice'), { credentialsValidAfter: 100 });
    await setDoc(doc(context.firestore(), 'customerVehicles/ABC1D23'), { plate: 'ABC1D23', model: 'Onix', customerId: 'c1' });
  });
  const old = env.authenticatedContext('alice', { auth_time: 99 }).firestore();
  const fresh = env.authenticatedContext('alice', { auth_time: 100 }).firestore();
  await assertFails(getDoc(doc(old, 'serviceOrders/os1')));
  await assertFails(getDoc(doc(old, 'customerVehicles/ABC1D23')));
  await assertSucceeds(getDoc(doc(fresh, 'serviceOrders/os1')));
  await assertSucceeds(getDocs(query(collection(fresh, 'customerVehicles'), where('customerId', '==', 'c1'))));
  await assertFails(getDoc(doc(env.authenticatedContext('bob').firestore(), 'customerVehicles/ABC1D23')));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'customerVehicles/ABC1D23')));
});
test('financeiro e documentos legados não ficam disponíveis a clientes', async () => {
  const db = admin(), ref = doc(db, 'users/admin/movements/m1');
  const movement = { kind: 'receita', description: 'Pagamento', amountCents: 20000, occurredAt: date, createdAt: serverTimestamp() };
  await assertSucceeds(setDoc(ref, movement));
  await assertFails(setDoc(ref, { ...movement, amountCents: -1 }));
  await assertFails(getDoc(doc(env.authenticatedContext('alice').firestore(), 'users/admin/movements/m1')));
  await setDoc(doc(db, 'serviceOrders/os1'), publicOrder());
  const payment = writeBatch(db);
  payment.update(doc(db, 'serviceOrders/os1'), { paidCents: 20000, updatedAt: serverTimestamp() });
  payment.set(doc(db, 'users/admin/movements/payment'), { ...movement, orderId: 'os1' });
  await assertSucceeds(payment.commit());
  await assertFails(updateDoc(doc(db, 'serviceOrders/os1'), { paidCents: 50000, updatedAt: serverTimestamp() }));
  await env.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'users/alice/orders/legacy'), internal));
  await assertSucceeds(getDoc(doc(db, 'users/alice/orders/legacy')));
  await assertFails(getDoc(doc(env.authenticatedContext('alice').firestore(), 'users/alice/orders/legacy')));
});
test('cliente vinculado lê anexos, mas somente administradores enviam; tamanho e tipos continuam validados', async () => {
  const storage = env.authenticatedContext('admin', { admin: true }).storage();
  const path = 'users/admin/orders/os1/photo';
  await assertSucceeds(uploadBytes(ref(storage, path), new Uint8Array([1, 2]), { contentType: 'image/jpeg' }));
  await assertFails(getBytes(ref(env.authenticatedContext('alice').storage(), path)));
  await assertFails(getBytes(ref(env.unauthenticatedContext().storage(), path)));
  await assertFails(uploadBytes(ref(storage, path + '2'), new Uint8Array([1]), { contentType: 'text/html' }));
  await assertFails(uploadBytes(ref(storage, path + '2'), new Uint8Array(5242881), { contentType: 'image/jpeg' }));
  await assertFails(uploadBytes(ref(storage, path + '2'), new Uint8Array(), { contentType: 'image/jpeg' }));
  const db = admin(); await setDoc(doc(db, 'serviceOrders/os1'), publicOrder());
  const attachment = { kind: 'foto', name: 'reparo.jpg', caption: 'Antes do reparo', storagePath: path, contentType: 'image/jpeg', size: 100, occurredAt: date, createdAt: serverTimestamp() };
  await assertSucceeds(setDoc(doc(db, 'users/admin/orders/os1/attachments/photo'), attachment));
  await assertSucceeds(getDoc(doc(env.authenticatedContext('alice').firestore(), 'users/admin/orders/os1/attachments/photo')));
  await assertSucceeds(getBytes(ref(env.authenticatedContext('alice').storage(), path)));
  await assertFails(getDoc(doc(env.authenticatedContext('bob').firestore(), 'users/admin/orders/os1/attachments/photo')));
  await assertFails(getBytes(ref(env.authenticatedContext('bob').storage(), path)));
  await assertFails(setDoc(doc(env.authenticatedContext('alice').firestore(), 'users/admin/orders/os1/attachments/client'), attachment));
});
