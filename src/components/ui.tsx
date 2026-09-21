import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, PropsWithChildren } from 'react';
import { colors, shared } from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
export function Icon({ name, size = 22, color = colors.blue }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} accessible={false} aria-hidden importantForAccessibility="no-hide-descendants" />;
}
export function Button({ title, onPress, busy, disabled, variant = 'primary', icon }: { title: string; onPress: () => void; busy?: boolean; disabled?: boolean; variant?: 'primary' | 'secondary' | 'danger'; icon?: IconName }) {
  const foreground = variant === 'secondary' ? colors.navy : '#FFFFFF';
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={onPress}
    style={({ pressed }) => [styles.button, { backgroundColor: variant === 'secondary' ? colors.pale : variant === 'danger' ? colors.red : colors.blue, opacity: disabled || busy ? 0.55 : pressed ? 0.8 : 1 }]}>
    {busy ? <ActivityIndicator color={foreground} /> : icon && <Icon name={icon} color={foreground} size={19} />}
    <Text style={{ fontSize: 15, fontWeight: '700', color: foreground }}>{title}</Text>
  </Pressable>;
}
export function Field({ label, hint, style, ...props }: TextInputProps & { label: string; hint?: string }) {
  return <View style={{ gap: 7 }}><Text style={shared.label}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor={colors.muted} {...props} style={[styles.input, props.multiline && { minHeight: 100, textAlignVertical: 'top' }, style]} />
    {hint && <Text style={shared.muted}>{hint}</Text>}
  </View>;
}
export function Notice({ text, success = false }: { text?: string; success?: boolean }) {
  if (!text) return null;
  return <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.notice, { backgroundColor: success ? colors.greenLight : colors.redLight }]}>
    <Icon name={success ? 'checkmark-circle-outline' : 'alert-circle-outline'} color={success ? colors.green : colors.red} size={20} />
    <Text style={{ flex: 1, fontSize: 14, lineHeight: 21, color: success ? colors.green : colors.red }}>{text}</Text>
  </View>;
}
export function Screen({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.screen, style]}>{children}</ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={{ gap: 6 }}><Text accessibilityRole="header" style={shared.title}>{title}</Text><Text style={shared.muted}>{subtitle}</Text></View>;
}
export function EmptyState({ title, description, icon = 'file-tray-outline', children }: PropsWithChildren<{ title: string; description: string; icon?: IconName }>) {
  return <View style={[shared.card, { alignItems: 'center', paddingVertical: 36 }]}><Icon name={icon} size={38} /><Text style={shared.heading}>{title}</Text><Text style={[shared.muted, { textAlign: 'center', maxWidth: 360 }]}>{description}</Text>{children}</View>;
}
export function Loading({ label = 'Carregando informações…' }: { label?: string }) {
  return <View style={{ padding: 32, alignItems: 'center', gap: 14 }}><ActivityIndicator color={colors.blue} size="large" /><Text style={shared.muted}>{label}</Text></View>;
}
export function FormModal({ visible, title, onClose, busy, children }: PropsWithChildren<{ visible: boolean; title: string; onClose: () => void; busy?: boolean }>) {
  return <Modal transparent animationType="fade" visible={visible} onRequestClose={() => { if (!busy) onClose(); }}>
    <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.modal} accessibilityViewIsModal>
        <View style={shared.between}><Text accessibilityRole="header" style={[shared.heading, { flex: 1 }]}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar modal" disabled={busy} onPress={onClose} style={{ padding: 12 }}><Icon name="close" /></Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 18, paddingBottom: 12 }}>{children}</ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  </Modal>;
}
export function Chip({ title, selected, onPress }: { title: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.chip, selected && { backgroundColor: colors.navy, borderColor: colors.navy }]}>
    <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? '#FFFFFF' : colors.muted }}>{title}</Text>
  </Pressable>;
}
export const styles = StyleSheet.create({
  screen: { padding: 22, gap: 22, width: '100%', maxWidth: 860, alignSelf: 'center', paddingBottom: 40 },
  button: { minHeight: 48, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  input: { minHeight: 50, borderRadius: 10, borderWidth: 1, borderColor: '#B9C8D9', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FFFFFF', color: colors.ink, fontSize: 16 },
  notice: { padding: 14, borderRadius: 10, gap: 10, flexDirection: 'row', alignItems: 'flex-start' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(10,30,50,0.55)', padding: 20 },
  modal: { backgroundColor: '#FFFFFF', padding: 22, borderRadius: 20, gap: 16, width: '100%', maxWidth: 520, maxHeight: '90%' },
  chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 9, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF' },
});
