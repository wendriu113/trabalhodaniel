import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { DataProvider } from '../contexts/DataContext';
import { colors } from '../theme';
import { Icon, Loading, Screen } from '../components/ui';
import { LoginScreen } from '../screens/LoginScreen';
import { ClientScreen, InitialPasswordScreen, NoAccessScreen } from '../screens/ClientScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { CustomersScreen } from '../screens/CustomersScreen';
import { OrderFormScreen } from '../screens/OrderFormScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { FinanceScreen } from '../screens/FinanceScreen';
import { MovementFormScreen } from '../screens/MovementFormScreen';
import { AccountScreen } from '../screens/AccountScreen';
import type { RootStackParams, TabParams } from './types';

const Stack = createNativeStackNavigator<RootStackParams>();
const Tabs = createBottomTabNavigator<TabParams>();
const icons = { Home: 'grid-outline', Ordens: 'build-outline', Clientes: 'people-outline', Financeiro: 'wallet-outline', Conta: 'person-circle-outline' } as const;
function MainTabs() {
  const insets = useSafeAreaInsets();
  return <Tabs.Navigator screenOptions={({ route }) => ({ headerTitle: 'SGO · Oficina', headerTintColor: colors.navy, headerShadowVisible: false,
    tabBarActiveTintColor: colors.blue, tabBarInactiveTintColor: colors.muted,
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' }, tabBarStyle: { borderTopColor: colors.line, height: 64 + insets.bottom, paddingBottom: Math.max(insets.bottom, 8), paddingTop: 6 },
    tabBarIcon: ({ color, size }) => <Icon name={icons[route.name]} color={color} size={size} />,
  })}>
    <Tabs.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Início' }} />
    <Tabs.Screen name="Ordens" component={OrdersScreen} />
    <Tabs.Screen name="Clientes" component={CustomersScreen} />
    <Tabs.Screen name="Financeiro" component={FinanceScreen} />
    <Tabs.Screen name="Conta" component={AccountScreen} />
  </Tabs.Navigator>;
}
export function AppNavigator() {
  const { user, loading, isAdmin, profile } = useAuth();
  if (loading) return <Screen><Loading label="Preparando sua oficina…" /></Screen>;
  return <DataProvider key={user?.uid || 'signed-out'}><NavigationContainer theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.blue, background: colors.background, text: colors.ink, border: colors.line } }}>
    <Stack.Navigator screenOptions={{ headerTintColor: colors.navy, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}>
      {user && isAdmin ? <>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="NovaOrdem" component={OrderFormScreen} options={{ title: 'Nova ordem' }} />
        <Stack.Screen name="Detalhes" component={OrderDetailScreen} options={{ title: 'Ordem de serviço' }} />
        <Stack.Screen name="NovoLancamento" component={MovementFormScreen} options={{ title: 'Novo lançamento' }} />
      </> : user ? profile?.role === 'client' && profile.customerId ? profile.mustChangePassword ?
        <Stack.Screen name="SenhaInicial" component={InitialPasswordScreen} options={{ headerShown: false }} /> :
        <Stack.Screen name="Cliente" component={ClientScreen} options={{ headerShown: false }} /> :
        <Stack.Screen name="SemAcesso" component={NoAccessScreen} options={{ headerShown: false }} /> : <>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      </>}
    </Stack.Navigator>
  </NavigationContainer></DataProvider>;
}
