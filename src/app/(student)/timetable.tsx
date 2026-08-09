import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StudentBottomNavigation } from '../../components/student/StudentBottomNavigation';
import { StudentTopBar } from '../../components/student/StudentTopBar';
import { useAppSettings } from '../../context/app-settings-context';
import { translate } from '../../i18n/translations';
import {
  getPeriodEndTime,
  getPeriodStartTime,
  getStudentTimetable,
  type TimetableCourse,
} from '../../services/student-timetable';

const WEEKDAYS = ['월', '화', '수', '목', '금'] as const;
const COURSE_COLORS = ['#E8EDFF', '#FFF1D9', '#E4F7EA', '#F6E8FF', '#FFE9ED'];
const CELL_WIDTH = 64;
const PERIOD_HEIGHT = 58;
const TIME_WIDTH = 48;
const HEADER_HEIGHT = 42;

export default function TimetableScreen() {
  const { language } = useAppSettings();
  const [courses, setCourses] = useState<TimetableCourse[]>([]);

  useFocusEffect(
    useCallback(() => {
      void getStudentTimetable().then(setCourses);
    }, []),
  );

  const credits = useMemo(
    () => courses.reduce((sum, course) => sum + course.credits, 0),
    [courses],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <StudentTopBar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>{translate(language, 'timetable.title')}</Text>
            <Text style={styles.semester}>{translate(language, 'timetable.semester')}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/timetable-edit')}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
          >
            <Text style={styles.editButtonText}>{translate(language, 'timetable.edit')}</Text>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{translate(language, 'timetable.registered')}</Text>
          <Text style={styles.summaryValue}>{courses.length}</Text>
          <View style={styles.summaryDivider} />
          <Text style={styles.summaryLabel}>{translate(language, 'timetable.credits')}</Text>
          <Text style={styles.summaryValue}>{credits}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gridScroll}>
          <View style={styles.grid}>
            <View style={styles.gridHeader}>
              <View style={styles.timeHeader} />
              {WEEKDAYS.map((day) => <Text key={day} style={styles.dayHeader}>{day}</Text>)}
            </View>
            {Array.from({ length: 8 }, (_, index) => {
              const period = index + 1;
              return (
                <View key={period} style={styles.periodRow}>
                  <View style={styles.timeCell}>
                    <Text style={styles.periodNumber}>{period}</Text>
                    <Text style={styles.periodTime}>{getPeriodStartTime(period)}</Text>
                  </View>
                  {WEEKDAYS.map((day) => <View key={day} style={styles.emptyCell} />)}
                </View>
              );
            })}
            {courses.map((course, index) => (
              <View
                key={course.id}
                style={[
                  styles.courseBlock,
                  {
                    left: TIME_WIDTH + (course.weekday - 1) * CELL_WIDTH + 2,
                    top: HEADER_HEIGHT + (course.startPeriod - 1) * PERIOD_HEIGHT + 2,
                    height: (course.endPeriod - course.startPeriod + 1) * PERIOD_HEIGHT - 4,
                    backgroundColor: COURSE_COLORS[index % COURSE_COLORS.length],
                  },
                ]}
              >
                <Text numberOfLines={2} style={styles.courseName}>{course.name}</Text>
                <Text numberOfLines={1} style={styles.courseMeta}>{course.room}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {courses.length === 0 ? (
          <Pressable onPress={() => router.push('/timetable-edit')} style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{translate(language, 'timetable.empty')}</Text>
            <Text style={styles.emptyDescription}>{translate(language, 'timetable.emptyDescription')}</Text>
          </Pressable>
        ) : (
          <View style={styles.courseList}>
            {courses.map((course, index) => (
              <View key={course.id} style={styles.courseListRow}>
                <View style={[styles.courseDot, { backgroundColor: COURSE_COLORS[index % COURSE_COLORS.length] }]} />
                <View style={styles.courseListText}>
                  <Text style={styles.courseListTitle}>{course.name}</Text>
                  <Text style={styles.courseListMeta}>
                    {WEEKDAYS[course.weekday - 1]} · {getPeriodStartTime(course.startPeriod)}~{getPeriodEndTime(course.endPeriod)} · {course.room}
                  </Text>
                </View>
                <Text style={styles.courseCredits}>{course.credits}{translate(language, 'timetable.creditUnit')}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <StudentBottomNavigation activeTab="timetable" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FEFEFF' },
  content: { padding: 16, paddingBottom: 36 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#1E2024', fontFamily: 'FreesentationExtraBold', fontSize: 22 },
  semester: { marginTop: 4, color: '#8C929D', fontFamily: 'FreesentationRegular', fontSize: 12 },
  editButton: { minWidth: 72, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#3550FF' },
  editButtonText: { color: '#FFFFFF', fontFamily: 'FreesentationExtraBold', fontSize: 13 },
  summaryCard: { minHeight: 62, marginTop: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: '#F3F5FF' },
  summaryLabel: { color: '#737986', fontFamily: 'FreesentationRegular', fontSize: 12 },
  summaryValue: { marginLeft: 7, color: '#3550FF', fontFamily: 'FreesentationExtraBold', fontSize: 20 },
  summaryDivider: { width: 1, height: 24, marginHorizontal: 18, backgroundColor: '#DCE1F4' },
  gridScroll: { marginTop: 20, borderWidth: 1, borderColor: '#E6E8ED', borderRadius: 16 },
  grid: { width: TIME_WIDTH + CELL_WIDTH * 5, height: HEADER_HEIGHT + PERIOD_HEIGHT * 8, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  gridHeader: { height: HEADER_HEIGHT, flexDirection: 'row', backgroundColor: '#F7F8FA' },
  timeHeader: { width: TIME_WIDTH, borderRightWidth: 1, borderColor: '#E6E8ED' },
  dayHeader: { width: CELL_WIDTH, textAlign: 'center', textAlignVertical: 'center', color: '#535965', fontFamily: 'FreesentationSemiBold', fontSize: 12 },
  periodRow: { height: PERIOD_HEIGHT, flexDirection: 'row' },
  timeCell: { width: TIME_WIDTH, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderRightWidth: 1, borderColor: '#E6E8ED' },
  periodNumber: { color: '#414753', fontFamily: 'FreesentationExtraBold', fontSize: 11 },
  periodTime: { marginTop: 2, color: '#A0A5AE', fontFamily: 'FreesentationRegular', fontSize: 8 },
  emptyCell: { width: CELL_WIDTH, borderTopWidth: 1, borderRightWidth: 1, borderColor: '#E6E8ED' },
  courseBlock: { position: 'absolute', width: CELL_WIDTH - 4, padding: 5, borderRadius: 7, overflow: 'hidden' },
  courseName: { color: '#29304A', fontFamily: 'FreesentationExtraBold', fontSize: 10, lineHeight: 13 },
  courseMeta: { marginTop: 4, color: '#666D7E', fontFamily: 'FreesentationRegular', fontSize: 8 },
  emptyCard: { marginTop: 18, padding: 22, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#B9C3F2', borderRadius: 16, backgroundColor: '#F9FAFF' },
  emptyTitle: { color: '#3550FF', fontFamily: 'FreesentationExtraBold', fontSize: 15 },
  emptyDescription: { marginTop: 5, color: '#848A96', fontFamily: 'FreesentationRegular', fontSize: 12 },
  courseList: { marginTop: 18, gap: 10 },
  courseListRow: { minHeight: 68, padding: 13, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E8E9ED', borderRadius: 14, backgroundColor: '#FFFFFF' },
  courseDot: { width: 10, height: 40, borderRadius: 5 },
  courseListText: { flex: 1, marginLeft: 12 },
  courseListTitle: { color: '#222630', fontFamily: 'FreesentationExtraBold', fontSize: 14 },
  courseListMeta: { marginTop: 5, color: '#888E99', fontFamily: 'FreesentationRegular', fontSize: 11 },
  courseCredits: { color: '#3550FF', fontFamily: 'FreesentationExtraBold', fontSize: 12 },
  pressed: { opacity: 0.65 },
});
