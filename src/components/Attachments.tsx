import { useEffect, useRef, useState } from 'react';
import { Image, Linking, Text, View } from 'react-native';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { firebase } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { attachmentUrl, uploadAttachment, type PickedFile } from '../services/attachments';
import type { Attachment } from '../types';
import { colors, shared } from '../theme';
import { dateLabel, localDay } from '../utils/domain';
import { errorMessage } from '../utils/errors';
import { Button, Chip, Field, FormModal, Icon, Notice } from './ui';
import { DateField } from './DateField';

export function Attachments({ orderId, ownerUid }: { orderId: string; ownerUid: string }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Attachment[]>([]), [error, setError] = useState('');
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<'foto' | 'nota'>('foto'), [file, setFile] = useState<PickedFile | null>(null);
  const [caption, setCaption] = useState(''), [date, setDate] = useState(localDay(new Date()));
  const [modalError, setModalError] = useState(''), [success, setSuccess] = useState('');
  const [preview, setPreview] = useState<{ uri: string; name: string } | null>(null);
  const saving = useRef(false);
  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(firebase().db, 'users', ownerUid, 'orders', orderId, 'attachments'), orderBy('createdAt', 'desc')),
      snap => { setItems(snap.docs.map(d => ({ ...d.data(), id: d.id }) as Attachment)); setError(''); }, e => setError(errorMessage(e)));
  }, [user?.uid, ownerUid, orderId]);
  async function pick() {
    setModalError('');
    try {
      if (kind === 'foto') {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75 });
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          setFile({ uri: asset.uri, name: asset.fileName || 'foto-reparo.jpg', contentType: asset.mimeType || 'image/jpeg', size: asset.fileSize });
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png'], copyToCacheDirectory: true });
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          setFile({ uri: asset.uri, name: asset.name, contentType: asset.mimeType || 'application/pdf', size: asset.size });
        }
      }
    } catch (e) { setModalError(errorMessage(e)); }
  }
  async function save() {
    if (!user || saving.current) return;
    if (!file) { setModalError('Selecione um arquivo.'); return; }
    saving.current = true; setBusy(true); setModalError('');
    try { await uploadAttachment(ownerUid, orderId, kind, file, caption, date); setOpen(false); setSuccess('Anexo salvo na ordem de serviço.'); }
    catch (e) { setModalError(errorMessage(e)); } finally { saving.current = false; setBusy(false); }
  }
  async function show(item: Attachment) {
    setError('');
    try {
      const uri = await attachmentUrl(item.storagePath);
      if (item.contentType.startsWith('image/')) setPreview({ uri, name: item.caption });
      else await Linking.openURL(uri);
    } catch (e) { setError(errorMessage(e)); }
  }
  return <View style={shared.card}>
    <Text style={shared.heading}>Fotos e notas fiscais</Text>
    <Text style={shared.muted}>Guarde os registros do reparo e os comprovantes deste serviço.</Text>
    <Notice text={error} /><Notice text={success} success />
    {!items.length && <Text style={shared.muted}>Nenhum anexo nesta ordem.</Text>}
    {items.map(item => <View key={item.id} style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14, gap: 9 }}>
      <View style={shared.row}><Icon name={item.kind === 'foto' ? 'image-outline' : 'document-text-outline'} /><View style={{ flex: 1 }}><Text style={shared.label}>{item.caption}</Text><Text style={shared.muted}>{dateLabel(item.occurredAt.toDate())} · {Math.ceil(item.size / 1024)} KB</Text></View></View>
      <Button title={`Abrir ${item.kind === 'foto' ? 'foto' : 'nota'}: ${item.name}`} variant="secondary" onPress={() => show(item)} />
    </View>)}
    <Button title="Adicionar anexo" icon="attach-outline" variant="secondary" onPress={() => { setFile(null); setCaption(''); setDate(localDay(new Date())); setModalError(''); setSuccess(''); setOpen(true); }} />
    <FormModal title="Adicionar anexo" visible={open} busy={busy} onClose={() => setOpen(false)}>
      <View style={shared.row}><Chip title="Foto do reparo" selected={kind === 'foto'} onPress={() => { if (!busy) { setKind('foto'); setFile(null); } }} /><Chip title="Nota fiscal" selected={kind === 'nota'} onPress={() => { if (!busy) { setKind('nota'); setFile(null); } }} /></View>
      <Text style={shared.muted}>JPG e PNG; notas também aceitam PDF. Até 5 MB por arquivo.</Text>
      <Button title={file ? 'Trocar arquivo' : 'Selecionar arquivo'} onPress={pick} variant="secondary" disabled={busy} />
      {file && <Text style={shared.body}>{file.name}</Text>}
      <Field label="Descrição do anexo" value={caption} onChangeText={setCaption} maxLength={300} editable={!busy} />
      <DateField label={kind === 'foto' ? 'Data da foto' : 'Data de emissão da nota'} value={date} onChange={setDate} />
      <Notice text={modalError} /><Button title="Salvar anexo" onPress={save} busy={busy} />
    </FormModal>
    <FormModal title={preview?.name || 'Foto do reparo'} visible={!!preview} onClose={() => setPreview(null)}>
      {preview && <Image source={{ uri: preview.uri }} accessibilityLabel={preview.name} style={{ width: '100%', height: 320 }} resizeMode="contain" />}
    </FormModal>
  </View>;
}
