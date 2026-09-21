import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { collection, doc } from 'firebase/firestore';
import { firebase } from '../config/firebase';
import { useData } from '../contexts/DataContext';
import { Button, EmptyState, Field, Loading, Notice, PageHeading, Screen } from '../components/ui';
import { shared } from '../theme';
import { saveCustomer, saveVehicle, provisionClient } from '../services/customers';
import { normalizePlate, validCpf, normalizeCpf } from '../../functions/validation';
import { errorMessage } from '../utils/errors';

export function CustomersScreen() {
  const { customers, vehicles, loading, error: loadError, retry } = useData();
  const [selected, setSelected] = useState(''), [name, setName] = useState(''), [phone, setPhone] = useState('');
  const [plate, setPlate] = useState(''), [model, setModel] = useState(''), [cpf, setCpf] = useState('');
  const [error, setError] = useState(''), [success, setSuccess] = useState(''), [busy, setBusy] = useState(false), [search, setSearch] = useState('');
  const newId = useRef(''), saving = useRef(false);
  async function perform(action: () => Promise<void | string>, message: string) {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError(''); setSuccess('');
    try { const result = await action(); setSuccess(result || message); }
    catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); saving.current = false; }
  }
  const current = customers.find(c => c.id === selected);
  return <Screen><PageHeading title="Clientes e veículos" subtitle="Cadastre o titular, associe os veículos e libere o acompanhamento por placa." />
    <Notice text={loadError} />{loadError && <Button title="Tentar novamente" onPress={retry} />}
    <Notice text={error} /><Notice text={success} success />
    <View style={shared.card}><Text style={shared.heading}>{selected ? `Cliente selecionado: ${current?.name || name}` : 'Novo cliente'}</Text>
      <Field label="Nome do cliente" value={name} onChangeText={setName} maxLength={160} editable={!busy} />
      <Field label="Telefone com DDD" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={18} editable={!busy} />
      <Button title="Salvar cliente" busy={busy} onPress={() => perform(async () => {
        newId.current ||= doc(collection(firebase().db, 'customers')).id;
        const id = selected || newId.current;
        await saveCustomer({ id, name, phone }); setSelected(id); newId.current = '';
      }, 'Cliente salvo. Cadastre ou selecione um veículo.')} />
      {!!selected && <Button title="Cadastrar outro cliente" variant="secondary" disabled={busy} onPress={() => { setSelected(''); setName(''); setPhone(''); setPlate(''); setModel(''); setCpf(''); newId.current = ''; }} />}
    </View>
    {!!selected && <View style={shared.card}><Text style={shared.heading}>Veículo do cliente</Text>
      <Field label="Placa" value={plate} onChangeText={v => setPlate(normalizePlate(v))} autoCapitalize="characters" editable={!busy} hint="Para editar um veículo, mantenha a placa e altere o modelo." />
      <Field label="Modelo do veículo" value={model} onChangeText={setModel} maxLength={160} editable={!busy} />
      <Button title="Salvar veículo" busy={busy} onPress={() => perform(() => saveVehicle({ customerId: selected, plate, model }), 'Veículo salvo.')} />
      <Field label="CPF para acesso inicial" value={cpf} onChangeText={setCpf} secureTextEntry keyboardType="number-pad" maxLength={14} editable={!busy} hint="Usado somente como senha inicial. Não será exibido após o cadastro." />
      <Button title="Criar acesso do cliente" busy={busy} onPress={() => perform(async () => {
        if (!validCpf(cpf)) throw new Error('Informe um CPF válido, com 11 dígitos e verificadores corretos.');
        try {
          const result = await provisionClient({ customerId: selected, plate, cpf: normalizeCpf(cpf) });
          if (result.resumed) return 'Cadastro anterior retomado. A senha inicial da primeira tentativa foi preservada; o CPF digitado agora não a substituiu. Se necessário, solicite recuperação ao responsável pelo Firebase.';
        } finally { setCpf(''); }
      }, `Acesso criado para ${plate}. O cliente usará o CPF inicialmente e deverá criar uma nova senha.`)} />
    </View>}
    <Field label="Buscar cliente" value={search} onChangeText={setSearch} placeholder="Nome, telefone ou placa" />
    {loading ? <Loading /> : customers.filter(c => `${c.name} ${c.phone} ${vehicles.filter(v => v.customerId === c.id).map(v => v.plate).join(' ')}`.toLowerCase().includes(search.toLowerCase())).map(c => <View key={c.id} style={shared.card}>
      <Text style={shared.heading}>{c.name}</Text><Text style={shared.muted}>{c.phone}</Text>
      <Button title={`Selecionar ${c.name}`} variant="secondary" disabled={busy} onPress={() => { setSelected(c.id); setName(c.name); setPhone(c.phone); setPlate(''); setModel(''); setCpf(''); }} />
      {vehicles.filter(v => v.customerId === c.id).map(v => <View key={v.id} style={{ gap: 8 }}><Text style={shared.body}>{v.plate} · {v.model}</Text><Text style={shared.muted}>{v.userId ? 'Acesso liberado' : 'Sem acesso cadastrado'}</Text>
        <Button title={`Editar veículo ${v.plate}`} variant="secondary" disabled={busy} onPress={() => { setSelected(c.id); setName(c.name); setPhone(c.phone); setPlate(v.plate); setModel(v.model); setCpf(''); }} />
      </View>)}
    </View>)}
    {!loading && !customers.length && <EmptyState title="Nenhum cliente cadastrado" description="Preencha o formulário acima para começar." />}
  </Screen>;
}
