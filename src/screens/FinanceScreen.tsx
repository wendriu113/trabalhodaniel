import { useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useData } from '../contexts/DataContext';
import { Button, EmptyState, Icon, Loading, Notice, PageHeading, Screen } from '../components/ui';
import { DateField } from '../components/DateField';
import { colors, shared } from '../theme';
import { dateLabel, localDay, money, summarize } from '../utils/domain';
import type { RootStackParams } from '../navigation/types';

export function FinanceScreen() {
  const { movements, loading, error, retry } = useData();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const now = new Date();
  const [from, setFrom] = useState(new Date(now.getFullYear(), now.getMonth(), 1, 12));
  const [to, setTo] = useState(new Date(now.getFullYear(), now.getMonth() + 1, 0, 12));
  const invalid = from > to;
  const filtered = invalid ? [] : movements.filter(m => { const time = localDay(m.occurredAt.toDate()).getTime(); return time >= from.getTime() && time <= to.getTime(); }).sort((a, b) => b.occurredAt.toMillis() - a.occurredAt.toMillis());
  const totals = summarize(filtered);
  return <Screen>
    <PageHeading title="Financeiro" subtitle="Controle o que entrou e o que saiu da oficina." />
    <Button title="Novo lançamento" icon="add" onPress={() => navigation.navigate('NovoLancamento')} />
    <View style={shared.card}><Text style={shared.heading}>Período do relatório</Text><DateField label="De" value={from} onChange={setFrom} /><DateField label="Até" value={to} onChange={setTo} minimumDate={from} /></View>
    <Notice text={invalid ? 'A data final deve ser igual ou posterior à inicial.' : error} />{error && <Button title="Tentar novamente" onPress={retry} variant="secondary" />}
    {loading ? <Loading /> : !invalid && !error && <>
      <View style={shared.card}>
        <View style={shared.between}><Text style={shared.muted}>Receitas</Text><Text style={{ color: colors.green, fontSize: 20, fontWeight: '700' }}>{money(totals.income)}</Text></View>
        <View style={shared.between}><Text style={shared.muted}>Despesas</Text><Text style={{ color: colors.red, fontSize: 20, fontWeight: '700' }}>{money(totals.expense)}</Text></View>
        <View style={[shared.between, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 16 }]}><Text style={shared.label}>Saldo do período</Text><Text style={{ fontSize: 26, fontWeight: '800', color: totals.balance < 0 ? colors.red : colors.navy }}>{money(totals.balance)}</Text></View>
        <Text style={shared.muted}>Considera somente lançamentos registrados, sem incluir orçamentos de ordens de serviço.</Text>
      </View>
      <Text style={shared.heading}>Movimentações</Text>
      {filtered.length ? filtered.map(item => <View key={item.id} style={[shared.card, shared.row]}>
        <View style={{ backgroundColor: item.kind === 'receita' ? colors.greenLight : colors.redLight, padding: 10, borderRadius: 10 }}><Icon name={item.kind === 'receita' ? 'arrow-down-outline' : 'arrow-up-outline'} color={item.kind === 'receita' ? colors.green : colors.red} /></View>
        <View style={{ flex: 1, gap: 4 }}><Text style={shared.label}>{item.description}</Text><Text style={shared.muted}>{dateLabel(item.occurredAt.toDate())} · {item.kind === 'receita' ? 'Receita' : 'Despesa'}</Text><Text style={{ fontSize: 18, fontWeight: '700', color: item.kind === 'receita' ? colors.green : colors.red }}>{money(item.amountCents)}</Text></View>
      </View>) : <EmptyState title="Sem lançamentos no período" description="Registre um recebimento ou uma despesa para começar o controle financeiro." icon="wallet-outline" />}
    </>}
  </Screen>;
}
