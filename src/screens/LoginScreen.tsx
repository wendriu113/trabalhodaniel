import { useState } from 'react';
import { Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Button, Field, Icon, Notice, Screen } from '../components/ui';
import { colors, shared } from '../theme';
import { errorMessage } from '../utils/errors';
import { validEmail } from '../utils/domain';
import { normalizePlate, normalizeCpf, validPlate, plateEmail } from '../../functions/validation';

export function LoginScreen() {
  const { login } = useAuth();
  const [administrative, setAdministrative] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    setError('');
    if (!(administrative ? validEmail(email) : validPlate(email)) || !password) { setError(administrative ? 'Informe um e-mail válido e sua senha.' : 'Informe uma placa válida e seu CPF ou senha.'); return; }
    setBusy(true);
    try { await login(administrative ? email : plateEmail(email), !administrative && /^[\d.\s-]+$/.test(password) ? normalizeCpf(password) : password); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <Screen style={{ maxWidth: 520, paddingTop: 30 }}>
    <View style={{ backgroundColor: colors.navy, padding: 28, borderRadius: 22, gap: 18 }}>
      <View style={shared.row}><View style={{ backgroundColor: '#FFFFFF', padding: 12, borderRadius: 14 }}><Icon name="build-outline" size={27} color={colors.navy} /></View><Text style={{ fontSize: 42, color: '#FFFFFF', fontWeight: '900', letterSpacing: -2 }}>SGO</Text></View>
      <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF', lineHeight: 34 }}>{'Sua oficina,\ncom tudo no lugar.'}</Text>
      <Text style={{ color: '#D4E6FA', fontSize: 15, lineHeight: 23 }}>Do primeiro atendimento à entrega do veículo. Organize os serviços e acompanhe cada reparo.</Text>
      <View style={{ height: 5, flexDirection: 'row', gap: 5 }}>{[1, 2, 3, 4, 5, 6].map(i => <View key={i} style={{ flex: 1, backgroundColor: i < 4 ? '#90BCEB' : '#38608A', borderRadius: 3 }} />)}</View>
    </View>
    <View style={{ gap: 8 }}><Text accessibilityRole="header" style={shared.title}>{administrative ? 'Acesso administrativo' : 'Acompanhe seu veículo'}</Text><Text style={shared.muted}>{administrative ? 'Entre com a conta autorizada da oficina.' : 'No primeiro acesso, use a placa e o CPF do titular.'}</Text></View>
    <Notice text={error} />
    <Field label={administrative ? 'E-mail' : 'Placa do veículo'} placeholder={administrative ? 'voce@exemplo.com' : 'ABC1D23'} value={email} onChangeText={v => setEmail(administrative ? v : normalizePlate(v))} keyboardType={administrative ? 'email-address' : 'default'} autoCapitalize={administrative ? 'none' : 'characters'} editable={!busy} />
    <Field label={administrative ? 'Senha' : 'CPF ou senha'} placeholder="Sua senha" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoComplete="current-password" editable={!busy} onSubmitEditing={submit} />
    <Button title={showPassword ? 'Ocultar senha' : 'Mostrar senha'} variant="secondary" onPress={() => setShowPassword(s => !s)} />
    <Button title="Entrar" icon="arrow-forward-outline" onPress={submit} busy={busy} />
    <Button title={administrative ? 'Voltar ao acesso do cliente' : 'Login administrativo'} variant="secondary" onPress={() => { setAdministrative(!administrative); setEmail(''); setPassword(''); setError(''); }} disabled={busy} />
    <Text style={[shared.muted, { textAlign: 'center', fontSize: 12 }]}>Sistema de Gestão para Oficina de Chapeamento e Pintura</Text>
  </Screen>;
}
