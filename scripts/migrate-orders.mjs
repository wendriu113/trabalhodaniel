// Explicit mapping prevents accidental identity matching by name, phone or CPF.
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const [projectId, mappingFile, flag] = process.argv.slice(2);
if (!projectId || !mappingFile) throw new Error('Uso: node scripts/migrate-orders.mjs PROJECT_ID mapping.json [--apply]');
if (process.env.FIRESTORE_EMULATOR_HOST && projectId !== 'demo-sgo') throw new Error('Emulador permitido somente para demo-sgo.');
initializeApp({ projectId, ...(process.env.FIRESTORE_EMULATOR_HOST ? {} : { credential: applicationDefault() }) });
const db = getFirestore(), mapping = JSON.parse(await readFile(mappingFile, 'utf8'));
if (!Array.isArray(mapping) || !mapping.length) throw new Error('O mapeamento deve ser uma lista não vazia.');
const plans = [], seen = new Set();
for (const item of mapping) {
  for (const key of ['uid', 'orderId', 'customerId', 'vehicleId']) if (typeof item[key] !== 'string' || !item[key] || item[key].includes('/')) throw new Error(`Identificador inválido: ${key}`);
  if (seen.has(item.orderId)) throw new Error('IDs de OS duplicados no mapeamento. Resolva a colisão antes de migrar.');
  seen.add(item.orderId);
  const source = db.doc(`users/${item.uid}/orders/${item.orderId}`);
  const [old, customer, vehicle, target, internalTarget] = await Promise.all([source.get(), db.doc(`customers/${item.customerId}`).get(), db.doc(`vehicles/${item.vehicleId}`).get(), db.doc(`serviceOrders/${item.orderId}`).get(), db.doc(`serviceOrderInternal/${item.orderId}`).get()]);
  if (!old.exists || !customer.exists || !vehicle.exists || vehicle.data().customerId !== item.customerId || vehicle.data().plate !== old.data().plate) throw new Error(`Associação incompatível: ${source.path}`);
  if (target.exists || internalTarget.exists) throw new Error(`Destino já existe: ${item.orderId}. Não será sobrescrito.`);
  const d = old.data();
  const publicData = { customerId: item.customerId, vehicleId: item.vehicleId, ownerUid: customer.data().ownerUid || '', createdBy: item.uid,
    vehicle: d.vehicle, plate: d.plate, entryDate: d.entryDate, deliveryDate: d.deliveryDate, status: d.status,
    publicNotes: '', history: [], createdAt: d.createdAt, updatedAt: Timestamp.now() };
  // Old notes were not labelled public: keep them private until reviewed by an administrator.
  const internalData = { customerName: d.customerName, phone: d.phone, description: d.description, laborCents: d.laborCents, partsCents: d.partsCents,
    internalNotes: (d.history || []).map(e => `${e.occurredAt.toDate().toISOString()} · ${e.stage}: ${e.note}`).join('\n') };
  if (internalData.internalNotes.length > 4000) throw new Error(`Histórico extenso: ${source.path}. Revise manualmente; nada foi truncado.`);
  plans.push({ source: source.path, sourceData: d, sourceVersion: old.updateTime, id: item.orderId, publicData, internalData });
}
console.log(`${plans.length} ordens validadas. Originais e anexos serão mantidos nos caminhos atuais.`);
if (flag !== '--apply') { console.log('Simulação: nenhuma gravação. Execute com --apply após revisar.'); process.exit(0); }
function encode(value) {
  if (value instanceof Timestamp) return { __timestamp: [value.seconds, value.nanoseconds] };
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)]));
  return value;
}
await mkdir('.cache/migration-backups', { recursive: true });
const backupPath = resolve('.cache/migration-backups', `${projectId}-${Date.now()}.json`);
await writeFile(backupPath, JSON.stringify({ projectId, plans: encode(plans) }, null, 2), { flag: 'wx' });
console.log(`Backup privado: ${backupPath}`);
for (const plan of plans) await db.runTransaction(async tx => {
  const old = await tx.get(db.doc(plan.source));
  if (!old.updateTime.isEqual(plan.sourceVersion)) throw new Error(`Origem alterada durante a migração: ${plan.source}. Pare e revise.`);
  tx.create(db.doc(`serviceOrders/${plan.id}`), plan.publicData);
  tx.create(db.doc(`serviceOrderInternal/${plan.id}`), plan.internalData);
});
console.log('Migração concluída. Nenhum documento original foi alterado ou apagado.');
