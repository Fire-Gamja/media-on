import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import { COLORS } from '../../constants/colors';
import { useAppSettings } from '../../context/app-settings-context';
import {
  type AppLanguage,
  translate,
  type TranslationKey,
} from '../../i18n/translations';
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
  reservePreGraduationSlot,
  type PreGraduationSettings,
  type PreGraduationSlot,
  type PreGraduationWeekday,
} from '../../services/pre-graduation';

const EVENT_DAYS: Record<PreGraduationWeekday, number> = {
  1: 7,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
};

const LANGUAGE_LOCALES: Record<AppLanguage, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  zh: 'zh-CN',
  ja: 'ja-JP',
  vi: 'vi-VN',
  th: 'th-TH',
};

export default function PreGraduationScreen() {
  const { language } = useAppSettings();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [settings, setSettings] = useState<PreGraduationSettings>(
    DEFAULT_PRE_GRADUATION_SETTINGS,
  );
  const [slots, setSlots] = useState<PreGraduationSlot[]>([]);
  const [selectedWeekday, setSelectedWeekday] =
    useState<PreGraduationWeekday>(1);
  const [selectedSlot, setSelectedSlot] =
    useState<PreGraduationSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

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

  const myReservations = useMemo(
    () => slots.filter((slot) => slot.is_mine),
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
  const canReserve = !errorMessage && !blockedMessage;

  const selectWeekday = (weekday: PreGraduationWeekday) => {
    setSelectedWeekday(weekday);
    setSelectedSlot(null);
  };

  const selectSlot = (slot: PreGraduationSlot) => {
    if (slot.is_mine) {
      confirmCancellation(slot);
      return;
    }

    if (!slot.reservation_id) {
      setSelectedSlot(slot);
    }
  };

  const reserveSlot = async () => {
    if (!selectedSlot) {
      return;
    }

    try {
      setIsSubmitting(true);
      await reservePreGraduationSlot({
        weekday: selectedSlot.weekday,
        startTime: selectedSlot.slot_start,
      });
      setShowConfirmation(false);
      await loadScreen();
      setShowCompletion(true);
    } catch (error) {
      setShowConfirmation(false);
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
      translate(language, 'pre.cancelReservation'),
      `${formatReservationDate(slot.weekday, language)} ${slot.slot_start} 예약을 취소하시겠습니까?`,
      [
        { text: '유지', style: 'cancel' },
        {
          text: translate(language, 'pre.cancelReservation'),
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
          accessibilityLabel={translate(language, 'common.back')}
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.headerSide}
        >
          <PlatformHeaderIcon color={COLORS.text} name="back" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {translate(language, 'pre.title')}
        </Text>
        <View style={styles.headerSide} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#3550FF" size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            canReserve && styles.contentWithButton,
          ]}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          {errorMessage ? (
            <StateCard
              description={errorMessage}
              onRetry={() => void loadScreen()}
              title={translate(language, 'pre.loadFailed')}
              language={language}
            />
          ) : blockedMessage ? (
            <StateCard
              description={blockedMessage}
              title={translate(language, 'pre.unavailable')}
              language={language}
            />
          ) : (
            <>
              <Text style={styles.heroTitle}>
                {translate(language, 'pre.heading')}
              </Text>
              <View style={styles.divider} />

              {myReservations.length > 0 ? (
                <ScrollView
                  contentContainerStyle={styles.reservationList}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {myReservations.map((reservation) => (
                    <Pressable
                      key={reservation.reservation_id}
                      accessibilityRole="button"
                      disabled={isSubmitting}
                      onPress={() => confirmCancellation(reservation)}
                      style={styles.myReservation}
                    >
                      <Text style={styles.myReservationLabel}>
                        {translate(language, 'pre.mine')}
                      </Text>
                      <Text style={styles.myReservationTime}>
                        {formatReservationDate(
                          reservation.weekday,
                          language,
                        )}{' '}
                        {reservation.slot_start}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {translate(language, 'pre.visitDate')}
                </Text>
                <ScrollView
                  contentContainerStyle={styles.dateRow}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {settings.enabled_weekdays.map((weekday) => {
                    const selected = weekday === selectedWeekday;
                    return (
                      <Pressable
                        key={weekday}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        onPress={() => selectWeekday(weekday)}
                        style={[
                          styles.dateCard,
                          selected && styles.selectedCard,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dateDay,
                            selected && styles.selectedText,
                          ]}
                        >
                          {EVENT_DAYS[weekday]}
                          {language === 'ko' ? '일' : ''}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.dateWeekday,
                            selected && styles.selectedText,
                          ]}
                        >
                          {translate(
                            language,
                            `weekday.${weekday}` as TranslationKey,
                          )}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {translate(language, 'pre.visitTime')}
                </Text>
                <View style={styles.slotGrid}>
                  {selectedSlots.map((slot) => {
                    const occupied = Boolean(slot.reservation_id);
                    const selected =
                      selectedSlot?.weekday === slot.weekday &&
                      selectedSlot.slot_start === slot.slot_start;
                    const disabled =
                      isSubmitting || (occupied && !slot.is_mine);
                    const caption = slot.is_mine
                      ? translate(language, 'pre.mine')
                      : occupied
                        ? `${slot.student_name ?? ''} ${translate(language, 'pre.booked')}`.trim()
                        : translate(language, 'pre.available');

                    return (
                      <Pressable
                        key={`${slot.weekday}-${slot.slot_start}`}
                        accessibilityRole="button"
                        accessibilityState={{ disabled, selected }}
                        disabled={disabled}
                        onPress={() => selectSlot(slot)}
                        style={({ pressed }) => [
                          styles.slotCard,
                          selected && styles.selectedCard,
                          occupied && !slot.is_mine && styles.occupiedCard,
                          slot.is_mine && styles.mySlotCard,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.slotTime,
                            (selected || slot.is_mine) && styles.selectedText,
                            occupied && !slot.is_mine && styles.occupiedText,
                          ]}
                        >
                          {slot.slot_start}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.slotCaption,
                            (selected || slot.is_mine) && styles.selectedText,
                            occupied && !slot.is_mine && styles.occupiedText,
                          ]}
                        >
                          {caption}
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

      {!isLoading && canReserve ? (
        <View style={styles.bottomBar}>
          <Pressable
            accessibilityRole="button"
            disabled={!selectedSlot || isSubmitting}
            onPress={() => setShowConfirmation(true)}
            style={({ pressed }) => [
              styles.nextButton,
              (!selectedSlot || isSubmitting) && styles.nextButtonDisabled,
              pressed && selectedSlot && styles.pressed,
            ]}
          >
            <Text style={styles.nextText}>
              {translate(language, 'pre.next')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <ReservationConfirmationModal
        isSubmitting={isSubmitting}
        language={language}
        onCancel={() => setShowConfirmation(false)}
        onConfirm={() => void reserveSlot()}
        slot={selectedSlot}
        visible={showConfirmation}
      />

      <Modal
        animationType="fade"
        onRequestClose={() => setShowCompletion(false)}
        transparent
        visible={showCompletion}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.completionModal}>
            <Text style={styles.completionText}>
              {translate(language, 'pre.complete')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setShowCompletion(false);
                setSelectedSlot(null);
              }}
              style={({ pressed }) => [
                styles.completionButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.completionButtonText}>
                {translate(language, 'pre.ok')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StateCard({
  description,
  language,
  onRetry,
  title,
}: {
  description: string;
  language: AppLanguage;
  onRetry?: () => void;
  title: string;
}) {
  return (
    <View style={styles.stateCard}>
      <View style={styles.stateIcon}>
        <Text style={styles.stateIconText}>!</Text>
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateDescription}>{description}</Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>
            {translate(language, 'pre.retry')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ReservationConfirmationModal({
  isSubmitting,
  language,
  onCancel,
  onConfirm,
  slot,
  visible,
}: {
  isSubmitting: boolean;
  language: AppLanguage;
  onCancel: () => void;
  onConfirm: () => void;
  slot: PreGraduationSlot | null;
  visible: boolean;
}) {
  if (!slot) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.confirmationModal}>
          <View style={styles.confirmationContent}>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>
                {formatReservationDate(slot.weekday, language)}{' '}
                <Text style={styles.datePillTime}>{slot.slot_start}</Text>
              </Text>
            </View>
            <Text style={styles.confirmationQuestion}>
              {translate(language, 'pre.confirmQuestion')}
            </Text>
          </View>
          <View style={styles.confirmationActions}>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onCancel}
              style={styles.noButton}
            >
              <Text style={styles.noButtonText}>
                {translate(language, 'pre.no')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onConfirm}
              style={styles.yesButton}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.yesButtonText}>
                  {translate(language, 'pre.yes')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function formatReservationDate(
  weekday: PreGraduationWeekday,
  language: AppLanguage,
) {
  const date = new Date(2026, 8, EVENT_DAYS[weekday]);
  return new Intl.DateTimeFormat(LANGUAGE_LOCALES[language], {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    height: 56,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: COLORS.surface,
  },
  headerSide: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#2D2D2D',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 20,
    textAlign: 'center',
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1, backgroundColor: COLORS.surface },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 48 },
  contentWithButton: { paddingBottom: 118 },
  heroTitle: {
    color: '#1A1D20',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
    lineHeight: 26,
  },
  divider: { height: 1, marginTop: 20, backgroundColor: '#ECEFF3' },
  reservationList: { gap: 8, paddingTop: 18 },
  myReservation: {
    minWidth: 174,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#C9D2FF',
    borderRadius: 10,
    backgroundColor: '#F2F6FF',
  },
  myReservationLabel: {
    color: '#3550FF',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 11,
  },
  myReservationTime: {
    marginTop: 4,
    color: '#1A1D20',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 13,
  },
  section: { marginTop: 20 },
  sectionTitle: {
    color: '#1A1D20',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
  },
  dateRow: { gap: 8, paddingTop: 14, paddingRight: 4 },
  dateCard: {
    width: 77,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  selectedCard: { borderColor: '#3550FF', backgroundColor: '#F2F6FF' },
  dateDay: {
    color: '#868E96',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 15,
  },
  dateWeekday: {
    maxWidth: 69,
    marginTop: 6,
    color: '#ADB5BD',
    fontFamily: 'FreesentationRegular',
    fontSize: 11,
  },
  selectedText: { color: '#3550FF' },
  slotGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  slotCard: {
    width: '31.4%',
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  occupiedCard: { backgroundColor: '#F8F9FA' },
  mySlotCard: { borderColor: '#3550FF', backgroundColor: '#F2F6FF' },
  slotTime: {
    color: '#1A1D20',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  slotCaption: {
    maxWidth: '92%',
    marginTop: 4,
    color: '#ADB5BD',
    fontFamily: 'FreesentationRegular',
    fontSize: 10,
  },
  occupiedText: { color: '#ADB5BD' },
  bottomBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    backgroundColor: COLORS.surface,
  },
  nextButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#3550FF',
  },
  nextButtonDisabled: { backgroundColor: '#23348F' },
  nextText: {
    color: COLORS.white,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 16,
  },
  stateCard: {
    minHeight: 280,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
  },
  stateIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#EEF1FF',
  },
  stateIconText: {
    color: '#3550FF',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 21,
  },
  stateTitle: {
    marginTop: 14,
    color: '#1A1D20',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 17,
    textAlign: 'center',
  },
  stateDescription: {
    marginTop: 8,
    color: '#667085',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    height: 44,
    marginTop: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#3550FF',
  },
  retryText: {
    color: COLORS.white,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  confirmationModal: {
    width: 282,
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  confirmationContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 50,
    backgroundColor: '#F6F6F6',
  },
  datePillText: {
    color: '#808080',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
  },
  datePillTime: { color: '#111111', fontFamily: 'FreesentationSemiBold' },
  confirmationQuestion: {
    marginTop: 10,
    color: '#111111',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
    textAlign: 'center',
  },
  confirmationActions: { height: 42, flexDirection: 'row' },
  noButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAEAEA',
  },
  noButtonText: {
    color: '#666666',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
  },
  yesButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3550FF',
  },
  yesButtonText: {
    color: COLORS.white,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  completionModal: {
    width: '100%',
    maxWidth: 330,
    padding: 16,
    paddingTop: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  completionText: {
    color: '#111111',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  completionButton: {
    height: 44,
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#3550FF',
  },
  completionButtonText: {
    color: COLORS.white,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 14,
  },
  pressed: { opacity: 0.7 },
});
