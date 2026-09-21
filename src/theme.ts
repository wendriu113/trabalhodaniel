import { StyleSheet } from 'react-native';

export const colors = {
  navy: '#103F70', blue: '#1763AE', background: '#F3F6FA', paper: '#FFFFFF',
  ink: '#152D46', muted: '#53677C', line: '#DCE4EE', pale: '#E8F1FB',
  green: '#216545', greenLight: '#E8F5EE', amber: '#805000', amberLight: '#FFF1CF',
  red: '#B32D3B', redLight: '#FDECF0',
};

export const shared = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  stack: { gap: 16 },
  card: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 20, gap: 14 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: -0.7 },
  heading: { fontSize: 19, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, lineHeight: 24, color: colors.ink },
  muted: { fontSize: 14, lineHeight: 21, color: colors.muted },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink },
});
