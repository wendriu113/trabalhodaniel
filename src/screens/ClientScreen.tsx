import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { firebase } from '../config/firebase';
import { Button, EmptyState, Field, Icon, Loading, Notice, PageHeading, Screen } from '../components/ui';
import { shared, colors } from '../theme';
import { stagesFor, type ServiceOrder, type Vehicle } from '../types';
import { dateLabel } from '../utils/domain';
import { errorMessage } from '../utils/errors';
import { changeInitialPassword } from '../services/customers';

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
    <Field label="Nova senha" hint="De 12 a 128 caracteres, com letras e números." value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" maxLength={128} editable={!busy} />
    <Field label="Confirmar nova senha" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoCapitalize="none" maxLength={128} editable={!busy} />
    <Notice text={error} /><Button title="Salvar nova senha" busy={busy} onPress={submit} /><Button title="Sair da conta" variant="secondary" disabled={busy} onPress={() => { logout().catch(e => setError(errorMessage(e))); }} />
  </Screen>;
}
export function ClientScreen() {
  const { profile, logout } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]), [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState(''), [pending, setPending] = useState(2), [attempt, setAttempt] = useState(0);
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
      {[...orders].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).map(order => <View key={order.id} style={shared.card}>
        <Text style={shared.heading}>{order.plate} · {order.vehicle}</Text><Text selectable style={shared.muted}>OS #{order.id}</Text>
        <Text style={shared.body}>Status atual: {order.status}</Text>
        <Text style={shared.muted}>Entrada: {dateLabel(order.entryDate.toDate())}{'\n'}Previsão: {order.deliveryDate ? dateLabel(order.deliveryDate.toDate()) : 'Ainda não informada'}</Text>
        {stagesFor(order.status).map(stage => {
          const completed = order.history.some(event => event.stage === stage) || stage === 'Veículo recebido' || stage === 'Recebido';
          return <View key={stage} style={shared.row}><Icon name={completed ? 'checkmark-circle' : 'ellipse-outline'} color={completed ? colors.green : colors.muted} size={20} /><Text style={stage === order.status ? shared.label : shared.muted}>{stage}{stage === order.status ? ' · atual' : ''}</Text></View>;
        })}
        {!!order.publicNotes && <><Text style={shared.label}>Observações da oficina</Text><Text style={shared.body}>{order.publicNotes}</Text></>}
        <Text style={shared.label}>Histórico de atualizações</Text>
        {order.history.length ? order.history.map((event, index) => <Text key={index} style={shared.muted}>{dateLabel(event.occurredAt.toDate())} · {event.stage}{'\n'}{event.note}</Text>) : <Text style={shared.muted}>Veículo recebido pela oficina.</Text>}
      </View>)}
    </>}
  </Screen>;
}
