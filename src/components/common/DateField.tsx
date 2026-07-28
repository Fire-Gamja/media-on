import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../../constants/colors';

type Props = {
  label: string;
  value: string;
  minimumDate?: Date;
  onChange: (value: string) => void;
};

export function DateField({ label, value, minimumDate, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const date = parseDate(value);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') setIsOpen(false);
    if (event.type === 'dismissed' || !selected) return;
    onChange(formatDate(selected));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} 달력 열기`}
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}
      >
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.icon}>▣</Text>
      </Pressable>
      {isOpen ? (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={minimumDate}
          onChange={handleChange}
        />
      ) : null}
      {isOpen && Platform.OS === 'ios' ? (
        <Pressable onPress={() => setIsOpen(false)} style={styles.done}>
          <Text style={styles.doneText}>선택 완료</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function inclusiveDays(start: string, end: string) {
  const milliseconds = parseDate(end).getTime() - parseDate(start).getTime();
  return Math.max(1, Math.floor(milliseconds / 86_400_000) + 1);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: {
    marginBottom: 9,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  field: {
    height: 56,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
  },
  value: { color: COLORS.text, fontSize: 15 },
  icon: { color: COLORS.navy, fontSize: 18 },
  pressed: { opacity: 0.7 },
  done: { alignSelf: 'flex-end', padding: 10 },
  doneText: { color: COLORS.navy, fontWeight: '800' },
});
