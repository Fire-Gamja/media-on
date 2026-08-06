import { Stack } from 'expo-router';

import { StudentAccessGate } from '../../components/student/StudentAccessGate';
import { NoticeSettingsProvider } from '../../context/notice-settings-context';

export default function StudentLayout() {
  return (
    <StudentAccessGate>
      <NoticeSettingsProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </NoticeSettingsProvider>
    </StudentAccessGate>
  );
}
