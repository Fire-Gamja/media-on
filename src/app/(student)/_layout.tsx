import { Stack } from 'expo-router';

import { LegalAgreementGate } from '../../components/legal/LegalAgreementGate';
import { StudentAccessGate } from '../../components/student/StudentAccessGate';
import { NoticeSettingsProvider } from '../../context/notice-settings-context';

export default function StudentLayout() {
  return (
    <StudentAccessGate>
      <LegalAgreementGate>
        <NoticeSettingsProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen
              name="home"
              options={{ animation: 'none', gestureEnabled: false }}
            />
            <Stack.Screen
              name="notices/index"
              options={{ animation: 'none', gestureEnabled: false }}
            />
            <Stack.Screen
              name="applications"
              options={{ animation: 'none', gestureEnabled: false }}
            />
            <Stack.Screen
              name="timetable"
              options={{ animation: 'none', gestureEnabled: false }}
            />
          </Stack>
        </NoticeSettingsProvider>
      </LegalAgreementGate>
    </StudentAccessGate>
  );
}
