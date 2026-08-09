import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '../../components/common/AppIcon';
import { BottomSheetModal } from '../../components/common/BottomSheetModal';
import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import MonthCalendar, { fromDateKey, toDateKey } from '../../components/student/MonthCalendar';
import { COLORS } from '../../constants/colors';
import { getAuthErrorMessage } from '../../services/auth';
import {
  cancelPreGraduationReservation,
  formatPreGraduationDate,
  getPreGraduationSchedule,
  getPreGraduationSettings,
  updatePreGraduationSettings,
  type PreGraduationSlot,
} from '../../services/pre-graduation';

export default function AdminPreGraduationScreen() {
  const [accessEnabled, setAccessEnabled] = useState(false);
  const [enabledDates, setEnabledDates] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [calendarDate, setCalendarDate] = useState(toDateKey(new Date()));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [slots, setSlots] = useState<PreGraduationSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadScreen = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [settings, schedule] = await Promise.all([
        getPreGraduationSettings(),
        getPreGraduationSchedule(),
      ]);
      setAccessEnabled(settings.access_enabled);
      setEnabledDates(settings.enabled_dates);
      setSlots(schedule);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadScreen();
    }, [loadScreen]),
  );

  const reservations = useMemo(
    () => slots.filter((slot) => Boolean(slot.reservation_id)),
    [slots],
  );

  const handleSave = async () => {
    if (accessEnabled && enabledDates.length === 0) {
      Alert.alert(
        '날짜 선택',
        '접근을 허용하려면 신청받을 날짜를 한 개 이상 선택해 주세요.',
      );
      return;
    }

    try {
      setIsSaving(true);
      const settings = await updatePreGraduationSettings({
        accessEnabled,
        enabledDates,
      });
      setAccessEnabled(settings.access_enabled);
      setEnabledDates(settings.enabled_dates);
      Alert.alert(
        '저장 완료',
        settings.access_enabled
          ? '4학년 학생의 예비졸업사정 신청이 열렸습니다.'
          : '예비졸업사정 신청 접근을 닫았습니다.',
      );
    } catch (error) {
      Alert.alert('저장 실패', getAuthErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const confirmCancellation = (slot: PreGraduationSlot) => {
    if (!slot.reservation_id) {
      return;
    }

    Alert.alert(
      '예약 삭제',
      `${slot.student_number ?? '학번 미확인'} · ${slot.student_name ?? '학생'}의 ${formatPreGraduationDate(slot.reservation_date, 'ko-KR', true)} ${slot.slot_start} 예약을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => void cancelReservation(slot.reservation_id!),
        },
      ],
    );
  };

  const cancelReservation = async (reservationId: string) => {
    try {
      setProcessingId(reservationId);
      await cancelPreGraduationReservation(reservationId);
      await loadScreen();
      Alert.alert('삭제 완료', '예비졸업사정 예약을 삭제했습니다.');
    } catch (error) {
      Alert.alert('삭제 실패', getAuthErrorMessage(error));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
        >
          <PlatformHeaderIcon name="back" />
        </Pressable>
        <Text style={styles.headerTitle}>예졸사 예약 설정</Text>
        <View style={styles.headerSide} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.navy} size="large" />
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>정보를 불러오지 못했습니다.</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadScreen()}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>다시 불러오기</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          style={styles.scrollView}
        >
          <View style={styles.guideCard}>
            <View style={styles.guideIcon}>
              <AppIcon color={COLORS.white} name="graduation" size={34} />
            </View>
            <View style={styles.guideTextArea}>
              <Text style={styles.guideTitle}>4학년 예비졸업사정</Text>
              <Text style={styles.guideText}>
                전체 접근 허용과 실제 신청 날짜를 설정합니다. 시간은
                10:00~17:40, 20분 단위이며 12:00~13:00은 제외됩니다.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextArea}>
                <Text style={styles.sectionTitle}>학생 접근 허용</Text>
                <Text style={styles.sectionDescription}>
                  켜면 4학년 학생만 예약 화면에 접근할 수 있습니다.
                </Text>
              </View>
              <Switch
                accessibilityLabel="예비졸업사정 학생 접근 허용"
                accessibilityRole="switch"
                onValueChange={setAccessEnabled}
                thumbColor={COLORS.white}
                trackColor={{
                  false: COLORS.disabled,
                  true: COLORS.navy,
                }}
                value={accessEnabled}
              />
            </View>
            <View
              style={[
                styles.accessState,
                accessEnabled
                  ? styles.accessStateOpen
                  : styles.accessStateClosed,
              ]}
            >
              <Text
                style={[
                  styles.accessStateText,
                  accessEnabled
                    ? styles.accessStateTextOpen
                    : styles.accessStateTextClosed,
                ]}
              >
                {accessEnabled ? '신청 접근 허용' : '신청 접근 차단'}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>신청받을 날짜</Text>
            <Text style={styles.sectionDescription}>
              선택한 날짜만 학생 예약 화면과 알림에 표시됩니다.
            </Text>
            <View style={styles.dateList}>
              {enabledDates.map((date) => (
                <View key={date} style={styles.dateChip}>
                  <Text style={styles.dateChipText}>
                    {formatPreGraduationDate(date)}
                  </Text>
                  <Pressable
                    accessibilityLabel={`${date} 삭제`}
                    hitSlop={8}
                    onPress={() => setEnabledDates((current) => current.filter((item) => item !== date))}
                  >
                    <Text style={styles.dateRemove}>×</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsDatePickerOpen(true)}
                style={styles.addDateButton}
              >
                <Text style={styles.addDateText}>+ 날짜 추가</Text>
              </Pressable>
            </View>
            <View style={styles.timeInfo}>
              <AppIcon color={COLORS.navy} name="hours" size={20} />
              <Text style={styles.timeInfoText}>
                10:00 ~ 17:40 · 20분 단위 · 12:00 ~ 13:00 제외
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => void handleSave()}
            style={({ pressed }) => [
              styles.saveButton,
              isSaving && styles.disabled,
              pressed && !isSaving && styles.pressed,
            ]}
          >
            {isSaving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveText}>예졸사 설정 저장</Text>
            )}
          </Pressable>

          <View style={styles.reservationSection}>
            <View style={styles.reservationHeader}>
              <Text style={styles.sectionTitle}>예약 현황</Text>
              <Text style={styles.reservationCount}>
                {reservations.length}명
              </Text>
            </View>

            {reservations.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  현재 접수된 예비졸업사정 예약이 없습니다.
                </Text>
              </View>
            ) : (
              <View style={styles.reservationList}>
                {reservations.map((slot) => (
                  <View
                    key={slot.reservation_id}
                    style={styles.reservationCard}
                  >
                    <View style={styles.dayBadge}>
                      <Text style={styles.dayBadgeText}>
                        {fromDateKey(slot.reservation_date).getDate()}일
                      </Text>
                    </View>
                    <View style={styles.reservationDetails}>
                      <Text style={styles.reservationStudent}>
                        {slot.student_number ?? '학번 미확인'} ·{' '}
                        {slot.student_name ?? '학생'}
                      </Text>
                      <Text style={styles.reservationTime}>
                        {formatPreGraduationDate(slot.reservation_date)} · {slot.slot_start} ~ {slot.slot_end}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityLabel="예비졸업사정 예약 삭제"
                      accessibilityRole="button"
                      disabled={processingId === slot.reservation_id}
                      hitSlop={8}
                      onPress={() => confirmCancellation(slot)}
                      style={styles.deleteButton}
                    >
                      {processingId === slot.reservation_id ? (
                        <ActivityIndicator color={COLORS.error} size="small" />
                      ) : (
                        <AppIcon
                          color={COLORS.error}
                          name="trash"
                          size={20}
                        />
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
      <BottomSheetModal
        accessibilityLabel="날짜 선택 닫기"
        onRequestClose={() => setIsDatePickerOpen(false)}
        visible={isDatePickerOpen}
      >
        <View style={styles.calendarSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>신청 날짜 선택</Text>
          <MonthCalendar
            eventDates={new Set(enabledDates)}
            minimumDate={toDateKey(new Date())}
            month={calendarMonth}
            onChangeMonth={setCalendarMonth}
            onSelectDate={setCalendarDate}
            selectedDate={calendarDate}
            showMonthControls
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setEnabledDates((current) => Array.from(new Set([...current, calendarDate])).sort());
              setIsDatePickerOpen(false);
            }}
            style={styles.sheetConfirm}
          >
            <Text style={styles.sheetConfirmText}>이 날짜 추가</Text>
          </Pressable>
        </View>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    color: COLORS.text,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 20,
  },
  headerSide: {
    width: 24,
  },
  centered: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    color: COLORS.text,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 17,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    color: COLORS.subText,
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 130,
    height: 44,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.navy,
  },
  retryText: {
    color: COLORS.white,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  guideCard: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.navy,
  },
  guideIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  guideTextArea: {
    flex: 1,
    marginLeft: 14,
  },
  guideTitle: {
    color: COLORS.white,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
  },
  guideText: {
    marginTop: 6,
    color: '#D9DDEF',
    fontFamily: 'FreesentationRegular',
    fontSize: 13,
    lineHeight: 19,
  },
  card: {
    marginTop: 18,
    padding: 20,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleTextArea: {
    flex: 1,
    paddingRight: 16,
  },
  sectionTitle: {
    color: COLORS.text,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
  },
  sectionDescription: {
    marginTop: 6,
    color: COLORS.subText,
    fontFamily: 'FreesentationRegular',
    fontSize: 13,
    lineHeight: 19,
  },
  accessState: {
    height: 34,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  accessStateOpen: {
    backgroundColor: '#E9F8ED',
  },
  accessStateClosed: {
    backgroundColor: '#F1F2F5',
  },
  accessStateText: {
    fontFamily: 'FreesentationSemiBold',
    fontSize: 13,
  },
  accessStateTextOpen: {
    color: COLORS.success,
  },
  accessStateTextClosed: {
    color: COLORS.subText,
  },
  dateList: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateChip: {
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.navy,
    borderRadius: 12,
    backgroundColor: COLORS.softNavy,
  },
  dateChipText: {
    color: COLORS.navy,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  dateRemove: { color: COLORS.navy, fontSize: 20, lineHeight: 22 },
  addDateButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.navy,
    borderRadius: 12,
  },
  addDateText: {
    color: COLORS.navy,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  timeInfo: {
    marginTop: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    backgroundColor: COLORS.softNavy,
  },
  timeInfoText: {
    flex: 1,
    color: COLORS.navy,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 13,
  },
  saveButton: {
    height: 54,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.navy,
  },
  saveText: {
    color: COLORS.white,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 16,
  },
  reservationSection: {
    marginTop: 28,
  },
  reservationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reservationCount: {
    color: COLORS.navy,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  emptyCard: {
    minHeight: 100,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  emptyText: {
    color: COLORS.subText,
    fontFamily: 'FreesentationRegular',
    fontSize: 13,
  },
  reservationList: {
    marginTop: 12,
    gap: 10,
  },
  reservationCard: {
    minHeight: 68,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.surface,
  },
  dayBadge: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.navy,
  },
  dayBadgeText: {
    color: COLORS.white,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 15,
  },
  reservationDetails: {
    flex: 1,
    marginLeft: 12,
  },
  reservationStudent: {
    color: COLORS.text,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  reservationTime: {
    marginTop: 5,
    color: COLORS.subText,
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
  },
  deleteButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.7,
  },
  calendarSheet: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: COLORS.surface,
  },
  sheetHandle: {
    width: 34,
    height: 5,
    alignSelf: 'center',
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  sheetTitle: {
    marginVertical: 18,
    color: COLORS.text,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
    textAlign: 'center',
  },
  sheetConfirm: {
    height: 52,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.navy,
  },
  sheetConfirmText: {
    color: COLORS.white,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 15,
  },
});
