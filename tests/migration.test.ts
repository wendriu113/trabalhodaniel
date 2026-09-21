import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const app = initializeApp({ projectId: 'demo-sgo' }, 'migration-test');
after(() => deleteApp(app));
test('migração simula sem escrever, preserva originais e mantém notas antigas privadas', async () => {
  const db = getFirestore(app), stamp = Date.now(), id = `legacy-${stamp}`, customerId = `migration-${stamp}`;
  const original = { customerName: 'Ana Souza', phone: '51999999999', vehicle: 'Onix', plate: 'MIG1A23', description: 'Pintura original',
    entryDate: Timestamp.now(), deliveryDate: Timestamp.now(), laborCents: 10000, partsCents: 5000, status: 'Pintura',
    history: [{ stage: 'Chapeamento', note: 'NOTA INTERNA ORIGINAL', occurredAt: Timestamp.now() }], createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
  await db.doc(`users/legacy-admin/orders/${id}`).set(original);
  await db.doc(`customers/${customerId}`).set({ name: 'Ana Souza', ownerUid: 'migration-client' });
  await db.doc('vehicles/MIG1A23').set({ customerId, plate: 'MIG1A23', model: 'Onix' });
  await mkdir('.cache/migration-test', { recursive: true });
  const file = resolve(`.cache/migration-test/${stamp}.json`);
  await writeFile(file, JSON.stringify([{ uid: 'legacy-admin', orderId: id, customerId, vehicleId: 'MIG1A23' }]));
  const run = promisify(execFile);
  await run(process.execPath, ['scripts/migrate-orders.mjs', 'demo-sgo', file], { env: process.env });
  assert.equal((await db.doc(`serviceOrders/${id}`).get()).exists, false);
  await run(process.execPath, ['scripts/migrate-orders.mjs', 'demo-sgo', file, '--apply'], { env: process.env });
  const migrated = (await db.doc(`serviceOrders/${id}`).get()).data();
  const privateData = (await db.doc(`serviceOrderInternal/${id}`).get()).data();
  assert.equal(migrated.status, 'Pintura'); assert.deepEqual(migrated.history, []);
  assert.equal(migrated.totalCents, 15000); assert.equal(migrated.paidCents, 0);
  assert.equal(migrated.publicNotes, ''); assert.match(privateData.internalNotes, /NOTA INTERNA ORIGINAL/);
  assert.deepEqual((await db.doc(`users/legacy-admin/orders/${id}`).get()).data(), original);
  await assert.rejects(run(process.execPath, ['scripts/migrate-orders.mjs', 'demo-sgo', file, '--apply'], { env: process.env }), /Destino já existe/);
});
