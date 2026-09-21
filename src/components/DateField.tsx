import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { dateLabel, localDay } from '../utils/domain';
import { colors, shared } from '../theme';
import { Button, Icon, styles } from './ui';

export type DateFieldProps = { label: string; value: Date; onChange: (date: Date) => void; minimumDate?: Date };
export function DateField({ label, value, onChange, minimumDate }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  return <View style={{ gap: 8 }}><Text style={shared.label}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => setOpen(true)} style={[styles.input, shared.between]}>
      <Text style={{ color: colors.ink, fontSize: 16 }}>{dateLabel(value)}</Text><Icon name="calendar-outline" />
    </Pressable>
    {open && <View style={{ gap: 8 }}><DateTimePicker value={value} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} minimumDate={minimumDate} locale="pt-BR" onChange={(event, date) => {
      if (Platform.OS !== 'ios') setOpen(false);
      if (event.type === 'set' && date) onChange(localDay(date));
    }} />{Platform.OS === 'ios' && <Button title="Confirmar data" onPress={() => setOpen(false)} />}</View>}
  </View>;
}
