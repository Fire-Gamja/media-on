import AsyncStorage from '@react-native-async-storage/async-storage';

export type StudentSchedule = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  memo: string;
  createdAt: string;
};

export type StudentScheduleInput = Omit<
  StudentSchedule,
  'id' | 'createdAt'
>;

const STORAGE_KEY = '@media-on/student-schedules';

export async function getStudentSchedules(): Promise<StudentSchedule[]> {
  const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const schedules = JSON.parse(storedValue) as Array<
      StudentSchedule & { startTime?: string; endTime?: string }
    >;
    return schedules
      .map((schedule) => ({
        ...schedule,
        startTime: schedule.startTime ?? '00:00',
        endTime: schedule.endTime ?? '23:59',
      }))
      .sort((left, right) =>
        `${left.startDate}-${left.startTime}`.localeCompare(
          `${right.startDate}-${right.startTime}`,
        ),
      );
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export async function createStudentSchedule(
  input: StudentScheduleInput,
): Promise<StudentSchedule> {
  const schedules = await getStudentSchedules();
  const nextSchedule: StudentSchedule = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...schedules, nextSchedule]),
  );

  return nextSchedule;
}
