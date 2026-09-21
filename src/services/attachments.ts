import { collection, doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { firebase, storageReady } from '../config/firebase';
import { requireText } from '../utils/domain';

export type PickedFile = { uri: string; name: string; contentType: string; size?: number };
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function uploadAttachment(uid: string, orderId: string, kind: 'foto' | 'nota', file: PickedFile, caption: string, date: Date) {
  if (!storageReady) throw new Error('Configure o bucket do Firebase Storage para enviar anexos.');
  const cleanCaption = requireText(caption, 'Descrição do anexo', 3, 300);
  const allowed = kind === 'foto' ? ['image/jpeg', 'image/png'] : ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowed.includes(file.contentType)) throw new Error('Selecione um arquivo JPG, PNG ou, para nota fiscal, PDF.');
  if (file.size && file.size > MAX_FILE_SIZE) throw new Error('O arquivo deve ter no máximo 5 MB.');
  const response = await fetch(file.uri);
  const blob = await response.blob();
  if (!blob.size || blob.size > MAX_FILE_SIZE) throw new Error('O arquivo está vazio ou excede 5 MB.');
  const attachmentRef = doc(collection(firebase().db, 'users', uid, 'orders', orderId, 'attachments'));
  const storagePath = `users/${uid}/orders/${orderId}/${attachmentRef.id}`;
  const objectRef = ref(firebase().storage, storagePath);
  try {
    await uploadBytes(objectRef, blob, { contentType: file.contentType });
    await setDoc(attachmentRef, { kind, name: file.name.slice(0, 180), caption: cleanCaption, storagePath,
      contentType: file.contentType, size: blob.size, occurredAt: Timestamp.fromDate(date), createdAt: serverTimestamp() });
  } catch (error) {
    // Evita arquivo órfão quando o upload termina, mas o registro falha.
    await deleteObject(objectRef).catch(() => undefined);
    throw error;
  } finally { (blob as Blob & { close?: () => void }).close?.(); }
}
export const attachmentUrl = (path: string) => getDownloadURL(ref(firebase().storage, path));
