import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '../../components/common/AppIcon';
import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import { COLORS } from '../../constants/colors';
import {
  getAuthErrorMessage,
  getCurrentProfile,
  type StudentProfile,
} from '../../services/auth';
import {
  cancelPreGraduationReservation,
  DEFAULT_PRE_GRADUATION_SETTINGS,
  getPreGraduationSchedule,
  getPreGraduationSettings,
  getPreGraduationWeekdayLabel,
  PRE_GRADUATION_WEEKDAYS,
  reservePreGraduationSlot,
  type PreGraduationSettings,
  type PreGraduationSlot,
  type PreGraduationWeekday,
} from '../../services/pre-graduation';

export default function PreGraduationScreen() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [settings, setSettings] = useState<PreGraduationSettings>(
    DEFAULT_PRE_GRADUATION_SETTINGS,
  );
  const [slots, setSlots] = useState<PreGraduationSlot[]>([]);
  const [selectedWeekday, setSelectedWeekday] =
    useState<PreGraduationWeekday>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadScreen = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [nextProfile, nextSettings] = await Promise.all([
        getCurrentProfile(),
        getPreGraduationSettings(),
      ]);
      setProfile(nextProfile);
      setSettings(nextSettings);

      const firstEnabledWeekday = nextSettings.enabled_weekdays[0] ?? 1;
      setSelectedWeekday((current) =>
        nextSettings.enabled_weekdays.includes(current)
          ? current
          : firstEnabledWeekday,
      );

      if (
        nextProfile.grade === 4 &&
        nextSettings.access_enabled &&
        nextSettings.enabled_weekdays.length > 0
      ) {
        setSlots(await getPreGraduationSchedule());
      } else {
        setSlots([]);
      }
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
      setSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadScreen();
    }, [loadScreen]),
  );

  const myReservation = useMemo(
    () => slots.find((slot) => slot.is_mine) ?? null,
    [slots],
  );
  const selectedSlots = useMemo(
    () => slots.filter((slot) => slot.weekday === selectedWeekday),
    [selectedWeekday, slots],
  );
  const blockedMessage =
    profile && profile.grade !== 4
      ? '4학년 학생만 예비졸업사정을 신청할 수 있습니다.'
      : !settings.access_enabled
        ? '관리자가 신청을 열면 예약할 수 있습니다.'
        : settings.enabled_weekdays.length === 0
          ? '현재 신청 가능한 요일이 없습니다.'
          : null;

  const confirmReservation = (slot: PreGraduationSlot) => {
    const weekdayLabel = getPreGraduationWeekdayLabel(slot.weekday, true);

    Alert.alert(
      '예비졸업사정 예약',
      `${weekdayLabel} ${slot.slot_start} ~ ${slot.slot_end} 시간으로 신청하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '신청',
          onPress: () => void reserveSlot(slot),
        },
      ],
    );
  };

  const reserveSlot = async (slot: PreGraduationSlot) => {
    try {
      setIsSubmitting(true);
      await reservePreGraduationSlot({
        weekday: slot.weekday,
        startTime: slot.slot_start,
      });
      await loadScreen();
      Alert.alert(
        '신청 완료',
        `${getPreGraduationWeekdayLabel(slot.weekday, true)} ${slot.slot_start} ~ ${slot.slot_end} 예약이 완료되었습니다.`,
      );
    } catch (error) {
      Alert.alert('신청 실패', getAuthErrorMessage(error));
      await loadScreen();
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmCancellation = (slot: PreGraduationSlot) => {
    if (!slot.reservation_id) {
      return;
    }

    Alert.alert(
      '예약 취소',
      `${getPreGraduationWeekdayLabel(slot.weekday, true)} ${slot.slot_start} 예약을 취소하시겠습니까?`,
      [
        { text: '유지', style: 'cancel' },
        {
          text: '예약 취소',
          style: 'destructive',
          onPress: () => void cancelReservation(slot.reservation_id!),
        },
      ],
    );
  };

  const cancelReservation = async (reservationId: string) => {
    try {
      setIsSubmitting(true);
      await cancelPreGraduationReservation(reservationId);
      await loadScreen();
      Alert.alert('취소 완료', '예비졸업사정 예약이 취소되었습니다.');
    } catch (error) {
      Alert.alert('취소 실패', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
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
        <Text style={styles.headerTitle}>4학년 예비졸업사정</Text>
        <View style={styles.headerSide} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.navy} size="large" />
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
              <Text style={styles.guideTitle}>예비졸업사정 예약</Text>
              <Text style={styles.guideText}>
                상담 시간은 1인당 20분이며, 한 번만 예약할 수 있습니다.
              </Text>
            </View>
          </View>

          {errorMessage ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>정보를 불러오지 못했습니다.</Text>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void loadScreen()}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>다시 불러오기</Text>
              </Pressable>
            </View>
          ) : blockedMessage ? (
            <View style={styles.stateCard}>
              <View style={styles.lockIcon}>
                <Text style={styles.lockText}>!</Text>
              </View>
              <Text style={styles.stateTitle}>현재 접근할 수 없습니다.</Text>
              <Text style={styles.stateText}>{blockedMessage}</Text>
            </View>
          ) : (
            <>
              {myReservation ? (
                <View style={styles.myReservationCard}>
                  <View>
                    <Text style={styles.myReservationLabel}>내 예약</Text>
                    <Text style={styles.myReservationTime}>
                      {getPreGraduationWeekdayLabel(
                        myReservation.weekday,
                        true,
                      )}{' '}
                      {myReservation.slot_start} ~ {myReservation.slot_end}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isSubmitting}
                    onPress={() => confirmCancellation(myReservation)}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>예약 취소</Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>신청 요일</Text>
                <Text style={styles.sectionDescription}>
                  관리자가 활성화한 요일만 선택할 수 있습니다.
                </Text>
                <View style={styles.weekdayRow}>
                  {PRE_GRADUATION_WEEKDAYS.map((weekday) => {
                    const isEnabled = settings.enabled_weekdays.includes(
                      weekday.value,
                    );
                    const isSelected =
                      selectedWeekday === weekday.value && isEnabled;

                    return (
                      <Pressable
                        key={weekday.value}
                        accessibilityRole="tab"
                        accessibilityState={{
                          disabled: !isEnabled,
                          selected: isSelected,
                        }}
                        disabled={!isEnabled}
                        onPress={() => setSelectedWeekday(weekday.value)}
                        style={[
                          styles.weekdayButton,
                          !isEnabled && styles.weekdayButtonDisabled,
                          isSelected && styles.weekdayButtonSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.weekdayText,
                            !isEnabled && styles.weekdayTextDisabled,
                            isSelected && styles.weekdayTextSelected,
                          ]}
                        >
                          {weekday.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>예약 시간</Text>
                <Text style={styles.sectionDescription}>
                  10:20부터 16:20까지 20분 단위로 운영됩니다.
                </Text>
                <View style={styles.slotGrid}>
                  {selectedSlots.map((slot) => {
                    const isOccupied = Boolean(slot.reservation_id);
                    const isDisabled =
                      isSubmitting ||
                      (isOccupied && !slot.is_mine) ||
                      (Boolean(myReservation) && !slot.is_mine);
                    const slotCaption = slot.is_mine
                      ? '내 예약'
                      : isOccupied
                        ? `${slot.student_name ?? '다른 학생'} 학생 예약`
                        : myReservation
                          ? '예약 완료됨'
                          : '신청 가능';

                    return (
                      <Pressable
                        key={`${slot.weekday}-${slot.slot_start}`}
                        accessibilityLabel={`${slot.slot_start}부터 ${slot.slot_end}, ${slotCaption}`}
                        accessibilityRole="button"
                        disabled={isDisabled}
                        onPress={() =>
                          slot.is_mine
                            ? confirmCancellation(slot)
                            : confirmReservation(slot)
                        }
                        style={({ pressed }) => [
                          styles.slotCard,
                          isOccupied && styles.slotCardOccupied,
                          slot.is_mine && styles.slotCardMine,
                          isDisabled &&
                            !isOccupied &&
                            styles.slotCardDisabled,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.slotTime,
                            slot.is_mine && styles.slotTextMine,
                          ]}
                        >
                          {slot.slot_start} ~ {slot.slot_end}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.slotCaption,
                            isOccupied && styles.slotCaptionOccupied,
                            slot.is_mine && styles.slotTextMine,
                          ]}
                        >
                          {slotCaption}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}
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
    fontSize: 18,
  },
  headerSide: {
    width: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
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
  stateCard: {
    marginTop: 20,
    padding: 28,
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  lockIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: COLORS.softNavy,
  },
  lockText: {
    color: COLORS.navy,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 23,
  },
  stateTitle: {
    marginTop: 14,
    color: COLORS.text,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 17,
    textAlign: 'center',
  },
  stateText: {
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
  myReservationCard: {
    marginTop: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#C7CDEB',
    borderRadius: 16,
    backgroundColor: '#EEF0FA',
  },
  myReservationLabel: {
    color: COLORS.navy,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 12,
  },
  myReservationTime: {
    marginTop: 5,
    color: COLORS.text,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 16,
  },
  cancelButton: {
    height: 38,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
  cancelButtonText: {
    color: COLORS.error,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 12,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: COLORS.text,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
  },
  sectionDescription: {
    marginTop: 5,
    color: COLORS.subText,
    fontFamily: 'FreesentationRegular',
    fontSize: 13,
  },
  weekdayRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  weekdayButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  weekdayButtonDisabled: {
    borderColor: '#ECEEF3',
    backgroundColor: '#ECEEF3',
  },
  weekdayButtonSelected: {
    borderColor: COLORS.navy,
    backgroundColor: COLORS.navy,
  },
  weekdayText: {
    color: COLORS.text,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 15,
  },
  weekdayTextDisabled: {
    color: COLORS.disabledText,
  },
  weekdayTextSelected: {
    color: COLORS.white,
  },
  slotGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotCard: {
    width: '48%',
    minHeight: 70,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
  },
  slotCardOccupied: {
    borderColor: '#E3E5EA',
    backgroundColor: '#ECEEF2',
  },
  slotCardMine: {
    borderColor: COLORS.navy,
    backgroundColor: COLORS.navy,
  },
  slotCardDisabled: {
    opacity: 0.48,
  },
  slotTime: {
    color: COLORS.text,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  slotCaption: {
    maxWidth: '100%',
    marginTop: 6,
    color: COLORS.success,
    fontFamily: 'FreesentationRegular',
    fontSize: 11,
  },
  slotCaptionOccupied: {
    color: COLORS.subText,
  },
  slotTextMine: {
    color: COLORS.white,
  },
  pressed: {
    opacity: 0.7,
  },
});
