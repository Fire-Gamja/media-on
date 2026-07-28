import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MonthCalendar, {
  fromDateKey,
  toDateKey,
} from '../../components/student/MonthCalendar';
import { maskProfanityInput } from '../../lib/content-filter';
import { createStudentSchedule } from '../../services/student-schedule';

const backIcon = require('../../../assets/figma/student/back.png');
const homeIcon = require('../../../assets/figma/student/home.png');

type DateField = 'start' | 'end';

export default function StudentScheduleScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const initialDate = isDateKey(params.date) ? params.date : toDateKey(new Date());
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);
  const [allDay, setAllDay] = useState(true);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(fromDateKey(initialDate).getFullYear(), fromDateKey(initialDate).getMonth(), 1),
  );
  const [dateField, setDateField] = useState<DateField | null>(null);
  const [draftDate, setDraftDate] = useState(initialDate);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canSubmit = title.trim().length > 0 && !isSaving;
  const selectedDate = dateField === 'end' ? endDate : startDate;

  const selectedDateLabel = useMemo(
    () => formatKoreanDate(draftDate),
    [draftDate],
  );

  const openDatePicker = (field: DateField) => {
    const current = field === 'start' ? startDate : endDate;
    const date = fromDateKey(current);
    setDateField(field);
    setDraftDate(current);
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const applyDate = () => {
    if (dateField === 'start') {
      setStartDate(draftDate);
      if (draftDate > endDate) {
        setEndDate(draftDate);
      }
    }

    if (dateField === 'end') {
      setEndDate(draftDate < startDate ? startDate : draftDate);
    }

    setDateField(null);
  };

  const handleSave = async () => {
    if (!canSubmit) {
      return;
    }

    try {
      setIsSaving(true);
      await createStudentSchedule({
        title: title.trim(),
        startDate,
        endDate: allDay ? startDate : endDate,
        allDay,
        memo: memo.trim(),
      });
      setShowConfirm(false);
      setShowComplete(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
            hitSlop={8}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.headerIconButton,
              pressed && styles.pressed,
            ]}
          >
            <Image source={backIcon} style={styles.headerIcon} />
          </Pressable>

          <Text style={styles.headerTitle}>일정등록</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="홈으로 이동"
            hitSlop={8}
            onPress={() => router.replace('/home')}
            style={({ pressed }) => [
              styles.headerIconButton,
              pressed && styles.pressed,
            ]}
          >
            <Image source={homeIcon} style={styles.headerIcon} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            accessibilityLabel="일정 제목"
            maxLength={40}
            onChangeText={(value) => setTitle(maskProfanityInput(value))}
            placeholder="일정을 입력하세요."
            placeholderTextColor="#9A9A9A"
            style={styles.titleInput}
            value={title}
          />

          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>일정</Text>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: allDay }}
              onPress={() => setAllDay((current) => !current)}
              style={({ pressed }) => [
                styles.allDayButton,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.toggleDot,
                  allDay ? styles.toggleDotActive : styles.toggleDotInactive,
                ]}
              />
              <Text style={styles.allDayText}>하루종일</Text>
            </Pressable>
          </View>

          <View style={styles.dateFields}>
            <Pressable
              accessibilityRole="button"
              onPress={() => openDatePicker('start')}
              style={({ pressed }) => [
                styles.dateField,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.dateText}>
                {formatDateTime(startDate, '00:00')}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={allDay}
              onPress={() => openDatePicker('end')}
              style={({ pressed }) => [
                styles.dateField,
                allDay && styles.dateFieldDisabled,
                pressed && !allDay && styles.pressed,
              ]}
            >
              <Text style={styles.dateText}>
                {formatDateTime(allDay ? startDate : endDate, '23:59')}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.sectionTitle, styles.memoTitle]}>메모</Text>
          <TextInput
            accessibilityLabel="일정 메모"
            multiline
            onChangeText={(value) => setMemo(maskProfanityInput(value))}
            placeholder="내용을 입력해주세요."
            placeholderTextColor="#9A9A9A"
            style={styles.memoInput}
            textAlignVertical="top"
            value={memo}
          />

          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            onPress={() => setShowConfirm(true)}
            style={({ pressed }) => [
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
              pressed && canSubmit && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.submitText,
                !canSubmit && styles.submitTextDisabled,
              ]}
            >
              등록
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        onRequestClose={() => setDateField(null)}
        transparent
        visible={dateField !== null}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel="날짜 선택 닫기"
            onPress={() => setDateField(null)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.calendarSheet}>
            <View style={styles.sheetHandle} />
            <MonthCalendar
              month={visibleMonth}
              onChangeMonth={setVisibleMonth}
              onSelectDate={setDraftDate}
              selectedDate={draftDate}
              showMonthControls
            />
            <View style={styles.calendarActions}>
              <Pressable
                onPress={() => setDateField(null)}
                style={({ pressed }) => [
                  styles.calendarCancel,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.calendarCancelText}>취소</Text>
              </Pressable>
              <Pressable
                onPress={applyDate}
                style={({ pressed }) => [
                  styles.calendarConfirm,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.calendarConfirmText}>
                  {selectedDateLabel} 선택
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
        transparent
        visible={showConfirm}
      >
        <View style={styles.centeredBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmMessage}>일정을 등록하시겠어요?</Text>
            <View style={styles.confirmActions}>
              <Pressable
                disabled={isSaving}
                onPress={() => setShowConfirm(false)}
                style={({ pressed }) => [
                  styles.noButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.noButtonText}>아니요</Text>
              </Pressable>
              <Pressable
                disabled={isSaving}
                onPress={() => void handleSave()}
                style={({ pressed }) => [
                  styles.yesButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.yesButtonText}>예</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={showComplete}>
        <View style={styles.centeredBackdrop}>
          <View style={styles.completeCard}>
            <Text style={styles.confirmMessage}>일정이 등록되었습니다.</Text>
            <Pressable
              onPress={() => {
                setShowComplete(false);
                router.replace('/home');
              }}
              style={({ pressed }) => [
                styles.completeButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.yesButtonText}>확인</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function isDateKey(value?: string): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatDateTime(dateKey: string, time: string) {
  return `${dateKey.replaceAll('-', '.')} - ${time}`;
}

function formatKoreanDate(dateKey: string) {
  return `${dateKey.replaceAll('-', '.')} /`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  header: {
    height: 56,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  headerIconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  headerTitle: {
    flex: 1,
    color: '#2D2D2D',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 36,
  },
  titleInput: {
    height: 51,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    borderRadius: 15,
    color: '#2D2D2D',
    fontFamily: 'FreesentationRegular',
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  sectionTitleRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 20,
  },
  allDayButton: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  toggleDotActive: {
    backgroundColor: '#182365',
  },
  toggleDotInactive: {
    backgroundColor: '#B8B8B8',
  },
  allDayText: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 16,
  },
  dateFields: {
    marginTop: 12,
    gap: 8,
  },
  dateField: {
    height: 51,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F2F2F2',
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
  },
  dateFieldDisabled: {
    backgroundColor: '#EAEAEA',
  },
  dateText: {
    color: '#898989',
    fontFamily: 'FreesentationRegular',
    fontSize: 16,
  },
  memoTitle: {
    marginTop: 24,
  },
  memoInput: {
    height: 150,
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    borderRadius: 15,
    color: '#2D2D2D',
    fontFamily: 'FreesentationRegular',
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    height: 60,
    marginTop: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#182365',
  },
  submitButtonDisabled: {
    backgroundColor: '#EAEAEA',
  },
  submitText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 16,
  },
  submitTextDisabled: {
    color: '#9A9A9A',
  },
  pressed: {
    opacity: 0.68,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  calendarSheet: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    backgroundColor: '#FFFFFF',
  },
  sheetHandle: {
    width: 30,
    height: 4,
    marginBottom: 14,
    alignSelf: 'center',
    borderRadius: 2,
    backgroundColor: '#6D6D6D',
  },
  calendarActions: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 16,
  },
  calendarCancel: {
    width: 100,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#EAEAEA',
  },
  calendarCancelText: {
    color: '#9A9A9A',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 16,
  },
  calendarConfirm: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#182365',
  },
  calendarConfirmText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 16,
  },
  centeredBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  confirmCard: {
    width: '100%',
    maxWidth: 343,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  confirmMessage: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationRegular',
    fontSize: 16,
    textAlign: 'center',
  },
  confirmActions: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 8,
  },
  noButton: {
    width: 100,
    height: 51,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#EAEAEA',
  },
  noButtonText: {
    color: '#6F6F6F',
    fontFamily: 'FreesentationRegular',
    fontSize: 16,
  },
  yesButton: {
    flex: 1,
    height: 51,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#182365',
  },
  yesButtonText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 16,
  },
  completeCard: {
    width: '100%',
    maxWidth: 343,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  completeButton: {
    height: 50,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#182365',
  },
});
