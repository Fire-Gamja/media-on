import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/colors';
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
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [attendeeCount, setAttendeeCount] = useState('1');
  const [purpose, setPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!roomId) {
      router.back();
      return;
    }
    void getPracticeRoom(roomId)
      .then(setRoom)
      .catch((error) => {
        Alert.alert('조회 실패', getAuthErrorMessage(error), [
          { text: '확인', onPress: () => router.back() },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, [roomId]);

  const handleSubmit = async () => {
    if (!roomId || !room) return;
    const count = Number(attendeeCount);
    if (!Number.isInteger(count) || count < 1 || count > room.capacity) {
      Alert.alert('인원 확인', `1명부터 최대 ${room.capacity}명까지 신청할 수 있습니다.`);
      return;
    }
    if (!isValidDate(reservationDate) || reservationDate < getLocalDate(0)) {
      Alert.alert('날짜 확인', '이용일은 오늘 이후의 정확한 날짜를 입력해 주세요.');
      return;
    }
    if (!isValidTime(startTime) || !isValidTime(endTime) || endTime <= startTime) {
      Alert.alert('시간 확인', '시작 시간보다 늦은 종료 시간을 입력해 주세요.');
      return;
    }
    const openTime = room.open_time.slice(0, 5);
    const closeTime = room.close_time.slice(0, 5);
    if (startTime < openTime || endTime > closeTime) {
      Alert.alert('운영시간 확인', `이 실습실은 ${openTime}~${closeTime}에 이용할 수 있습니다.`);
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
        startTime,
        endTime,
        attendeeCount: count,
        purpose,
      });
      Alert.alert('신청 완료', '실습실 대여 신청이 완료되었습니다.', [
        { text: '내 신청 확인', onPress: () => router.replace('/room-requests') },
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
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>실습실 대여 신청</Text>
          <View style={styles.headerSide} />
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}><ActivityIndicator size="large" color={COLORS.navy} /></View>
        ) : room ? (
          <>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <View style={styles.roomCard}>
                <Text style={styles.location}>{room.location}</Text>
                <Text style={styles.roomName}>{room.name}</Text>
                <Text style={styles.roomDescription}>{room.description ?? '학부 공용 실습실'}</Text>
                <Text style={styles.roomMeta}>{room.open_time.slice(0, 5)}~{room.close_time.slice(0, 5)} · 최대 {room.capacity}명</Text>
              </View>

              <Text style={styles.label}>이용일</Text>
              <TextInput value={reservationDate} onChangeText={(value) => setReservationDate(formatDateInput(value))} maxLength={10} keyboardType="number-pad" placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.placeholder} style={styles.input} />

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>시작 시간</Text>
                  <TextInput value={startTime} onChangeText={(value) => setStartTime(formatTimeInput(value))} maxLength={5} keyboardType="number-pad" placeholder="HH:MM" placeholderTextColor={COLORS.placeholder} style={styles.input} />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>종료 시간</Text>
                  <TextInput value={endTime} onChangeText={(value) => setEndTime(formatTimeInput(value))} maxLength={5} keyboardType="number-pad" placeholder="HH:MM" placeholderTextColor={COLORS.placeholder} style={styles.input} />
                </View>
              </View>

              <Text style={[styles.label, styles.spacedLabel]}>이용 인원</Text>
              <TextInput value={attendeeCount} onChangeText={(value) => setAttendeeCount(value.replace(/\D/g, ''))} maxLength={2} keyboardType="number-pad" placeholder="1" placeholderTextColor={COLORS.placeholder} style={styles.input} />

              <Text style={[styles.label, styles.spacedLabel]}>사용 목적</Text>
              <TextInput value={purpose} onChangeText={setPurpose} maxLength={1000} multiline textAlignVertical="top" placeholder="수업명, 팀 활동 등 사용 목적을 입력해 주세요" placeholderTextColor={COLORS.placeholder} style={styles.purposeInput} />
            </ScrollView>
            <View style={styles.footer}>
              <Pressable disabled={isSubmitting} onPress={() => void handleSubmit()} style={({ pressed }) => [styles.submitButton, isSubmitting && styles.disabled, pressed && !isSubmitting && styles.pressed]}>
                {isSubmitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>대여 신청</Text>}
              </Pressable>
            </View>
          </>
        ) : null}
      </KeyboardAvoidingView>
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

function formatTimeInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && getLocalDateFromDate(date) === value;
}

function getLocalDateFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isValidTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(':').map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface }, flex: { flex: 1 },
  header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 }, headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' }, headerSide: { width: 40 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' }, scrollView: { flex: 1, backgroundColor: COLORS.background }, content: { padding: 22, paddingBottom: 38 },
  roomCard: { marginBottom: 26, padding: 19, borderRadius: 17, backgroundColor: COLORS.navy }, location: { color: '#D9DDEF', fontSize: 11, fontWeight: '700' }, roomName: { marginTop: 7, color: COLORS.white, fontSize: 21, fontWeight: '900' }, roomDescription: { marginTop: 8, color: '#D9DDEF', fontSize: 12, lineHeight: 19 }, roomMeta: { marginTop: 12, color: COLORS.white, fontSize: 12, fontWeight: '800' },
  label: { marginBottom: 9, color: COLORS.text, fontSize: 14, fontWeight: '800' }, input: { height: 56, paddingHorizontal: 15, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, backgroundColor: COLORS.surface, color: COLORS.text, fontSize: 15 }, row: { marginTop: 23, flexDirection: 'row', gap: 10 }, halfField: { flex: 1 }, spacedLabel: { marginTop: 23 }, purposeInput: { minHeight: 150, padding: 15, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, backgroundColor: COLORS.surface, color: COLORS.text, fontSize: 14, lineHeight: 22 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface }, submitButton: { height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: COLORS.navy }, submitText: { color: COLORS.white, fontSize: 16, fontWeight: '800' }, disabled: { opacity: 0.55 }, pressed: { opacity: 0.7 },
});
