import { collection, doc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { firebase } from '../config/firebase';
import { nextStage, requireText, validPlate, validateDates } from '../utils/domain';
import type { OrderInput, ServiceOrder, Stage } from '../types';

async function requireAdmin(uid: string) {
  const user = firebase().auth.currentUser;
  if (!user || user.uid !== uid) throw new Error('Sua sessão expirou. Entre novamente.');
  if ((await user.getIdTokenResult()).claims.admin !== true) throw new Error('Sua conta não possui acesso administrativo. Solicite a liberação ao responsável.');
}
function splitInput(input: OrderInput) {
  const { customerName, phone, description, laborCents, partsCents, internalNotes, ...publicData } = input;
  requireText(customerName, 'Nome'); requireText(input.vehicle, 'Veículo'); requireText(description, 'Descrição', 5, 2000);
  if (!validPlate(input.plate)) throw new Error('Informe uma placa válida.');
  if (!/^\d{10,11}$/.test(phone)) throw new Error('Informe telefone com DDD.');
  for (const value of [laborCents, partsCents]) if (!Number.isInteger(value) || value < 0 || value > 100000000) throw new Error('Valor inválido.');
  validateDates(input.entryDate.toDate(), input.deliveryDate?.toDate() ?? input.entryDate.toDate());
  return { publicData, internal: { customerName, phone, description, laborCents, partsCents, internalNotes } };
}
export async function saveOrder(uid: string, input: OrderInput, id: string, editing = false) {
  await requireAdmin(uid);
  const { publicData, internal } = splitInput(input), db = firebase().db;
  const ref = doc(db, 'serviceOrders', id);
  await runTransaction(db, async tx => {
    const [existing, customer, vehicle] = await Promise.all([tx.get(ref), tx.get(doc(db, 'customers', input.customerId)), tx.get(doc(db, 'vehicles', input.vehicleId))]);
    if (!customer.exists() || !vehicle.exists() || vehicle.data().customerId !== input.customerId) throw new Error('Cadastre o cliente e associe o veículo antes de salvar.');
    if (editing && !existing.exists()) throw new Error('Ordem não encontrada.');
    if (!editing && existing.exists()) return; // Stable ID makes retries idempotent.
    if (editing) tx.update(ref, { ...publicData, updatedAt: serverTimestamp() });
    else tx.set(ref, { ...publicData, ownerUid: customer.data().ownerUid || '', createdBy: uid, status: 'Veículo recebido', history: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    tx.set(doc(db, 'serviceOrderInternal', id), internal);
  });
  return id;
}
export const createOrder = (uid: string, input: OrderInput, id: string) => saveOrder(uid, input, id);
export const newOrderId = (_uid: string) => doc(collection(firebase().db, 'serviceOrders')).id;
export async function advanceOrder(uid: string, id: string, expectedStatus: Stage, note: string, date: Date, selected?: Stage) {
  await requireAdmin(uid);
  const db = firebase().db, ref = doc(db, 'serviceOrders', id);
  const cleanNote = requireText(note, 'Observação pública', 3, 1000);
  await runTransaction(db, async tx => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists()) throw new Error('A ordem não foi encontrada.');
    const current = snapshot.data() as ServiceOrder;
    if (current.status !== expectedStatus) throw new Error('Esta ordem foi atualizada. Feche o modal e confira a etapa atual.');
    const status = selected ?? nextStage(current.status);
    if (!status) throw new Error('Selecione o status.');
    const previous = current.history.at(-1)?.occurredAt ?? current.entryDate;
    if (!Number.isFinite(date.getTime()) || date.getTime() < previous.toMillis()) throw new Error('A data não pode ser anterior ao último registro.');
    if (current.history.length >= 100) throw new Error('Limite de 100 atualizações nesta ordem. Contate o responsável.');
    tx.update(ref, { status, publicNotes: cleanNote, history: [...current.history, { stage: status, note: cleanNote, occurredAt: Timestamp.fromDate(date) }], updatedAt: serverTimestamp() });
    tx.set(doc(collection(db, 'serviceOrderUpdates')), { orderId: id, customerId: current.customerId, createdBy: uid, status, publicNotes: cleanNote, occurredAt: Timestamp.fromDate(date), createdAt: serverTimestamp() });
  });
}
export async function createMovement(uid: string, id: string, kind: 'receita' | 'despesa', description: string, amountCents: number, date: Date) {
  await requireAdmin(uid);
  if (!Number.isInteger(amountCents) || amountCents <= 0 || amountCents > 100000000) throw new Error('Informe um valor maior que zero e de até R$ 1.000.000,00.');
  const ref = doc(firebase().db, 'users', uid, 'movements', id);
  const input = { kind, description: requireText(description, 'Descrição', 3, 200), amountCents, occurredAt: Timestamp.fromDate(date) };
  await runTransaction(firebase().db, async tx => { if (!(await tx.get(ref)).exists()) tx.set(ref, { ...input, createdAt: serverTimestamp() }); });
}
export const newMovementId = (uid: string) => doc(collection(firebase().db, 'users', uid, 'movements')).id;
