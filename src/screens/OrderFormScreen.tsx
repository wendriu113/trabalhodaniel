import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Timestamp } from 'firebase/firestore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Button, Field, Notice, PageHeading, Screen } from '../components/ui';
import { DateField } from '../components/DateField';
import { shared } from '../theme';
import { localDay, money, normalizePlate, parseMoney, requireText, validateDates } from '../utils/domain';
import { errorMessage } from '../utils/errors';
import { saveOrder, newOrderId } from '../services/orders';
import type { RootStackParams } from '../navigation/types';

export function OrderFormScreen({ navigation, route }: NativeStackScreenProps<RootStackParams, 'NovaOrdem'>) {
  const { user } = useAuth();
  const { orders, vehicles, customers } = useData();
  const existing = orders.find(o => o.id === route.params?.id);
  const [vehicle, setVehicle] = useState(existing?.vehicle || ''), [plate, setPlate] = useState(existing?.plate || ''), [description, setDescription] = useState(existing?.description || '');
  const linkedVehicle = vehicles.find(v => v.plate === normalizePlate(plate));
  const customer = customers.find(c => c.id === linkedVehicle?.customerId);
  const customerName = customer?.name || '', phone = customer?.phone || '';
  const [publicNotes, setPublicNotes] = useState(existing?.publicNotes || ''), [internalNotes, setInternalNotes] = useState(existing?.internalNotes || '');
  const [entryDate, setEntryDate] = useState(existing?.entryDate.toDate() || localDay(new Date()));
  const [deliveryDate, setDeliveryDate] = useState(existing?.deliveryDate?.toDate() || localDay(new Date(Date.now() + 7 * 86400000)));
  const [hasEstimate, setHasEstimate] = useState(!!existing?.deliveryDate);
  const [labor, setLabor] = useState(existing ? (existing.laborCents / 100).toFixed(2).replace('.', ',') : '0,00'), [parts, setParts] = useState(existing ? (existing.partsCents / 100).toFixed(2).replace('.', ',') : '0,00');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const id = useRef<string | null>(null), saving = useRef(false);
  let total = 'Preencha os valores';
  try { total = money(parseMoney(labor) + parseMoney(parts)); } catch { /* O formulário mostrará o erro ao salvar. */ }
  async function submit() {
    if (!user || saving.current) return;
    setError('');
    try {
      if (!customer || !linkedVehicle) throw new Error('Cadastre o cliente e o veículo na aba Clientes antes de salvar a ordem.');
      const digits = phone.replace(/\D/g, '');
      if (!/^\d{10,11}$/.test(digits)) throw new Error('Informe o telefone com DDD, com 10 ou 11 dígitos.');
      validateDates(entryDate, hasEstimate ? deliveryDate : entryDate);
      const input = { customerId: customer.id, vehicleId: linkedVehicle.id, publicNotes: publicNotes.trim(), internalNotes: internalNotes.trim(), customerName: requireText(customerName, 'Nome do cliente'), phone: digits,
        vehicle: requireText(vehicle, 'Veículo'), plate: normalizePlate(plate), description: requireText(description, 'Serviço', 5, 2000),
        entryDate: Timestamp.fromDate(entryDate), deliveryDate: hasEstimate ? Timestamp.fromDate(deliveryDate) : null, laborCents: parseMoney(labor), partsCents: parseMoney(parts) };
      saving.current = true; setBusy(true); id.current ??= existing?.id || newOrderId(user.uid);
      await saveOrder(user.uid, input, id.current, !!existing);
      navigation.replace('Detalhes', { id: id.current });
    } catch (e) { setError(errorMessage(e)); } finally { saving.current = false; setBusy(false); }
  }
  return <Screen>
    <PageHeading title={existing ? 'Editar atendimento' : 'Novo atendimento'} subtitle="Selecione a placa de um veículo cadastrado na aba Clientes." />
    <View style={shared.card}><Text style={shared.heading}>Cliente e veículo</Text>
      <Field label="Nome do cliente" value={customerName} editable={false} />
      <Field label="Telefone com DDD" value={phone} editable={false} />
      <Field label="Veículo" placeholder="Ex.: Chevrolet Onix 2020 · prata" value={vehicle} onChangeText={setVehicle} maxLength={160} editable={!busy} />
      <Field label="Placa" placeholder="ABC1D23" value={plate} onChangeText={v => { const normalized = normalizePlate(v); setPlate(normalized); const found = vehicles.find(item => item.plate === normalized); if (found) setVehicle(found.model); }} autoCapitalize="characters" editable={!busy && !existing} />
    </View>
    <View style={shared.card}><Text style={shared.heading}>Serviço e prazo</Text>
      <Field label="Descrição do serviço" placeholder="Ex.: Reparar e pintar o para-lama dianteiro esquerdo." value={description} onChangeText={setDescription} multiline maxLength={2000} editable={!busy} />
      <DateField label="Data de entrada" value={entryDate} onChange={setEntryDate} />
      <Button title={hasEstimate ? 'Remover previsão de entrega' : 'Definir previsão de entrega'} variant="secondary" disabled={busy} onPress={() => setHasEstimate(v => !v)} />
      {hasEstimate && <DateField label="Previsão de entrega" value={deliveryDate} onChange={setDeliveryDate} minimumDate={entryDate} />}
      <Field label="Observação pública" value={publicNotes} onChangeText={setPublicNotes} multiline maxLength={2000} editable={!busy} hint="Visível para o cliente." />
      <Field label="Informações internas" value={internalNotes} onChangeText={setInternalNotes} multiline maxLength={4000} editable={!busy} hint="Somente administradores podem ler este campo." />
    </View>
    <View style={shared.card}><Text style={shared.heading}>Orçamento inicial</Text>
      <Field label="Mão de obra (R$)" value={labor} onChangeText={setLabor} keyboardType="decimal-pad" editable={!busy} />
      <Field label="Peças e materiais (R$)" value={parts} onChangeText={setParts} keyboardType="decimal-pad" editable={!busy} />
      <View style={shared.between}><Text style={shared.label}>Total previsto</Text><Text style={shared.heading}>{total}</Text></View>
      <Text style={shared.muted}>O orçamento não gera uma receita. Registre o recebimento na aba Financeiro.</Text>
    </View>
    <Notice text={error} />
    <Button title="Salvar ordem de serviço" busy={busy} icon="checkmark" onPress={submit} />
  </Screen>;
}
