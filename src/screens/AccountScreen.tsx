import { useState } from 'react';
import { Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Button, FormModal, Icon, Notice, PageHeading, Screen } from '../components/ui';
import { useEmulators } from '../config/firebase';
import { shared } from '../theme';
import { errorMessage } from '../utils/errors';

export function AccountScreen() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function leave() {
    setBusy(true); setError('');
    try { await logout(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <Screen>
    <PageHeading title="Minha conta" subtitle="Seu acesso ao sistema da oficina." />
    <View style={shared.card}><Icon name="person-circle-outline" size={52} /><Text style={shared.heading}>{user?.displayName || 'Responsável pela oficina'}</Text><Text style={shared.body}>{user?.email}</Text><Text style={shared.muted}>Administrador autorizado da oficina. Ordens, clientes e veículos são compartilhados entre administradores; os lançamentos financeiros permanecem por conta.</Text></View>
    <View style={shared.card}><Text style={shared.heading}>Sobre o SGO</Text><Text style={shared.muted}>{'Sistema de Gestão para Oficina de Chapeamento e Pintura.\nProjeto acadêmico · Versão 1.0'}</Text></View>
    {useEmulators && <Notice success text="Ambiente local de testes. Os registros ficam nos emuladores deste computador." />}
    <Button title="Sair da conta" icon="log-out-outline" variant="secondary" onPress={() => setOpen(true)} />
    <FormModal title="Sair da conta?" visible={open} onClose={() => setOpen(false)} busy={busy}>
      <Text style={shared.body}>Os registros salvos continuarão disponíveis quando você entrar novamente.</Text>
      <Notice text={error} /><Button title="Confirmar saída" variant="danger" busy={busy} onPress={leave} /><Button title="Continuar na conta" variant="secondary" disabled={busy} onPress={() => setOpen(false)} />
    </FormModal>
  </Screen>;
}
