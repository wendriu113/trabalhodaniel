import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { firebaseReady } from './src/config/firebase';
import { Icon, PageHeading, Screen } from './src/components/ui';
import { shared } from './src/theme';

export default function App() {
  return <SafeAreaProvider><StatusBar style="dark" />
    {firebaseReady ? <AuthProvider><AppNavigator /></AuthProvider> : <Screen style={{ paddingTop: 80, maxWidth: 560 }}>
      <Icon name="build-outline" size={54} />
      <PageHeading title="Bem-vindo ao SGO" subtitle="O aplicativo está pronto para conectar à sua oficina." />
      <View style={shared.card}><Text style={shared.heading}>Conecte seu projeto Firebase</Text>
        <Text style={shared.body}>{'1. Copie .env.example para .env.\n\n2. Preencha a configuração pública do aplicativo web do Firebase.\n\n3. Ative Authentication e Firestore e publique as regras fornecidas.\n\n4. Reinicie o Expo com npx expo start --clear.'}</Text>
        <Text style={shared.muted}>O README contém o passo a passo completo e uma alternativa com emuladores locais.</Text>
      </View>
    </Screen>}
  </SafeAreaProvider>;
}
