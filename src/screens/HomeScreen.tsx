import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Button, EmptyState, Icon, Loading, Notice, PageHeading, Screen } from '../components/ui';
import { OrderCard } from '../components/OrderCard';
import { colors, shared } from '../theme';
import { localDay, money, summarize } from '../utils/domain';
import type { RootStackParams } from '../navigation/types';

export function HomeScreen() {
  const { user } = useAuth();
  const { orders, movements, loading, error, retry } = useData();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const active = orders.filter(o => o.status !== 'Entregue');
  const late = active.filter(o => o.deliveryDate && o.deliveryDate.toMillis() < localDay(new Date()).getTime());
  const upcoming = active.filter(o => o.deliveryDate).sort((a, b) => a.deliveryDate!.toMillis() - b.deliveryDate!.toMillis()).slice(0, 3);
  const { balance } = summarize(movements);
  return <Screen>
    <PageHeading title={`Olá, ${user?.displayName?.split(' ')[0] || 'bem-vindo'}.`} subtitle="Veja o que precisa de atenção na sua oficina." />
    <View style={{ backgroundColor: colors.navy, borderRadius: 18, padding: 24, gap: 20 }}>
      <View style={shared.between}><View style={{ flex: 1, gap: 8 }}><Text style={{ fontSize: 14, color: '#D4E6FA' }}>Na oficina agora</Text><Text style={{ color: '#FFFFFF', fontSize: 48, fontWeight: '800' }}>{loading || error ? '—' : active.length}</Text><Text style={{ color: '#D4E6FA', fontSize: 15 }}>veículos em atendimento</Text></View><Icon name="car-sport-outline" color="#AACCF0" size={70} /></View>
      <Button title="Abrir ordem de serviço" icon="add" variant="secondary" onPress={() => navigation.navigate('NovaOrdem')} />
    </View>
    <Notice text={error} />{error ? <Button title="Tentar novamente" variant="secondary" onPress={retry} /> : null}
    {loading ? <Loading /> : !error && <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <View style={[shared.card, { flex: 1, minWidth: 135 }]}><Icon name="time-outline" color={late.length ? colors.red : colors.blue} /><Text style={{ fontSize: 28, fontWeight: '800', color: late.length ? colors.red : colors.ink }}>{late.length}</Text><Text style={shared.muted}>com prazo vencido</Text></View>
        <View style={[shared.card, { flex: 1, minWidth: 135 }]}><Icon name="wallet-outline" /><Text style={{ fontSize: 24, fontWeight: '800', color: balance < 0 ? colors.red : colors.green }}>{money(balance)}</Text><Text style={shared.muted}>saldo registrado</Text></View>
      </View>
      <View style={{ gap: 6 }}><Text style={shared.heading}>Próximas entregas</Text><Text style={shared.muted}>Ordens abertas, em ordem de prazo.</Text></View>
      {upcoming.length ? upcoming.map(order => <OrderCard key={order.id} order={order} onPress={() => navigation.navigate('Detalhes', { id: order.id })} />) : <EmptyState title="Tudo em dia por aqui" description="Abra uma ordem para começar a acompanhar um veículo." icon="checkmark-done-outline" />}
    </>}
  </Screen>;
}
