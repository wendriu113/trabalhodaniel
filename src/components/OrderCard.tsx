import { Pressable, Text, View } from 'react-native';
import type { ServiceOrder, Stage } from '../types';
import { colors, shared } from '../theme';
import { dateLabel, money, localDay } from '../utils/domain';
import { Icon } from './ui';

export function StatusBadge({ status }: { status: Stage }) {
  const delivered = status === 'Entregue';
  return <View style={{ backgroundColor: delivered ? colors.greenLight : colors.pale, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
    <Text style={{ fontSize: 12, fontWeight: '700', color: delivered ? colors.green : colors.navy }}>{status}</Text>
  </View>;
}
export function OrderCard({ order, onPress }: { order: ServiceOrder; onPress: () => void }) {
  const late = order.status !== 'Entregue' && order.deliveryDate && order.deliveryDate.toMillis() < localDay(new Date()).getTime();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Abrir ordem ${order.plate}, ${order.customerName}`} onPress={onPress} style={({ pressed }) => [shared.card, { opacity: pressed ? 0.7 : 1, borderLeftWidth: 4, borderLeftColor: order.status === 'Entregue' ? colors.green : colors.blue }]}>
    <View style={shared.between}><Text style={{ fontSize: 13, color: colors.muted }}>OS #{order.id.slice(-6).toUpperCase()}</Text><StatusBadge status={order.status} /></View>
    <View style={shared.between}><View style={{ flex: 1, gap: 4 }}><Text style={shared.heading}>{order.vehicle}</Text><Text style={shared.muted}>{order.plate} · {order.customerName}</Text></View><Icon name="chevron-forward" size={20} /></View>
    <View style={[shared.between, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, flexWrap: 'wrap' }]}>
      <Text style={{ fontSize: 13, color: late ? colors.red : colors.muted }}>{order.deliveryDate ? `${late ? 'Prazo vencido' : 'Entrega'} · ${dateLabel(order.deliveryDate.toDate())}` : 'Sem previsão de entrega'}</Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>{money(order.laborCents + order.partsCents)}</Text>
    </View>
  </Pressable>;
}
