import { useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useData } from '../contexts/DataContext';
import { Button, Chip, EmptyState, Field, Loading, Notice, PageHeading, styles } from '../components/ui';
import { OrderCard } from '../components/OrderCard';
import { colors, shared } from '../theme';
import { STAGES, LEGACY_STAGES, type Stage } from '../types';
import type { RootStackParams } from '../navigation/types';

export function OrdersScreen() {
  const { orders, loading, error, retry } = useData();
  const [search, setSearch] = useState(''), [stage, setStage] = useState<Stage | 'Todas'>('Todas');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const term = search.trim().toLocaleLowerCase('pt-BR');
  const filtered = orders.filter(o => (stage === 'Todas' || o.status === stage) && `${o.customerName} ${o.plate} ${o.vehicle}`.toLocaleLowerCase('pt-BR').includes(term));
  return <FlatList style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.screen} data={error || loading ? [] : filtered} keyExtractor={o => o.id}
    keyboardShouldPersistTaps="handled" ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
    ListHeaderComponent={<View style={[shared.stack, { marginBottom: 18 }]}>
      <PageHeading title="Ordens de serviço" subtitle="Cada atendimento, do recebimento à entrega." />
      <Button title="Nova ordem" icon="add" onPress={() => navigation.navigate('NovaOrdem')} />
      <Field label="Buscar ordem" placeholder="Cliente, placa ou veículo" value={search} onChangeText={setSearch} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{(['Todas', ...new Set<Stage>([...STAGES, ...LEGACY_STAGES.filter(s => orders.some(o => o.status === s))])] as const).map(s => <Chip key={s} title={s} selected={s === stage} onPress={() => setStage(s)} />)}</ScrollView>
      <Notice text={error} />{error && <Button title="Tentar novamente" onPress={retry} variant="secondary" />}
      {!loading && !error && <Text style={shared.muted}>{filtered.length} ordem(ns) encontrada(s)</Text>}
    </View>}
    renderItem={({ item }) => <OrderCard order={item} onPress={() => navigation.navigate('Detalhes', { id: item.id })} />}
    ListEmptyComponent={loading ? <Loading /> : error ? null : <EmptyState title="Nenhuma ordem encontrada" description={search || stage !== 'Todas' ? 'Tente outra busca ou selecione todas as etapas.' : 'Toque em Nova ordem para cadastrar o primeiro atendimento.'} />} />;
}
