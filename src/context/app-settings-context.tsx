import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance } from 'react-native';

import {
  type AppSettings,
  DEFAULT_APP_SETTINGS,
  getMyAppSettings,
  updateMyAppSettings,
} from '../services/app-settings';

type AppSettingsContextValue = AppSettings & {
  isLoaded: boolean;
  setGeneralNotificationsEnabled: (enabled: boolean) => Promise<void>;
  refreshSettings: () => Promise<void>;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] =
    useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshSettings = useCallback(async () => {
    try {
      setSettings(await getMyAppSettings());
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    Appearance.setColorScheme('light');
  }, []);

  const saveSettings = useCallback(async (next: AppSettings) => {
    const previous = settings;
    setSettings(next);

    try {
      await updateMyAppSettings(next);
    } catch (error) {
      setSettings(previous);
      throw error;
    }
  }, [settings]);

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      ...settings,
      isLoaded,
      refreshSettings,
      setGeneralNotificationsEnabled: (generalNotificationsEnabled) =>
        saveSettings({ ...settings, generalNotificationsEnabled }),
    }),
    [isLoaded, refreshSettings, saveSettings, settings],
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider.');
  }

  return context;
}
