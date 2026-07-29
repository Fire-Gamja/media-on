import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { PushNotificationManager } from '../components/PushNotificationManager';
import { AppSettingsProvider } from '../context/app-settings-context';

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <AppSettingsProvider>
            <PushNotificationManager />
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
          </AppSettingsProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
