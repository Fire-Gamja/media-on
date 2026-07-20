import { Stack } from 'expo-router';

import { NoticeSettingsProvider } from '../../context/notice-settings-context';

export default function StudentLayout() {
  return (
    <NoticeSettingsProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </NoticeSettingsProvider>
  );
}
