import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PushNotificationManager } from '../components/PushNotificationManager';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    FreesentationRegular: require('../../assets/fonts/Freesentation-4Regular.ttf'),
    FreesentationSemiBold: require('../../assets/fonts/Freesentation-6SemiBold.ttf'),
    FreesentationExtraBold: require('../../assets/fonts/Freesentation-8ExtraBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

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
