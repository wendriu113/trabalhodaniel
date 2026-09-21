import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { Button, Chip, Field, Notice, PageHeading, Screen } from '../components/ui';
import { DateField } from '../components/DateField';
import { shared } from '../theme';
import { localDay, parseMoney } from '../utils/domain';
import { errorMessage } from '../utils/errors';
import { createMovement, newMovementId } from '../services/orders';
import type { RootStackParams } from '../navigation/types';

export function MovementFormScreen({ navigation }: NativeStackScreenProps<RootStackParams, 'NovoLancamento'>) {
  const { user } = useAuth();
  const [kind, setKind] = useState<'receita' | 'despesa'>('receita');
  const [description, setDescription] = useState(''), [amount, setAmount] = useState('');
  const [date, setDate] = useState(localDay(new Date())), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const id = useRef<string | null>(null), saving = useRef(false);
  async function submit() {
    if (!user || saving.current) return;
    setError('');
    try {
      const amountCents = parseMoney(amount);
      id.current ??= newMovementId(user.uid); saving.current = true; setBusy(true);
      await createMovement(user.uid, id.current, kind, description, amountCents, date);
      navigation.goBack();
    } catch (e) { setError(errorMessage(e)); } finally { saving.current = false; setBusy(false); }
  }
  return <Screen>
    <PageHeading title="Novo lançamento" subtitle="Registre um valor efetivamente recebido ou pago." />
    <View style={shared.card}><Text style={shared.label}>Tipo de movimentação</Text>
      <View style={shared.row}><Chip title="Receita" selected={kind === 'receita'} onPress={() => { if (!busy) setKind('receita'); }} /><Chip title="Despesa" selected={kind === 'despesa'} onPress={() => { if (!busy) setKind('despesa'); }} /></View>
      <Field label="Descrição" placeholder="Ex.: Recebimento da pintura do Onix" value={description} onChangeText={setDescription} maxLength={200} editable={!busy} />
      <Field label="Valor (R$)" placeholder="0,00" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" editable={!busy} />
      <DateField label="Data do lançamento" value={date} onChange={setDate} />
    </View>
    <Notice text={error} /><Button title="Salvar lançamento" busy={busy} onPress={submit} />
  </Screen>;
}
