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
          />
        </NoticeSettingsProvider>
      </LegalAgreementGate>
    </StudentAccessGate>
  );
}
