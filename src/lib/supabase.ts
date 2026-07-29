import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const AUTO_LOGIN_STORAGE_KEY = '@media-on/auto-login';
const volatileAuthStorage = new Map<string, string>();
const isServerRendering =
  Platform.OS === 'web' && typeof window === 'undefined';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        storage: {
          async getItem(key) {
            if (volatileAuthStorage.has(key)) {
              return volatileAuthStorage.get(key) ?? null;
            }

            if (isServerRendering) {
              return null;
            }

            return (await getAutoLoginEnabled())
              ? AsyncStorage.getItem(key)
              : null;
          },
          async setItem(key, value) {
            volatileAuthStorage.set(key, value);

            if (isServerRendering) {
              return;
            }

            if (await getAutoLoginEnabled()) {
              await AsyncStorage.setItem(key, value);
            } else {
              await AsyncStorage.removeItem(key);
            }
          },
          async removeItem(key) {
            volatileAuthStorage.delete(key);

            if (isServerRendering) {
              return;
            }

            await AsyncStorage.removeItem(key);
          },
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    })
  : null;

if (Platform.OS !== 'web' && supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

export async function getAutoLoginEnabled() {
  return (await AsyncStorage.getItem(AUTO_LOGIN_STORAGE_KEY)) === 'true';
}

export async function setAutoLoginEnabled(enabled: boolean) {
  await AsyncStorage.setItem(AUTO_LOGIN_STORAGE_KEY, String(enabled));

  if (!enabled) {
    const authKeys = (await AsyncStorage.getAllKeys()).filter(
      (key) => key.startsWith('sb-') && key.endsWith('-auth-token'),
    );

    if (authKeys.length > 0) {
      await AsyncStorage.multiRemove(authKeys);
    }
  }
}
