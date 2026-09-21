const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { randomUUID } = require('node:crypto');
const { setTimeout: delay } = require('node:timers/promises');
const { normalizePlate, normalizeCpf, validCpf, validPlate, plateEmail } = require('./validation');
initializeApp();
const db = getFirestore();
const auth = getAuth();
const options = { region: 'southamerica-east1', maxInstances: 5 };

function admin(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Entre na sua conta.');
  if (request.auth.token.admin !== true) throw new HttpsError('permission-denied', 'Apenas administradores podem realizar esta operação.');
}
function text(value, label, min = 2, max = 160) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) throw new HttpsError('invalid-argument', `${label} inválido.`);
  return value.trim();
}
function id(value) {
  const clean = text(value, 'Identificador', 1, 128);
  if (clean.includes('/')) throw new HttpsError('invalid-argument', 'Identificador inválido.');
  return clean;
}

exports.saveCustomer = onCall(options, async request => {
  admin(request);
  const data = request.data ?? {};
  const customerId = id(data.id);
  const name = text(data.name, 'Nome');
  const phone = String(data.phone ?? '').replace(/\D/g, '');
  if (!/^\d{10,11}$/.test(phone)) throw new HttpsError('invalid-argument', 'Informe telefone com DDD.');
  const ref = db.doc(`customers/${customerId}`);
  await db.runTransaction(async tx => {
    const previous = await tx.get(ref);
    if (previous.exists) tx.update(ref, { name, phone, updatedAt: FieldValue.serverTimestamp() });
    else tx.create(ref, { name, phone, ownerUid: '', createdBy: request.auth.uid, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  });
  return { id: customerId };
});

exports.saveVehicle = onCall(options, async request => {
  admin(request);
  const data = request.data ?? {};
  const plate = normalizePlate(data.plate);
  if (!validPlate(plate)) throw new HttpsError('invalid-argument', 'Placa inválida.');
  const customerId = id(data.customerId);
  const model = text(data.model, 'Modelo');
  const ref = db.doc(`vehicles/${plate}`);
  await db.runTransaction(async tx => {
    const [customer, vehicle] = await Promise.all([tx.get(db.doc(`customers/${customerId}`)), tx.get(ref)]);
    if (!customer.exists) throw new HttpsError('not-found', 'Cliente não encontrado.');
    if (vehicle.exists && vehicle.data().customerId !== customerId) throw new HttpsError('already-exists', 'Esta placa já pertence a outro cliente.');
    tx.set(db.doc(`customerVehicles/${plate}`), { plate, model, customerId });
    if (vehicle.exists) tx.update(ref, { model, updatedAt: FieldValue.serverTimestamp() });
    else tx.create(ref, { plate, model, customerId, ownerUid: customer.data().ownerUid, userId: '', createdBy: request.auth.uid, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  });
  return { id: plate };
});

exports.provisionClient = onCall(options, async request => {
  admin(request);
  const data = request.data ?? {};
  const plate = normalizePlate(data.plate), cpf = normalizeCpf(data.cpf);
  if (!validPlate(plate) || !validCpf(cpf)) throw new HttpsError('invalid-argument', 'Confira a placa e o CPF válido.');
  const customerId = id(data.customerId), vehicleRef = db.doc(`vehicles/${plate}`);
  // Reserve a random UID once. Retries cannot reset passwords or take over an existing Auth account.
  const uid = await db.runTransaction(async tx => {
    const vehicle = await tx.get(vehicleRef);
    if (!vehicle.exists || vehicle.data().customerId !== customerId) throw new HttpsError('not-found', 'Veículo não encontrado para este cliente.');
    if (vehicle.data().userId) throw new HttpsError('already-exists', 'O veículo já possui acesso. A senha não foi alterada.');
    const reserved = vehicle.data().provisioningUid || randomUUID();
    tx.update(vehicleRef, { provisioningUid: reserved });
    return reserved;
  });
  let resumed = false;
  try {
    await auth.createUser({ uid, email: plateEmail(plate), password: cpf, disabled: true });
  } catch (error) {
    if (error.code === 'auth/uid-already-exists') resumed = true;
    else {
      if (error.code === 'auth/email-already-exists') throw new HttpsError('already-exists', 'Login já registrado. Solicite a revisão do administrador do Firebase.');
      // Do not log the request: it contains the initial password.
      console.error('provisionClient Auth failure', { code: error.code });
      throw new HttpsError('internal', 'Não foi possível criar o acesso. Tente novamente.');
    }
  }
  const account = await auth.getUser(uid);
  if (account.email !== plateEmail(plate)) throw new HttpsError('failed-precondition', 'Associação de acesso inconsistente.');
  await db.runTransaction(async tx => {
    const customerRef = db.doc(`customers/${customerId}`), profileRef = db.doc(`users/${uid}`);
    const [customer, profile] = await Promise.all([tx.get(customerRef), tx.get(profileRef)]);
    if (!customer.exists) throw new HttpsError('not-found', 'Cliente não encontrado.');
    if (!profile.exists) tx.create(profileRef, { role: 'client', customerId, mustChangePassword: true, credentialsValidAfter: 0, createdAt: FieldValue.serverTimestamp() });
    if (!customer.data().ownerUid) tx.update(customerRef, { ownerUid: uid });
  });
  await auth.updateUser(uid, { disabled: false });
  await vehicleRef.update({ userId: uid, provisioningUid: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
  return { success: true, resumed }; // Never return CPF/password.
});

exports.changeInitialPassword = onCall(options, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Entre novamente.');
  const uid = request.auth.uid, ref = db.doc(`users/${uid}`);
  const profile = await ref.get();
  if (!profile.exists || profile.data().role !== 'client' || !profile.data().mustChangePassword) throw new HttpsError('failed-precondition', 'A troca inicial já foi concluída.');
  const password = request.data?.password;
  if (typeof password !== 'string' || password.length < 12 || password.length > 128 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) throw new HttpsError('invalid-argument', 'Use de 12 a 128 caracteres, com letras e números.');
  if (Date.now() / 1000 - request.auth.token.auth_time > 300) throw new HttpsError('unauthenticated', 'Entre novamente antes de trocar a senha.');
  await auth.updateUser(uid, { password });
  await auth.revokeRefreshTokens(uid);
  // Rules also reject already-issued ID tokens from the initial CPF login.
  const credentialsValidAfter = Math.floor(Date.now() / 1000) + 1;
  await ref.update({ mustChangePassword: false, credentialsValidAfter });
  // Auth timestamps have one-second resolution. Do not invite a new login before the cutoff.
  await delay(Math.max(0, credentialsValidAfter * 1000 - Date.now()));
  return { success: true };
});
