import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
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

import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import { TimeSelectField } from '../../components/common/TimeSelectField';
import { useAppSettings } from '../../context/app-settings-context';
import { translate } from '../../i18n/translations';
import {
  createTimetableCourse,
  getPeriodStartTime,
  getStudentTimetable,
  replaceStudentTimetable,
  type TimetableCourse,
  type TimetableWeekday,
} from '../../services/student-timetable';

const WEEKDAYS: ReadonlyArray<{ value: TimetableWeekday; label: string }> = [
  { value: 1, label: '월' }, { value: 2, label: '화' }, { value: 3, label: '수' },
  { value: 4, label: '목' }, { value: 5, label: '금' },
];
const periodLabel = (period: number) => `${period}교시 (${getPeriodStartTime(period)})`;
const ALL_PERIODS = Array.from({ length: 8 }, (_, index) => periodLabel(index + 1));

export default function TimetableEditScreen() {
  const { language } = useAppSettings();
  const [courses, setCourses] = useState<TimetableCourse[]>([]);
  const [name, setName] = useState('');
  const [professor, setProfessor] = useState('');
  const [room, setRoom] = useState('');
  const [weekday, setWeekday] = useState<TimetableWeekday>(1);
  const [startPeriod, setStartPeriod] = useState(1);
  const [endPeriod, setEndPeriod] = useState(1);
  const [credits, setCredits] = useState(3);
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void getStudentTimetable().then(setCourses);
    }, []),
  );

  const endOptions = useMemo(
    () => ALL_PERIODS.slice(startPeriod - 1),
    [startPeriod],
  );

  const addCourse = () => {
    if (!name.trim() || !room.trim()) {
      Alert.alert(translate(language, 'common.checkInput'), translate(language, 'timetable.required'));
      return;
    }
    setCourses((current) => [
      ...current,
      createTimetableCourse({
        name: name.trim(),
        professor: professor.trim(),
        room: room.trim(),
        weekday,
        startPeriod,
        endPeriod,
        credits,
      }),
    ]);
    setName('');
    setProfessor('');
    setRoom('');
    setStartPeriod(1);
    setEndPeriod(1);
  };

  const save = async () => {
    try {
      setIsSaving(true);
      await replaceStudentTimetable(courses);
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <Pressable accessibilityLabel={translate(language, 'common.back')} hitSlop={8} onPress={() => router.back()} style={styles.headerSide}>
            <PlatformHeaderIcon name="back" />
          </Pressable>
          <Text style={styles.headerTitle}>{translate(language, 'timetable.editTitle')}</Text>
          <Pressable disabled={isSaving} onPress={() => void save()} style={styles.headerSide}>
            <Text style={styles.saveText}>{translate(language, 'common.save')}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>{translate(language, 'timetable.courses')}</Text>
          {courses.length === 0 ? (
            <Text style={styles.noCourses}>{translate(language, 'timetable.noCourses')}</Text>
          ) : (
            <View style={styles.courseList}>
              {courses.map((course) => (
                <View key={course.id} style={styles.courseCard}>
                  <View style={styles.courseCardText}>
                    <Text style={styles.courseName}>{course.name}</Text>
                    <Text style={styles.courseMeta}>{WEEKDAYS[course.weekday - 1].label} · {course.startPeriod}~{course.endPeriod}교시 · {course.room}</Text>
                  </View>
                  <Pressable accessibilityLabel={`${course.name} 삭제`} hitSlop={8} onPress={() => setCourses((current) => current.filter((item) => item.id !== course.id))} style={styles.deleteButton}>
                    <Text style={styles.deleteText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>{translate(language, 'timetable.addCourse')}</Text>
          <Field label={translate(language, 'timetable.courseName')} onChangeText={setName} placeholder={translate(language, 'timetable.courseNamePlaceholder')} value={name} />
          <View style={styles.twoColumns}>
            <Field compact label={translate(language, 'timetable.professor')} onChangeText={setProfessor} placeholder="김교수" value={professor} />
            <Field compact label={translate(language, 'timetable.room')} onChangeText={setRoom} placeholder="BA-101" value={room} />
          </View>

          <Text style={[styles.fieldLabel, styles.standaloneFieldLabel]}>{translate(language, 'timetable.weekday')}</Text>
          <View style={styles.segmentRow}>
            {WEEKDAYS.map((item) => (
              <Pressable key={item.value} onPress={() => setWeekday(item.value)} style={[styles.segment, weekday === item.value && styles.segmentSelected]}>
                <Text style={[styles.segmentText, weekday === item.value && styles.segmentTextSelected]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.timeFields}>
            <TimeSelectField
              label={translate(language, 'timetable.startPeriod')}
              onChange={(value) => {
                const next = ALL_PERIODS.indexOf(value) + 1;
                setStartPeriod(next);
                if (endPeriod < next) setEndPeriod(next);
              }}
              options={ALL_PERIODS}
              value={periodLabel(startPeriod)}
            />
            <TimeSelectField
              label={translate(language, 'timetable.endPeriod')}
              onChange={(value) => setEndPeriod(ALL_PERIODS.indexOf(value) + 1)}
              options={endOptions}
              value={periodLabel(endPeriod)}
            />
          </View>

          <Text style={[styles.fieldLabel, styles.standaloneFieldLabel]}>{translate(language, 'timetable.credits')}</Text>
          <View style={styles.creditRow}>
            {[1, 2, 3].map((credit) => (
              <Pressable key={credit} onPress={() => setCredits(credit)} style={[styles.creditButton, credits === credit && styles.creditSelected]}>
                <Text style={[styles.creditText, credits === credit && styles.creditTextSelected]}>{credit}{translate(language, 'timetable.creditUnit')}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={addCourse} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Text style={styles.addButtonText}>+ {translate(language, 'timetable.add')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ compact, label, ...props }: { compact?: boolean; label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={[styles.field, compact && styles.compactField]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput {...props} placeholderTextColor="#A4A9B3" style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  header: { height: 58, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#ECEEF2' },
  headerSide: { width: 54, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#1E2024', fontFamily: 'FreesentationExtraBold', fontSize: 19 },
  saveText: { color: '#3550FF', fontFamily: 'FreesentationExtraBold', fontSize: 14 },
  content: { padding: 16, paddingBottom: 48 },
  sectionTitle: { color: '#1E2024', fontFamily: 'FreesentationExtraBold', fontSize: 18 },
  noCourses: { marginTop: 12, padding: 18, color: '#8A909B', fontFamily: 'FreesentationRegular', fontSize: 13, textAlign: 'center', borderRadius: 14, backgroundColor: '#F7F8FA' },
  courseList: { marginTop: 12, gap: 9 },
  courseCard: { minHeight: 64, padding: 13, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E7E9EE', borderRadius: 14 },
  courseCardText: { flex: 1 },
  courseName: { color: '#242832', fontFamily: 'FreesentationExtraBold', fontSize: 14 },
  courseMeta: { marginTop: 5, color: '#888E99', fontFamily: 'FreesentationRegular', fontSize: 11 },
  deleteButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: '#E04B5A', fontSize: 26, lineHeight: 28 },
  divider: { height: 8, marginHorizontal: -16, marginVertical: 26, backgroundColor: '#F4F5F7' },
  field: { marginTop: 18 },
  compactField: { flex: 1 },
  fieldLabel: { marginBottom: 8, color: '#343943', fontFamily: 'FreesentationSemiBold', fontSize: 14 },
  standaloneFieldLabel: { marginTop: 8 },
  input: { height: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: '#DDE0E6', borderRadius: 13, color: '#222630', fontFamily: 'FreesentationRegular', fontSize: 15, backgroundColor: '#FFFFFF' },
  twoColumns: { flexDirection: 'row', gap: 10 },
  segmentRow: { marginBottom: 20, flexDirection: 'row', gap: 7 },
  segment: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DDE0E6', borderRadius: 11 },
  segmentSelected: { borderColor: '#3550FF', backgroundColor: '#3550FF' },
  segmentText: { color: '#5B616D', fontFamily: 'FreesentationSemiBold', fontSize: 14 },
  segmentTextSelected: { color: '#FFFFFF' },
  timeFields: { flexDirection: 'row', gap: 10 },
  creditRow: { flexDirection: 'row', gap: 9 },
  creditButton: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DDE0E6', borderRadius: 12 },
  creditSelected: { borderColor: '#3550FF', backgroundColor: '#EEF2FF' },
  creditText: { color: '#69707C', fontFamily: 'FreesentationSemiBold', fontSize: 14 },
  creditTextSelected: { color: '#3550FF' },
  addButton: { height: 54, marginTop: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 27, backgroundColor: '#3550FF' },
  addButtonText: { color: '#FFFFFF', fontFamily: 'FreesentationExtraBold', fontSize: 15 },
  pressed: { opacity: 0.65 },
});
