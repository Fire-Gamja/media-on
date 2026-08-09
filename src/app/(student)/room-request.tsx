import { Image as ExpoImage } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InlineDropdown } from '../../components/common/InlineDropdown';
import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import MonthCalendar, {
  fromDateKey,
  toDateKey,
} from '../../components/student/MonthCalendar';
import { maskProfanityInput } from '../../lib/content-filter';
import { getAuthErrorMessage } from '../../services/auth';
import {
  createRoomReservationRequest,
  getPracticeRooms,
  type PracticeRoom,
} from '../../services/room-reservations';

const icons = {
  calendar: require('../../../assets/figma/student-v2/calendar.svg'),
  chevronDown: require('../../../assets/figma/student-v2/chervron-down.svg'),
} as const;

type TimeSheetState = 'start' | 'end' | null;

const TIME_WHEEL_ITEM_HEIGHT = 64;
const TIME_WHEEL_VISIBLE_ITEMS = 5;
const TIME_WHEEL_PADDING =
  TIME_WHEEL_ITEM_HEIGHT * Math.floor(TIME_WHEEL_VISIBLE_ITEMS / 2);

export default function RoomRequestScreen() {
  const { roomId: rawRoomId } = useLocalSearchParams<{ roomId?: string }>();
  const requestedRoomId = Array.isArray(rawRoomId) ? rawRoomId[0] : rawRoomId;
  const today = useMemo(() => getLocalDate(0), []);
  const [rooms, setRooms] = useState<PracticeRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [reservationDate, setReservationDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:50');
  const [purpose, setPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRoomSelectOpen, setIsRoomSelectOpen] = useState(false);
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [timeSheet, setTimeSheet] = useState<TimeSheetState>(null);

  const selectRoom = useCallback((room: PracticeRoom) => {
    const options = createClassTimeOptions(room.open_time, room.close_time);
    const nextStart = options.startTimeOptions[0] ?? '09:00';
    const nextEnd =
      options.endTimeOptions.find((value) => value > nextStart) ?? '09:50';

    setSelectedRoomId(room.id);
    setStartTime(nextStart);
    setEndTime(nextEnd);
    setIsRoomSelectOpen(false);
  }, []);

  const loadRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const nextRooms = await getPracticeRooms();
      setRooms(nextRooms);

      const initialRoom =
        nextRooms.find((room) => room.id === requestedRoomId) ?? nextRooms[0];
      if (initialRoom) selectRoom(initialRoom);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [requestedRoomId, selectRoom]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const selectedRoom =
    rooms.find((room) => room.id === selectedRoomId) ?? null;
  const roomDropdownOptions = useMemo(
    () => rooms.map((room) => ({ label: room.name, value: room.id })),
    [rooms],
  );
  const { startTimeOptions, endTimeOptions } = useMemo(
    () =>
      createClassTimeOptions(
        selectedRoom?.open_time,
        selectedRoom?.close_time,
      ),
    [selectedRoom],
  );
  const availableEndTimes = useMemo(
    () => endTimeOptions.filter((value) => value > startTime),
    [endTimeOptions, startTime],
  );

  const handleSubmit = async () => {
    if (!selectedRoom) {
      Alert.alert('강의실 확인', '대여할 강의실을 선택해 주세요.');
      return;
    }
    if (!isValidDate(reservationDate) || reservationDate < today) {
      Alert.alert('날짜 확인', '시작일은 오늘 이후의 날짜를 선택해 주세요.');
      return;
    }
    if (!isValidDate(endDate) || endDate < reservationDate) {
      Alert.alert('날짜 확인', '종료일은 시작일과 같거나 이후여야 합니다.');
      return;
    }
    if (endTime <= startTime) {
      Alert.alert('시간 확인', '시작 시간보다 늦은 종료 시간을 선택해 주세요.');
      return;
    }

    const openTime = selectedRoom.open_time.slice(0, 5);
    const closeTime = selectedRoom.close_time.slice(0, 5);
    if (startTime < openTime || endTime > closeTime) {
      Alert.alert(
        '운영시간 확인',
        `이 실습실은 ${openTime}~${closeTime}에 이용할 수 있습니다.`,
      );
      return;
    }
    if (!purpose.trim()) {
      Alert.alert('사용 목적 확인', '실습실 사용 목적을 입력해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createRoomReservationRequest({
        roomId: selectedRoom.id,
        reservationDate,
        endDate,
        startTime,
        endTime,
        purpose,
      });
      Alert.alert('신청 완료', '실습실 대여 신청이 완료되었습니다.', [
        {
          text: '내 신청 확인',
          onPress: () => router.replace('/room-requests'),
        },
      ]);
    } catch (error) {
      Alert.alert('신청 실패', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.headerSide}
        >
          <PlatformHeaderIcon color="#1A2035" name="back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>실습실 대여 신청</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/room-requests')}
          style={({ pressed }) => [
            styles.headerSide,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.historyText}>내 신청</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color="#3550FF" size="large" />
        </View>
      ) : errorMessage ? (
        <View style={styles.stateBox}>
          <Text style={styles.errorTitle}>실습실 목록을 불러오지 못했습니다.</Text>
          <Text style={styles.stateText}>{errorMessage}</Text>
          <Pressable onPress={() => void loadRooms()} style={styles.retryButton}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : rooms.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>대여 가능한 실습실이 없습니다.</Text>
        </View>
      ) : (
        <>
          <KeyboardAwareScrollView
            bottomOffset={84}
            contentContainerStyle={styles.content}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            style={styles.scrollView}
          >
            <InlineDropdown
              isOpen={isRoomSelectOpen}
              label="강의실"
              onSelect={(roomId) => {
                const room = rooms.find((candidate) => candidate.id === roomId);
                if (room) selectRoom(room);
              }}
              onToggle={() => setIsRoomSelectOpen((current) => !current)}
              options={roomDropdownOptions}
              placeholder="강의실을 선택해 주세요"
              selectedValue={selectedRoomId || null}
            />

            <View style={styles.dateGroup}>
              <View style={styles.twoColumnRow}>
                <DateButton
                  label="시작일"
                  onPress={() => setIsDateSheetOpen(true)}
                  value={reservationDate}
                />
                <DateButton
                  label="종료일"
                  onPress={() => setIsDateSheetOpen(true)}
                  value={endDate}
                />
              </View>
              <Text style={styles.rangeSummary}>
                {reservationDate} ~ {endDate} · 총{' '}
                {inclusiveDays(reservationDate, endDate)}일
              </Text>
            </View>

            <View style={styles.twoColumnRow}>
              <SelectButton
                label="시작 시간"
                onPress={() => setTimeSheet('start')}
                value={startTime}
              />
              <SelectButton
                label="종료 시간"
                onPress={() => setTimeSheet('end')}
                value={endTime}
              />
            </View>

            <FieldGroup label="이용 인원">
              <View style={styles.fixedCapacityBox}>
                <Text style={styles.fixedCapacityText}>40명 고정</Text>
              </View>
            </FieldGroup>

            <FieldGroup label="사용 목적">
              <View style={styles.purposeGuide}>
                <Text style={styles.purposeGuideText}>
                  • 통합정보시스템에 작성하신 목적과 동일하게 작성해 주세요.
                </Text>
                <Text style={styles.purposeGuideText}>
                  • 24시간 대여하신 경우에는 실습조교에게 상담 요청해 주세요.
                </Text>
              </View>
              <TextInput
                maxLength={1000}
                multiline
                onChangeText={(value) => setPurpose(maskProfanityInput(value))}
                placeholder="통합정보시스템에 입력한 사용 목적을 작성해 주세요"
                placeholderTextColor="#8A94A6"
                style={styles.purposeInput}
                textAlignVertical="top"
                value={purpose}
              />
            </FieldGroup>
          </KeyboardAwareScrollView>

          <View style={styles.bottomCta}>
            <Pressable
              disabled={isSubmitting}
              onPress={() => void handleSubmit()}
              style={({ pressed }) => [
                styles.submitButton,
                isSubmitting && styles.disabled,
                pressed && !isSubmitting && styles.pressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>대여 신청</Text>
              )}
            </Pressable>
          </View>
        </>
      )}

      {isDateSheetOpen ? (
        <DateRangeSheet
          endDate={endDate}
          minimumDate={today}
          onClose={() => setIsDateSheetOpen(false)}
          onConfirm={(nextStartDate, nextEndDate) => {
            setReservationDate(nextStartDate);
            setEndDate(nextEndDate);
            setIsDateSheetOpen(false);
          }}
          startDate={reservationDate}
          visible
        />
      ) : null}

      {timeSheet === 'start' ? (
        <TimeWheelSheet
          label="시작 시간"
          onClose={() => setTimeSheet(null)}
          onConfirm={(value) => {
            setStartTime(value);
            if (endTime <= value) {
              setEndTime(
                endTimeOptions.find((option) => option > value) ?? endTime,
              );
            }
            setTimeSheet(null);
          }}
          options={startTimeOptions}
          value={startTime}
          visible
        />
      ) : null}

      {timeSheet === 'end' ? (
        <TimeWheelSheet
          label="종료 시간"
          onClose={() => setTimeSheet(null)}
          onConfirm={(value) => {
            setEndTime(value);
            setTimeSheet(null);
          }}
          options={availableEndTimes}
          value={endTime}
          visible
        />
      ) : null}
    </SafeAreaView>
  );
}

function FieldGroup({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function DateButton({
  label,
  onPress,
  value,
}: {
  label: string;
  onPress: () => void;
  value: string;
}) {
  return (
    <View style={styles.columnField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        accessibilityLabel={`${label} 달력 열기`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.selectField, pressed && styles.pressed]}
      >
        <Text style={styles.fieldValue}>{value}</Text>
        <ExpoImage
          contentFit="contain"
          source={icons.calendar}
          style={styles.calendarIcon}
        />
      </Pressable>
    </View>
  );
}

function SelectButton({
  label,
  onPress,
  value,
}: {
  label: string;
  onPress: () => void;
  value: string;
}) {
  return (
    <View style={styles.columnField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        accessibilityLabel={`${label} 선택`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.selectField, pressed && styles.pressed]}
      >
        <Text style={styles.fieldValue}>{value}</Text>
        <ExpoImage
          contentFit="contain"
          source={icons.chevronDown}
          style={styles.chevronIcon}
        />
      </Pressable>
    </View>
  );
}

function DateRangeSheet({
  endDate,
  minimumDate,
  onClose,
  onConfirm,
  startDate,
  visible,
}: {
  endDate: string;
  minimumDate: string;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => void;
  startDate: string;
  visible: boolean;
}) {
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);
  const [month, setMonth] = useState(() => {
    const initial = fromDateKey(startDate);
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);

  const selectDate = (date: string) => {
    if (!isSelectingEnd) {
      setDraftStart(date);
      setDraftEnd(date);
      setIsSelectingEnd(true);
      return;
    }

    if (date < draftStart) {
      setDraftStart(date);
      setDraftEnd(date);
      return;
    }

    setDraftEnd(date);
    setIsSelectingEnd(false);
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="날짜 선택 닫기"
          onPress={onClose}
          style={styles.modalBackdrop}
        />
        <SafeAreaView edges={['bottom']} style={styles.dateSheet}>
          <View style={styles.sheetHandle} />
          <MonthCalendar
            minimumDate={minimumDate}
            month={month}
            onChangeMonth={setMonth}
            onSelectDate={selectDate}
            selectedEndDate={draftEnd}
            selectedStartDate={draftStart}
            showMonthControls
          />
          <Pressable
            onPress={() => onConfirm(draftStart, draftEnd)}
            style={({ pressed }) => [
              styles.sheetConfirmButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.sheetConfirmText}>
              {formatKoreanDate(draftStart)} ~ {formatKoreanDate(draftEnd)} (총{' '}
              {inclusiveDays(draftStart, draftEnd)}일)
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function TimeWheelSheet({
  label,
  onClose,
  onConfirm,
  options,
  value,
  visible,
}: {
  label: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
  options: string[];
  value: string;
  visible: boolean;
}) {
  const safeOptions = options.length > 0 ? options : [value];
  const initialIndex = Math.max(0, safeOptions.indexOf(value));
  const [draftIndex, setDraftIndex] = useState(initialIndex);
  const wheelRef = useRef<FlatList<string>>(null);

  const scrollToIndex = (index: number, animated = true) => {
    const nextIndex = Math.min(Math.max(0, index), safeOptions.length - 1);
    setDraftIndex(nextIndex);
    wheelRef.current?.scrollToOffset({
      animated,
      offset: nextIndex * TIME_WHEEL_ITEM_HEIGHT,
    });
  };

  const updateIndexFromOffset = (offsetY: number) => {
    const nextIndex = Math.min(
      Math.max(0, Math.round(offsetY / TIME_WHEEL_ITEM_HEIGHT)),
      safeOptions.length - 1,
    );
    setDraftIndex((current) => (current === nextIndex ? current : nextIndex));
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel={`${label} 선택 닫기`}
          onPress={onClose}
          style={styles.modalBackdrop}
        />
        <SafeAreaView edges={['bottom']} style={styles.timeSheet}>
          <View style={styles.sheetHandle} />
          <View
            accessibilityActions={[
              { name: 'increment', label: '다음 시간' },
              { name: 'decrement', label: '이전 시간' },
            ]}
            accessibilityLabel={`${label} ${safeOptions[draftIndex]}`}
            accessibilityRole="adjustable"
            accessibilityValue={{
              max: safeOptions.length,
              min: 1,
              now: draftIndex + 1,
              text: safeOptions[draftIndex],
            }}
            onAccessibilityAction={({ nativeEvent }) => {
              if (nativeEvent.actionName === 'increment') {
                scrollToIndex(draftIndex + 1);
              } else if (nativeEvent.actionName === 'decrement') {
                scrollToIndex(draftIndex - 1);
              }
            }}
            style={styles.dialViewport}
          >
            <View pointerEvents="none" style={styles.dialSelection} />
            <FlatList
              bounces={false}
              contentContainerStyle={styles.dialContent}
              data={safeOptions}
              decelerationRate="fast"
              disableIntervalMomentum
              getItemLayout={(_, index) => ({
                index,
                length: TIME_WHEEL_ITEM_HEIGHT,
                offset: TIME_WHEEL_ITEM_HEIGHT * index,
              })}
              initialScrollIndex={initialIndex}
              keyExtractor={(item) => item}
              onMomentumScrollEnd={({ nativeEvent }) =>
                updateIndexFromOffset(nativeEvent.contentOffset.y)
              }
              onScroll={({ nativeEvent }) =>
                updateIndexFromOffset(nativeEvent.contentOffset.y)
              }
              overScrollMode="never"
              ref={wheelRef}
              renderItem={({ index, item }) => {
                const signedDistance = index - draftIndex;
                const distance = Math.abs(signedDistance);

                return (
                  <Pressable
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    onPress={() => scrollToIndex(index)}
                    style={styles.dialItem}
                  >
                    <Text
                      style={[
                        styles.dialText,
                        distance === 1 && styles.dialTextNear,
                        distance >= 2 && styles.dialTextFar,
                        distance === 0 && styles.selectedDialText,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              }}
              scrollEnabled={safeOptions.length > 1}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              snapToAlignment="start"
              snapToInterval={TIME_WHEEL_ITEM_HEIGHT}
              style={styles.dial}
            />
          </View>
          <View style={styles.sheetDivider} />
          <Pressable
            onPress={() => onConfirm(safeOptions[draftIndex])}
            style={({ pressed }) => [
              styles.sheetConfirmButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.sheetConfirmText}>확인</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function getLocalDate(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return toDateKey(date);
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = fromDateKey(value);
  return !Number.isNaN(date.getTime()) && toDateKey(date) === value;
}

function inclusiveDays(start: string, end: string) {
  const milliseconds =
    fromDateKey(end).getTime() - fromDateKey(start).getTime();
  return Math.max(1, Math.floor(milliseconds / 86_400_000) + 1);
}

function formatKoreanDate(dateKey: string) {
  const date = fromDateKey(dateKey);
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
}

function createClassTimeOptions(openTime = '09:00', closeTime = '23:50') {
  const openMinutes = toMinutes(openTime);
  const closeMinutes = toMinutes(closeTime);
  const firstHour = Math.ceil(openMinutes / 60);
  const lastHour = Math.floor(closeMinutes / 60);
  const hours = Array.from(
    { length: Math.max(0, lastHour - firstHour + 1) },
    (_, index) => firstHour + index,
  );

  const startTimeOptions = hours
    .map((hour) => `${String(hour).padStart(2, '0')}:00`)
    .filter((value) => toMinutes(value) >= openMinutes && toMinutes(value) < closeMinutes);
  const endTimeOptions = hours
    .map((hour) => `${String(hour).padStart(2, '0')}:50`)
    .filter((value) => toMinutes(value) > openMinutes && toMinutes(value) <= closeMinutes);

  return { startTimeOptions, endTimeOptions };
}

function toMinutes(value: string) {
  const [hour, minute] = value.slice(0, 5).split(':').map(Number);
  return hour * 60 + minute;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  headerSide: {
    width: 48,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#1A2035',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 20,
  },
  historyText: {
    color: '#1B2256',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  scrollView: { flex: 1, backgroundColor: '#FFFFFF' },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 24,
  },
  fieldGroup: { gap: 12 },
  fieldLabel: {
    color: '#1B2A4A',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
  },
  selectField: {
    minHeight: 44,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E4E9F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  fieldValue: {
    flexShrink: 1,
    color: '#333D4B',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  chevronIcon: { width: 14, height: 14 },
  calendarIcon: { width: 16, height: 16 },
  dateGroup: { gap: 8 },
  twoColumnRow: { flexDirection: 'row', gap: 12 },
  columnField: { flex: 1, gap: 12 },
  rangeSummary: {
    paddingHorizontal: 4,
    color: '#253E75',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 14,
  },
  fixedCapacityBox: {
    minHeight: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F5F6FA',
  },
  fixedCapacityText: {
    color: '#797979',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 14,
  },
  purposeGuide: {
    padding: 14,
    gap: 6,
    borderRadius: 12,
    backgroundColor: '#F5F6FA',
  },
  purposeGuideText: {
    color: '#323232',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
    lineHeight: 20,
  },
  purposeInput: {
    height: 140,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E4E9F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    color: '#323232',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
    lineHeight: 21,
  },
  bottomCta: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#3550FF',
  },
  submitText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 16,
  },
  stateBox: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    color: '#DC2626',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 16,
    textAlign: 'center',
  },
  stateText: {
    marginTop: 10,
    color: '#6B7280',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    marginTop: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#3550FF',
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 14,
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dateSheet: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  timeSheet: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  sheetHandle: {
    width: 30,
    height: 5,
    alignSelf: 'center',
    borderRadius: 20,
    backgroundColor: '#626262',
  },
  sheetConfirmButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#3550FF',
  },
  sheetConfirmText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 14,
  },
  sheetDivider: { height: 1, backgroundColor: '#EAECEF' },
  dialViewport: {
    height: TIME_WHEEL_ITEM_HEIGHT * TIME_WHEEL_VISIBLE_ITEMS,
    overflow: 'hidden',
  },
  dial: { flex: 1 },
  dialContent: { paddingVertical: TIME_WHEEL_PADDING },
  dialSelection: {
    position: 'absolute',
    zIndex: 1,
    top: TIME_WHEEL_PADDING,
    right: 0,
    left: 0,
    height: TIME_WHEEL_ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E4E4E7',
  },
  dialItem: {
    height: TIME_WHEEL_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialText: {
    color: '#18181B',
    fontFamily: 'FreesentationRegular',
    fontSize: 26,
    opacity: 0.5,
  },
  dialTextNear: { fontSize: 32, opacity: 0.5 },
  dialTextFar: { fontSize: 18, opacity: 0.18 },
  selectedDialText: {
    fontFamily: 'FreesentationExtraBold',
    fontSize: 48,
    opacity: 1,
  },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.65 },
});
