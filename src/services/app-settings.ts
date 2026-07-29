import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../lib/supabase';

export type AppSettings = {
  generalNotificationsEnabled: boolean;
};

const STORAGE_KEY = '@media-on/app-settings';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  generalNotificationsEnabled: true,
};

export async function getStoredAppSettings(): Promise<AppSettings> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return DEFAULT_APP_SETTINGS;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<AppSettings>;
    return {
      generalNotificationsEnabled:
        parsed.generalNotificationsEnabled !== false,
    };
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return DEFAULT_APP_SETTINGS;
  }
}

export async function getMyAppSettings(): Promise<AppSettings> {
  const localSettings = await getStoredAppSettings();

  if (!supabase) {
    return localSettings;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return localSettings;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('general_notifications_enabled')
    .eq('id', user.id)
    .single<{
      general_notifications_enabled: boolean;
    }>();

  if (error || !data) {
    return localSettings;
  }

  const settings = {
    generalNotificationsEnabled: data.general_notifications_enabled,
  } satisfies AppSettings;

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  return settings;
}

export async function updateMyAppSettings(settings: AppSettings) {
  if (supabase) {
    const { error } = await supabase.rpc('update_my_app_settings', {
      next_general_notifications_enabled:
        settings.generalNotificationsEnabled,
      next_color_mode: 'light',
    });

    if (error) {
      throw new Error('앱 설정을 저장하지 못했습니다.');
    }
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
