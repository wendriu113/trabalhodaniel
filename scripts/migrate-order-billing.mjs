import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');

const [projectId, flag] = process.argv.slice(2);
if (!projectId) throw new Error('Uso: node scripts/migrate-order-billing.mjs PROJECT_ID [--apply|--rollback=BACKUP.json]');
if (process.env.FIRESTORE_EMULATOR_HOST && projectId !== 'demo-sgo') throw new Error('Emulador permitido somente para demo-sgo.');
initializeApp({ projectId, ...(process.env.FIRESTORE_EMULATOR_HOST ? {} : { credential: applicationDefault() }) });
const db = getFirestore();

if (flag?.startsWith('--rollback=')) {
  const backup = JSON.parse(await readFile(flag.slice('--rollback='.length), 'utf8'));
  for (const item of backup.orders) await db.runTransaction(async tx => {
    const ref = db.doc(`serviceOrders/${item.id}`), current = await tx.get(ref);
    if (!current.exists || current.data().totalCents !== item.totalCents || current.data().paidCents !== 0) throw new Error(`OS alterada após a migração: ${item.id}. Nada foi revertido nela.`);
    tx.update(ref, { totalCents: FieldValue.delete(), paidCents: FieldValue.delete() });
  });
  console.log(`${backup.orders.length} ordens revertidas.`);
  process.exit(0);
}

const orders = await db.collection('serviceOrders').get(), plans = [];
for (const order of orders.docs) {
  if (order.data().totalCents != null && order.data().paidCents != null) continue;
  const internal = await db.doc(`serviceOrderInternal/${order.id}`).get();
  if (!internal.exists) throw new Error(`Dados internos ausentes para a OS ${order.id}.`);
  const { laborCents, partsCents } = internal.data();
  if (!Number.isInteger(laborCents) || !Number.isInteger(partsCents)) throw new Error(`Valores inválidos na OS ${order.id}.`);
  plans.push({ id: order.id, totalCents: laborCents + partsCents });
}
console.log(`${plans.length} ordens precisam receber os valores públicos.`);
if (flag !== '--apply') { console.log('Simulação: nenhuma gravação. Use --apply após revisar.'); process.exit(0); }
await mkdir('.cache/migration-backups', { recursive: true });
const backupPath = resolve('.cache/migration-backups', `${projectId}-billing-${Date.now()}.json`);
await writeFile(backupPath, JSON.stringify({ projectId, orders: plans }, null, 2), { flag: 'wx' });
for (const item of plans) await db.doc(`serviceOrders/${item.id}`).update({ totalCents: item.totalCents, paidCents: 0 });
console.log(`Migração concluída. Reversão: --rollback=${backupPath}`);
