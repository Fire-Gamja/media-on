import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import { COLORS } from '../../constants/colors';
import {
  DateField,
  inclusiveDays,
  parseDate,
} from '../../components/common/DateField';
import { TimeSelectField } from '../../components/common/TimeSelectField';
import { maskProfanityInput } from '../../lib/content-filter';
import { getAuthErrorMessage } from '../../services/auth';
import {
  createRoomReservationRequest,
  getPracticeRoom,
  type PracticeRoom,
} from '../../services/room-reservations';

export default function RoomRequestScreen() {
  const { roomId: rawRoomId } = useLocalSearchParams<{ roomId?: string }>();
  const roomId = Array.isArray(rawRoomId) ? rawRoomId[0] : rawRoomId;
  const [room, setRoom] = useState<PracticeRoom | null>(null);
  const [reservationDate, setReservationDate] = useState(() => getLocalDate(1));
  const [endDate, setEndDate] = useState(() => getLocalDate(1));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:50');
  const [purpose, setPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { startTimeOptions, endTimeOptions } = useMemo(
    () => createClassTimeOptions(room?.open_time, room?.close_time),
    [room],
  );
  const availableEndTimes = endTimeOptions.filter((value) => value > startTime);

  const confirmErpApplication = () => {
    Alert.alert('통합정보시스템에 신청하셨나요?', undefined, [
      {
        text: '아니오',
        style: 'cancel',
        onPress: () =>
          Alert.alert(
            '신청 안내',
            '통합정보시스템에서 신청 후 해당 기능을 사용해 주세요.',
          ),
      },
      { text: '예', onPress: () => void handleSubmit() },
    ]);
  };

  useEffect(() => {
    if (!roomId) {
      router.back();
      return;
    }
    void getPracticeRoom(roomId)
      .then((nextRoom) => {
        setRoom(nextRoom);
        const options = createClassTimeOptions(
          nextRoom.open_time,
          nextRoom.close_time,
        );
        const nextStart = options.startTimeOptions[0] ?? '09:00';
        const nextEnd =
          options.endTimeOptions.find((value) => value > nextStart) ?? '09:50';
        setStartTime(nextStart);
        setEndTime(nextEnd);
      })
      .catch((error) => {
        Alert.alert('조회 실패', getAuthErrorMessage(error), [
          { text: '확인', onPress: () => router.back() },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, [roomId]);

  const handleSubmit = async () => {
    if (!roomId || !room) return;
    if (!isValidDate(reservationDate) || reservationDate < getLocalDate(0)) {
      Alert.alert(
        '날짜 확인',
        '이용일은 오늘 이후의 정확한 날짜를 입력해 주세요.',
      );
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
    const openTime = room.open_time.slice(0, 5);
    const closeTime = room.close_time.slice(0, 5);
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
        roomId,
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <PlatformHeaderIcon name="back" />
        </Pressable>
        <Text style={styles.headerTitle}>실습실 대여 신청</Text>
        <View style={styles.headerSide} />
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.navy} />
        </View>
      ) : room ? (
        <KeyboardAwareScrollView
          bottomOffset={24}
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={styles.roomCard}>
            <Text style={styles.location}>{room.location}</Text>
            <Text style={styles.roomName}>{room.name}</Text>
            <Text style={styles.roomDescription}>
              {room.description ?? '학부 공용 실습실'}
            </Text>
            <Text style={styles.roomMeta}>
              {room.open_time.slice(0, 5)}~{room.close_time.slice(0, 5)} · 최대{' '}
              {room.capacity}명
            </Text>
          </View>

          <View style={styles.dateRange}>
            <DateField
              label="시작일"
              value={reservationDate}
              minimumDate={new Date()}
              onChange={(value) => {
                setReservationDate(value);
                if (endDate < value) setEndDate(value);
              }}
            />
            <DateField
              label="종료일"
              value={endDate}
              minimumDate={parseDate(reservationDate)}
              onChange={setEndDate}
            />
          </View>
          <Text style={styles.dayCount}>
            {reservationDate} ~ {endDate} · 총{' '}
            {inclusiveDays(reservationDate, endDate)}일
          </Text>

          <View style={styles.row}>
            <TimeSelectField
              label="시작 시간"
              onChange={(value) => {
                setStartTime(value);
                if (endTime <= value) {
                  setEndTime(
                    endTimeOptions.find((option) => option > value) ?? value,
                  );
                }
              }}
              options={startTimeOptions}
              value={startTime}
            />
            <TimeSelectField
              label="종료 시간"
              onChange={setEndTime}
              options={availableEndTimes}
              value={endTime}
            />
          </View>

          <Text style={[styles.label, styles.spacedLabel]}>이용 인원</Text>
          <View style={styles.fixedCapacityBox}>
            <Text style={styles.fixedCapacityText}>40명 고정</Text>
          </View>

          <Text style={[styles.label, styles.spacedLabel]}>사용 목적</Text>
          <View style={styles.purposeGuide}>
            <Text style={styles.purposeGuideText}>
              통합정보시스템에 작성하신 목적과 동일하게 작성해 주세요.
            </Text>
            <Text style={styles.purposeGuideText}>
              24시간 대여하신 경우에는 실습조교에게 상담 요청해 주세요.
            </Text>
          </View>
          <TextInput
            value={purpose}
            onChangeText={(value) => setPurpose(maskProfanityInput(value))}
            maxLength={1000}
            multiline
            textAlignVertical="top"
            placeholder="통합정보시스템에 입력한 사용 목적을 작성해 주세요"
            placeholderTextColor={COLORS.placeholder}
            style={styles.purposeInput}
          />
          <Pressable
            disabled={isSubmitting}
            onPress={confirmErpApplication}
            style={({ pressed }) => [
              styles.submitButton,
              isSubmitting && styles.disabled,
              pressed && !isSubmitting && styles.pressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitText}>대여 신청</Text>
            )}
          </Pressable>
        </KeyboardAwareScrollView>
      ) : null}
    </SafeAreaView>
  );
}

function getLocalDate(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && getLocalDateFromDate(date) === value;
}

function getLocalDateFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function createClassTimeOptions(openTime = '09:00', closeTime = '23:50') {
  const firstHour = Math.floor(toMinutes(openTime) / 60);
  const lastHour = Math.floor(toMinutes(closeTime) / 60);
  const hours = Array.from(
    { length: Math.max(0, lastHour - firstHour + 1) },
    (_, index) => firstHour + index,
  );

  return {
    startTimeOptions: hours.map(
      (hour) => `${String(hour).padStart(2, '0')}:00`,
    ),
    endTimeOptions: hours.map((hour) => `${String(hour).padStart(2, '0')}:50`),
  };
}

function toMinutes(value: string) {
  const [hour, minute] = value.slice(0, 5).split(':').map(Number);
  return hour * 60 + minute;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  headerSide: { width: 40 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 22, paddingBottom: 32 },
  roomCard: {
    marginBottom: 26,
    padding: 19,
    borderRadius: 17,
    backgroundColor: COLORS.navy,
  },
  location: { color: '#D9DDEF', fontSize: 11, fontWeight: '700' },
  roomName: {
    marginTop: 7,
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '900',
  },
  roomDescription: {
    marginTop: 8,
    color: '#D9DDEF',
    fontSize: 12,
    lineHeight: 19,
  },
  roomMeta: {
    marginTop: 12,
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  label: {
    marginBottom: 9,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  row: { marginTop: 23, flexDirection: 'row', gap: 10 },
  spacedLabel: { marginTop: 23 },
  purposeInput: {
    minHeight: 150,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
  },
  dateRange: { flexDirection: 'row', gap: 10 },
  dayCount: {
    marginTop: 10,
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: '800',
  },
  fixedCapacityBox: {
    height: 56,
    paddingHorizontal: 15,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.softNavy,
  },
  fixedCapacityText: { color: COLORS.navy, fontSize: 15, fontWeight: '800' },
  purposeGuide: {
    marginBottom: 10,
    padding: 14,
    gap: 5,
    borderRadius: 13,
    backgroundColor: COLORS.softNavy,
  },
  purposeGuideText: {
    color: COLORS.navy,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  submitButton: {
    height: 56,
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.navy,
  },
  submitText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.7 },
});
