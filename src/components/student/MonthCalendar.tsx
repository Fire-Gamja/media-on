import { Image as SvgImage } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const calendarIcons = {
  previous: require('../../../assets/figma/student-v2/calendar-chevron-left.svg'),
  next: require('../../../assets/figma/student-v2/calendar-chevron-right.svg'),
} as const;

type MonthCalendarProps = {
  month: Date;
  selectedDate?: string | null;
  selectedStartDate?: string | null;
  selectedEndDate?: string | null;
  minimumDate?: string | null;
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
  selectedStartDate,
  selectedEndDate,
  minimumDate,
  eventDates,
  onSelectDate,
  onChangeMonth,
  showMonthControls = false,
}: MonthCalendarProps) {
  const cells = createCalendarCells(month);
  const weeks = Array.from({ length: 6 }, (_, weekIndex) =>
    cells.slice(weekIndex * 7, weekIndex * 7 + 7),
  );
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
            <SvgImage
              contentFit="contain"
              source={calendarIcons.previous}
              style={styles.monthButtonIcon}
            />
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
            <SvgImage
              contentFit="contain"
              source={calendarIcons.next}
              style={styles.monthButtonIcon}
            />
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
        {weeks.map((week) => (
          <View key={week[0].dateKey} style={styles.dateRow}>
            {week.map((cell, weekday) => {
              const isRangeStart = selectedStartDate === cell.dateKey;
              const isRangeEnd = selectedEndDate === cell.dateKey;
              const isInRange = Boolean(
                selectedStartDate &&
                  selectedEndDate &&
                  cell.dateKey > selectedStartDate &&
                  cell.dateKey < selectedEndDate,
              );
              const isSelected =
                selectedDate === cell.dateKey || isRangeStart || isRangeEnd;
              const isToday = todayKey === cell.dateKey;
              const hasEvent = eventDates?.has(cell.dateKey) === true;
              const isDisabled = Boolean(
                minimumDate && cell.dateKey < minimumDate,
              );

              return (
                <Pressable
                  key={cell.dateKey}
                  accessibilityRole={onSelectDate ? 'button' : undefined}
                  disabled={!onSelectDate || isDisabled}
                  onPress={() => onSelectDate?.(cell.dateKey)}
                  style={({ pressed }) => [
                    styles.cell,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.dateCircle,
                      hasEvent && styles.dateCircleEvent,
                      isInRange && styles.dateCircleInRange,
                      isToday && styles.dateCircleToday,
                      isSelected && styles.dateCircleSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateText,
                        !cell.isCurrentMonth && styles.otherMonth,
                        isDisabled && styles.disabledDate,
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
        ))}
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
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonIcon: {
    width: 16,
    height: 16,
  },
  monthTitle: {
    color: '#1E2024',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 15,
  },
  weekRow: {
    marginTop: 24,
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    color: '#6B7280',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 11,
    textAlign: 'center',
  },
  grid: {
    marginTop: 18,
  },
  dateRow: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircle: {
    width: 28,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  dateCircleSelected: {
    backgroundColor: '#3550FF',
  },
  dateCircleToday: {
    backgroundColor: '#EBF0FF',
  },
  dateCircleEvent: {
    backgroundColor: '#EBF0FF',
  },
  dateCircleInRange: {
    backgroundColor: '#EEF1FF',
  },
  dateText: {
    color: '#1E2024',
    fontFamily: 'FreesentationRegular',
    fontSize: 11,
  },
  dateTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationSemiBold',
  },
  dateTextToday: {
    color: '#3550FF',
    fontFamily: 'FreesentationSemiBold',
  },
  otherMonth: {
    opacity: 0.35,
  },
  disabledDate: {
    opacity: 0.25,
  },
  sunday: {
    color: '#FF6464',
  },
  saturday: {
    color: '#3550FF',
  },
  eventDot: {
    display: 'none',
  },
  eventDotVisible: {
    display: 'none',
  },
  eventDotSelected: {
    display: 'none',
  },
  pressed: {
    opacity: 0.6,
  },
});
