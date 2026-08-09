import AsyncStorage from '@react-native-async-storage/async-storage';

export type TimetableWeekday = 1 | 2 | 3 | 4 | 5;

export type TimetableCourse = {
  id: string;
  name: string;
  professor: string;
  room: string;
  weekday: TimetableWeekday;
  startPeriod: number;
  endPeriod: number;
  credits: number;
};

export type TimetableCourseInput = Omit<TimetableCourse, 'id'>;

const STORAGE_KEY = '@media-on/student-timetable-v1';

export async function getStudentTimetable(): Promise<TimetableCourse[]> {
  const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
  if (!storedValue) return [];

  try {
    const parsed = JSON.parse(storedValue) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTimetableCourse).sort(compareCourses);
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export async function replaceStudentTimetable(courses: TimetableCourse[]) {
  const normalized = courses.filter(isTimetableCourse).sort(compareCourses);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function createTimetableCourse(input: TimetableCourseInput) {
  return {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  } satisfies TimetableCourse;
}

export function getPeriodStartTime(period: number) {
  return `${String(8 + period).padStart(2, '0')}:00`;
}

export function getPeriodEndTime(period: number) {
  return `${String(9 + period).padStart(2, '0')}:00`;
}

function compareCourses(left: TimetableCourse, right: TimetableCourse) {
  return left.weekday - right.weekday || left.startPeriod - right.startPeriod;
}

function isTimetableCourse(value: unknown): value is TimetableCourse {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<TimetableCourse>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.professor === 'string' &&
    typeof item.room === 'string' &&
    Number.isInteger(item.weekday) &&
    Number(item.weekday) >= 1 &&
    Number(item.weekday) <= 5 &&
    Number.isInteger(item.startPeriod) &&
    Number(item.startPeriod) >= 1 &&
    Number(item.startPeriod) <= 8 &&
    Number.isInteger(item.endPeriod) &&
    Number(item.endPeriod) >= Number(item.startPeriod) &&
    Number(item.endPeriod) <= 8 &&
    [1, 2, 3].includes(Number(item.credits))
  );
}
