import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { firebase } from '../config/firebase';
import { Button, EmptyState, Field, Icon, Loading, Notice, PageHeading, Screen } from '../components/ui';
import { shared, colors } from '../theme';
import { type ServiceOrder, type Vehicle } from '../types';
import { dateLabel, money } from '../utils/domain';
import { errorMessage } from '../utils/errors';
import { changeInitialPassword } from '../services/customers';
import { Attachments } from '../components/Attachments';
import { StatusBadge } from '../components/OrderCard';

export function NoAccessScreen() {
  const { logout, error } = useAuth();
  const [failure, setFailure] = useState('');
  return <Screen><PageHeading title="Acesso não liberado" subtitle="Solicite ao responsável da oficina a associação da sua conta. Criar uma conta no Firebase não concede acesso administrativo." /><Notice text={failure || error} /><Button title="Sair da conta" onPress={() => { logout().catch(e => setFailure(errorMessage(e))); }} /></Screen>;
}
export function InitialPasswordScreen() {
  const { logout } = useAuth();
  const [password, setPassword] = useState(''), [confirmation, setConfirmation] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit() {
    if (password !== confirmation) { setError('As senhas não coincidem.'); return; }
    setBusy(true); setError('');
    try { await changeInitialPassword(password); setPassword(''); setConfirmation(''); await logout(); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <Screen style={{ maxWidth: 520 }}><PageHeading title="Crie sua nova senha" subtitle="Proteja seu acesso antes de acompanhar os veículos. Após salvar, entre novamente com a placa e a nova senha." />
    <Field label="Nova senha" hint="De 8 a 128 caracteres, com letras e números." value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" maxLength={128} editable={!busy} />
    <Field label="Confirmar nova senha" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoCapitalize="none" maxLength={128} editable={!busy} />
    <Notice text={error} /><Button title="Salvar nova senha" busy={busy} onPress={submit} /><Button title="Sair da conta" variant="secondary" disabled={busy} onPress={() => { logout().catch(e => setError(errorMessage(e))); }} />
  </Screen>;
}
export function ClientScreen() {
  const { profile, logout } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]), [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState(''), [pending, setPending] = useState(2), [attempt, setAttempt] = useState(0);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  useEffect(() => {
    setOrders([]); setVehicles([]); setPending(2); setError('');
    if (!profile?.customerId) { setPending(0); return; }
    const subscribe = <T,>(name: string, setter: (rows: T[]) => void) => {
      let first = true;
      const ready = () => { if (first) { first = false; setPending(n => n - 1); } };
      return onSnapshot(query(collection(firebase().db, name), where('customerId', '==', profile.customerId)), snapshot => {
        setter(snapshot.docs.map(d => ({ ...d.data({ serverTimestamps: 'estimate' }), id: d.id }) as T)); ready();
      }, e => { setter([]); setError(errorMessage(e)); ready(); });
    };
    const stops = [subscribe('serviceOrders', setOrders), subscribe('customerVehicles', setVehicles)];
    return () => stops.forEach(stop => stop());
  }, [profile?.customerId, attempt]);
  return <Screen><View style={shared.between}><Icon name="car-sport-outline" size={40} /><Button title="Sair da conta" variant="secondary" onPress={() => { logout().catch(e => setError(errorMessage(e))); }} /></View>
    <PageHeading title="Meus veículos" subtitle="Acompanhe os serviços e as informações publicadas pela oficina." />
    <Notice text={error} />{error && <Button title="Tentar novamente" onPress={() => setAttempt(n => n + 1)} />}
    {pending > 0 ? <Loading /> : !error && <>
      {vehicles.map(v => <View key={v.id} style={shared.card}><Text style={shared.heading}>{v.plate}</Text><Text style={shared.body}>{v.model}</Text></View>)}
      {!orders.length && <EmptyState title="Nenhum serviço em andamento" description="As ordens dos seus veículos aparecerão aqui quando a oficina iniciar um atendimento." />}
      {[...orders].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).map(order => {
        const open = openOrderId === order.id;
        return <View key={order.id} style={[shared.card, { borderLeftWidth: 4, borderLeftColor: order.status === 'Entregue' ? colors.green : colors.blue }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${open ? 'Fechar' : 'Abrir'} ordem ${order.plate}`} accessibilityState={{ expanded: open }} onPress={() => setOpenOrderId(open ? null : order.id)} style={({ pressed }) => ({ gap: 14, opacity: pressed ? 0.7 : 1 })}>
          <View style={shared.between}><Text selectable style={shared.muted}>OS #{order.id.slice(-6).toUpperCase()}</Text><StatusBadge status={order.status} /></View>
          <View style={shared.between}><View style={{ flex: 1, gap: 4 }}><Text style={shared.heading}>{order.vehicle}</Text><Text style={shared.muted}>{order.plate}</Text></View><Icon name={open ? 'chevron-up' : 'chevron-forward'} size={20} /></View>
          <View style={[shared.between, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 }]}><Text style={shared.muted}>{order.deliveryDate ? `Entrega · ${dateLabel(order.deliveryDate.toDate())}` : 'Sem previsão de entrega'}</Text></View>
        </Pressable>
        {open && <View style={{ gap: 14, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14 }}>
        <Text style={shared.muted}>Entrada: {dateLabel(order.entryDate.toDate())}</Text>
        <View style={{ backgroundColor: colors.pale, padding: 14, borderRadius: 10, gap: 5 }}><Text style={shared.label}>Etapa atual</Text><Text style={shared.body}>{order.status}</Text></View>
        <View style={{ gap: 8 }}><View style={shared.between}><Text style={shared.muted}>Valor do serviço</Text><Text style={shared.label}>{money(order.totalCents || 0)}</Text></View><View style={shared.between}><Text style={shared.muted}>Valor pago</Text><Text style={shared.body}>{money(order.paidCents || 0)}</Text></View><View style={shared.between}><Text style={shared.label}>Saldo restante</Text><Text style={shared.heading}>{money(Math.max(0, (order.totalCents || 0) - (order.paidCents || 0)))}</Text></View></View>
        {!!order.publicNotes && <><Text style={shared.label}>Observações da oficina</Text><Text style={shared.body}>{order.publicNotes}</Text></>}
        <Text style={shared.label}>Histórico de atualizações</Text>
        {order.history.length ? order.history.map((event, index) => <Text key={index} style={shared.muted}>{dateLabel(event.occurredAt.toDate())} · {event.stage}{'\n'}{event.note}</Text>) : <Text style={shared.muted}>Veículo recebido pela oficina.</Text>}
        <Attachments orderId={order.id} ownerUid={order.createdBy} readOnly />
        </View>}
      </View>;
      })}
    </>}
  </Screen>;
}
