import { View, Text } from 'react-native';
import type { DateFieldProps } from './DateField';
import { dateInput, parseLocalDate } from '../utils/domain';
import { colors, shared } from '../theme';

// O pacote nativo não tem implementação web; o navegador usa seu calendário acessível.
export function DateField({ label, value, onChange, minimumDate }: DateFieldProps) {
  return <View style={{ gap: 8 }}><Text style={shared.label}>{label}</Text>
    <input aria-label={label} type="date" value={dateInput(value)} min={minimumDate ? dateInput(minimumDate) : undefined}
      onChange={event => { const date = parseLocalDate(event.target.value); if (date) onChange(date); }}
      style={{ boxSizing: 'border-box', minHeight: 50, width: '100%', borderRadius: 10, padding: '12px 14px', font: 'inherit', fontSize: 16, color: colors.ink, border: '1px solid #B9C8D9', background: '#FFFFFF' }} />
  </View>;
}
