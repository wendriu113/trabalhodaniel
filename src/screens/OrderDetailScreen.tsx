import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Button, Chip, EmptyState, Field, FormModal, Icon, Loading, Notice, Screen } from '../components/ui';
import { DateField } from '../components/DateField';
import { StatusBadge } from '../components/OrderCard';
import { Attachments } from '../components/Attachments';
import { colors, shared } from '../theme';
import { stagesFor, type Stage } from '../types';
import { dateLabel, localDay, money, nextStage, parseMoney } from '../utils/domain';
import { errorMessage } from '../utils/errors';
import { advanceOrder, newMovementId, registerOrderPayment } from '../services/orders';
import type { RootStackParams } from '../navigation/types';

export function OrderDetailScreen({ route, navigation }: NativeStackScreenProps<RootStackParams, 'Detalhes'>) {
  const { user } = useAuth();
  const { orders, movements, loading, error: loadError, retry } = useData();
  const order = orders.find(o => o.id === route.params.id);
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
  const [note, setNote] = useState(''), [date, setDate] = useState(localDay(new Date()));
  const [expected, setExpected] = useState<Stage>('Recebido');
  const [selected, setSelected] = useState<Stage>('Aguardando peças');
  const [paymentOpen, setPaymentOpen] = useState(false), [payment, setPayment] = useState(''), [paymentDescription, setPaymentDescription] = useState('');
  const [paymentDate, setPaymentDate] = useState(localDay(new Date())), [paymentId, setPaymentId] = useState('');
  const saving = useRef(false);
  if (loading) return <Screen><Loading /></Screen>;
  if (loadError) return <Screen><Notice text={loadError} /><Button title="Tentar novamente" onPress={retry} /></Screen>;
  if (!order) return <Screen><EmptyState title="Ordem não encontrada" description="Volte à lista de ordens e tente novamente." /></Screen>;
  const stages = stagesFor(order.status), next = nextStage(order.status), currentIndex = Math.max(0, stages.indexOf(order.status), next ? stages.indexOf(next) - 1 : -1);
  const payments = movements.filter(movement => movement.orderId === order.id).sort((a, b) => b.occurredAt.toMillis() - a.occurredAt.toMillis());
  const totalCents = order.totalCents ?? order.laborCents + order.partsCents, paidCents = order.paidCents || 0;
  async function advance() {
    if (!user || !order || saving.current) return;
    saving.current = true; setBusy(true); setError('');
    try { await advanceOrder(user.uid, order.id, expected, note, date, selected); setOpen(false); setSuccess('Etapa atualizada. O histórico do reparo foi salvo.'); }
    catch (e) { setError(errorMessage(e)); } finally { saving.current = false; setBusy(false); }
  }
  async function savePayment() {
    if (!user || !order || saving.current) return;
    saving.current = true; setBusy(true); setError('');
    try {
      await registerOrderPayment(user.uid, order.id, paymentId, paymentDescription, parseMoney(payment), paymentDate);
      setPaymentOpen(false); setSuccess('Pagamento registrado na ordem e no financeiro.');
    } catch (e) { setError(errorMessage(e)); } finally { saving.current = false; setBusy(false); }
  }
  return <Screen>
    <View style={{ gap: 10 }}><View style={shared.between}><Text style={shared.muted}>OS #{order.id.slice(-6).toUpperCase()}</Text><StatusBadge status={order.status} /></View>
      <Text accessibilityRole="header" style={shared.title}>{order.vehicle}</Text><Text style={shared.body}>{order.plate} · {order.customerName}</Text>
    </View>
    <Notice text={success} success />
    {order.legacyUid ? <Notice text="Ordem preservada do formato anterior. Associe cliente e veículo pelo procedimento de migração antes de editar ou liberar ao cliente." /> : <Button title="Editar ordem" variant="secondary" onPress={() => navigation.navigate('NovaOrdem', { id: order.id })} />}
    <View style={shared.card}><Text style={shared.heading}>Andamento do reparo</Text>
      {stages.map((stage, index) => <View key={stage} style={shared.row}>
        <View style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: index <= currentIndex ? colors.blue : colors.background }}><Icon name={index < currentIndex ? 'checkmark' : index === currentIndex ? 'build-outline' : 'ellipse-outline'} size={16} color={index <= currentIndex ? '#FFFFFF' : colors.muted} /></View>
        <Text style={{ color: index <= currentIndex ? colors.ink : colors.muted, fontSize: 15, fontWeight: index === currentIndex ? '700' : '400', flex: 1 }}>{stage}</Text>
        {index === currentIndex && <Text style={{ fontSize: 12, color: colors.blue }}>Etapa atual</Text>}
      </View>)}
      {!order.legacyUid && <Button title="Atualizar andamento" icon="arrow-forward-outline" onPress={() => { setExpected(order.status); setSelected(nextStage(order.status) || order.status); setNote(''); setDate(localDay(new Date())); setError(''); setOpen(true); }} />}
    </View>
    <View style={shared.card}><Text style={shared.heading}>Informações do atendimento</Text><Text style={shared.body}>{order.description}</Text>
      <Text style={shared.muted}>{`Cliente: ${order.customerName}\nTelefone: ${order.phone}\nEntrada: ${dateLabel(order.entryDate.toDate())}\nPrevisão de entrega: ${order.deliveryDate ? dateLabel(order.deliveryDate.toDate()) : 'Não informada'}`}</Text>
    </View>
    <View style={shared.card}><Text style={shared.heading}>Orçamento e pagamentos</Text><View style={shared.between}><Text style={shared.muted}>Mão de obra</Text><Text style={shared.body}>{money(order.laborCents)}</Text></View><View style={shared.between}><Text style={shared.muted}>Peças e materiais</Text><Text style={shared.body}>{money(order.partsCents)}</Text></View><View style={shared.between}><Text style={shared.label}>Total</Text><Text style={shared.heading}>{money(totalCents)}</Text></View><View style={shared.between}><Text style={shared.muted}>Pago</Text><Text style={shared.body}>{money(paidCents)}</Text></View><View style={shared.between}><Text style={shared.label}>Saldo</Text><Text style={shared.heading}>{money(totalCents - paidCents)}</Text></View>
      {payments.map(item => <View key={item.id} style={[shared.between, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }]}><View style={{ flex: 1 }}><Text style={shared.body}>{item.description}</Text><Text style={shared.muted}>{dateLabel(item.occurredAt.toDate())}</Text></View><Text style={shared.label}>{money(item.amountCents)}</Text></View>)}
      {!order.legacyUid && paidCents < totalCents && <Button title="Registrar pagamento" icon="cash-outline" onPress={() => { if (!user) return; setPayment(''); setPaymentDescription(`Pagamento ${order.plate} ${order.customerName}`); setPaymentDate(localDay(new Date())); setPaymentId(newMovementId(user.uid)); setError(''); setPaymentOpen(true); }} />}
    </View>
    <View style={shared.card}><Text style={shared.heading}>Observações públicas</Text><Text style={shared.body}>{order.publicNotes || 'Nenhuma observação publicada.'}</Text><Text style={shared.heading}>Informações internas</Text><Text style={shared.body}>{order.internalNotes || 'Nenhuma informação interna.'}</Text></View>
    <Attachments orderId={order.legacyOrderId || order.id} ownerUid={order.createdBy} />
    <View style={shared.card}><Text style={shared.heading}>Histórico</Text>
      <Text style={shared.muted}>{`${dateLabel(order.entryDate.toDate())} · Recebido\nAtendimento aberto na oficina.`}</Text>
      {order.history.map((event, index) => <View key={index} style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, gap: 5 }}><Text style={shared.label}>{dateLabel(event.occurredAt.toDate())} · {event.stage}</Text><Text style={shared.muted}>{event.note}</Text></View>)}
    </View>
    <FormModal title="Atualizar andamento" visible={open} onClose={() => setOpen(false)} busy={busy}>
      <Text style={shared.body}>Status atual: {expected}. Selecione a nova etapa.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{stages.map(stage => <Chip key={stage} title={stage} selected={selected === stage} onPress={() => setSelected(stage)} />)}</View>
      <Field label="O que foi realizado?" hint="Esta atualização será visível para o cliente." placeholder="Descreva o trabalho realizado nesta etapa." value={note} onChangeText={setNote} multiline maxLength={1000} editable={!busy} />
      <DateField label="Data da atualização" value={date} onChange={setDate} minimumDate={(order.history.at(-1)?.occurredAt ?? order.entryDate).toDate()} />
      <Notice text={error} /><Button title="Confirmar etapa" onPress={advance} busy={busy} />
    </FormModal>
    <FormModal title="Registrar pagamento" visible={paymentOpen} onClose={() => setPaymentOpen(false)} busy={busy}>
      <Text style={shared.muted}>Saldo atual: {money(totalCents - paidCents)}. O lançamento também aparecerá no financeiro.</Text>
      <Field label="Valor pago (R$)" value={payment} onChangeText={setPayment} keyboardType="decimal-pad" placeholder="0,00" editable={!busy} />
      <Field label="Descrição do pagamento" value={paymentDescription} onChangeText={setPaymentDescription} maxLength={200} editable={!busy} />
      <DateField label="Data do pagamento" value={paymentDate} onChange={setPaymentDate} />
      <Notice text={error} /><Button title="Salvar pagamento" onPress={savePayment} busy={busy} />
    </FormModal>
  </Screen>;
}
