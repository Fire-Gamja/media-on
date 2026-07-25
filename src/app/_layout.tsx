import { Stack } from 'expo-router';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { PushNotificationManager } from '../components/PushNotificationManager';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PushNotificationManager />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </SafeAreaProvider>
  );
}
