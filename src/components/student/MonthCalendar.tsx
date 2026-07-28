import { Pressable, StyleSheet, Text, View } from 'react-native';

type MonthCalendarProps = {
  month: Date;
  selectedDate?: string | null;
  eventDates?: ReadonlySet<string>;
  onSelectDate?: (date: string) => void;
  onChangeMonth?: (month: Date) => void;
  showMonthControls?: boolean;
};

type CalendarCell = {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export default function MonthCalendar({
  month,
  selectedDate,
  eventDates,
  onSelectDate,
  onChangeMonth,
  showMonthControls = false,
}: MonthCalendarProps) {
  const cells = createCalendarCells(month);
  const todayKey = toDateKey(new Date());

  return (
    <View style={styles.container}>
      <View style={styles.monthHeader}>
        {showMonthControls ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이전 달"
            hitSlop={10}
            onPress={() => onChangeMonth?.(shiftMonth(month, -1))}
            style={({ pressed }) => [
              styles.monthButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.monthButtonText}>‹</Text>
          </Pressable>
        ) : (
          <View style={styles.monthButton} />
        )}

        <Text style={styles.monthTitle}>
          {month.getFullYear()}년 {month.getMonth() + 1}월
        </Text>

        {showMonthControls ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="다음 달"
            hitSlop={10}
            onPress={() => onChangeMonth?.(shiftMonth(month, 1))}
            style={({ pressed }) => [
              styles.monthButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.monthButtonText}>›</Text>
          </Pressable>
        ) : (
          <View style={styles.monthButton} />
        )}
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((weekday, index) => (
          <Text
            key={weekday}
            style={[
              styles.weekday,
              index === 0 && styles.sunday,
              index === 6 && styles.saturday,
            ]}
          >
            {weekday}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell, index) => {
          const weekday = index % 7;
          const isSelected = selectedDate === cell.dateKey;
          const isToday = todayKey === cell.dateKey;
          const hasEvent = eventDates?.has(cell.dateKey) === true;

          return (
            <Pressable
              key={`${cell.dateKey}-${index}`}
              accessibilityRole={onSelectDate ? 'button' : undefined}
              disabled={!onSelectDate}
              onPress={() => onSelectDate?.(cell.dateKey)}
              style={({ pressed }) => [
                styles.cell,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.dateCircle,
                  isToday && styles.dateCircleToday,
                  isSelected && styles.dateCircleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dateText,
                    !cell.isCurrentMonth && styles.otherMonth,
                    weekday === 0 && styles.sunday,
                    weekday === 6 && styles.saturday,
                    isToday && styles.dateTextToday,
                    isSelected && styles.dateTextSelected,
                  ]}
                >
                  {cell.date.getDate()}
                </Text>
              </View>
              <View
                style={[
                  styles.eventDot,
                  hasEvent && styles.eventDotVisible,
                  isSelected && hasEvent && styles.eventDotSelected,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function shiftMonth(month: Date, amount: number) {
  return new Date(month.getFullYear(), month.getMonth() + amount, 1);
}

function createCalendarCells(month: Date): CalendarCell[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      date,
      dateKey: toDateKey(date),
      isCurrentMonth: date.getMonth() === month.getMonth(),
    };
  });
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  monthHeader: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: {
    color: '#5C5C5C',
    fontFamily: 'FreesentationRegular',
    fontSize: 25,
    lineHeight: 29,
  },
  monthTitle: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 13,
  },
  weekRow: {
    marginTop: 8,
    flexDirection: 'row',
  },
  weekday: {
    width: `${100 / 7}%`,
    color: '#6B7280',
    fontFamily: 'FreesentationRegular',
    fontSize: 11,
    textAlign: 'center',
  },
  grid: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  dateCircleSelected: {
    backgroundColor: '#182365',
  },
  dateCircleToday: {
    backgroundColor: '#E8EBF8',
  },
  dateText: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationRegular',
    fontSize: 11,
  },
  dateTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationSemiBold',
  },
  dateTextToday: {
    color: '#182365',
    fontFamily: 'FreesentationSemiBold',
  },
  otherMonth: {
    opacity: 0.35,
  },
  sunday: {
    color: '#FF6464',
  },
  saturday: {
    color: '#087FF5',
  },
  eventDot: {
    width: 3,
    height: 3,
    marginTop: 1,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  eventDotVisible: {
    backgroundColor: '#F0A274',
  },
  eventDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  pressed: {
    opacity: 0.6,
  },
});
