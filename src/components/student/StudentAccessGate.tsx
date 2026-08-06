import { StatusBar } from 'expo-status-bar';
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '../common/AppIcon';
import {
  getNotificationPermissionGranted,
  registerCurrentDeviceForPush,
  requestRequiredNotificationPermission,
} from '../../services/push-notifications';

type AccessStatus = 'checking' | 'allowed' | 'blocked';

const NETWORK_RECHECK_INTERVAL_MS = 10_000;
const NETWORK_CHECK_TIMEOUT_MS = 6_000;
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const CONNECTIVITY_CHECK_URL = supabaseUrl
  ? `${supabaseUrl.replace(/\/+$/, '')}/auth/v1/health`
  : 'https://clients3.google.com/generate_204';

export function StudentAccessGate({ children }: PropsWithChildren) {
  const [networkStatus, setNetworkStatus] =
    useState<AccessStatus>('checking');
  const [notificationStatus, setNotificationStatus] =
    useState<AccessStatus>(
      Platform.OS === 'web' ? 'allowed' : 'checking',
    );

  const checkNetwork = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setNetworkStatus('checking');
    }

    const hasInternet = await hasInternetConnection();
    setNetworkStatus(hasInternet ? 'allowed' : 'blocked');
  }, []);

  const checkNotificationPermission = useCallback(async () => {
    if (Platform.OS === 'web') {
      setNotificationStatus('allowed');
      return;
    }

    setNotificationStatus('checking');
    try {
      const granted = await getNotificationPermissionGranted();
      setNotificationStatus(granted ? 'allowed' : 'blocked');
      if (granted) {
        void registerCurrentDeviceForPush().catch(() => undefined);
      }
    } catch {
      setNotificationStatus('blocked');
    }
  }, []);

  useEffect(() => {
    void checkNetwork();
    const interval = setInterval(
      () => void checkNetwork(),
      NETWORK_RECHECK_INTERVAL_MS,
    );

    return () => clearInterval(interval);
  }, [checkNetwork]);

  useEffect(() => {
    if (networkStatus !== 'allowed' || Platform.OS === 'web') {
      return;
    }

    let isActive = true;
    setNotificationStatus('checking');
    void requestRequiredNotificationPermission()
      .then((granted) => {
        if (isActive) {
          setNotificationStatus(granted ? 'allowed' : 'blocked');
          if (granted) {
            void registerCurrentDeviceForPush().catch(() => undefined);
          }
        }
      })
      .catch(() => {
        if (isActive) {
          setNotificationStatus('blocked');
        }
      });

    return () => {
      isActive = false;
    };
  }, [networkStatus]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void checkNetwork();
        void checkNotificationPermission();
      }
    });

    return () => subscription.remove();
  }, [checkNetwork, checkNotificationPermission]);

  if (networkStatus === 'checking') {
    return <AccessLoadingScreen message="인터넷 연결을 확인하고 있어요." />;
  }

  if (networkStatus === 'blocked') {
    return (
      <AccessBlockedScreen
        description="MEDIA ON은 인터넷 연결이 필요합니다. Wi-Fi 또는 모바일 데이터를 연결하면 자동으로 다시 확인합니다."
        onPress={() => void checkNetwork(true)}
        title="인터넷에 연결해 주세요"
        buttonLabel="다시 확인"
        type="network"
      />
    );
  }

  if (notificationStatus === 'checking') {
    return <AccessLoadingScreen message="알림 권한을 확인하고 있어요." />;
  }

  if (notificationStatus === 'blocked') {
    return (
      <AccessBlockedScreen
        description="중요 공지와 신청 처리 상태를 놓치지 않도록 알림 허용이 필요합니다. 휴대전화 설정에서 MEDIA ON 알림을 허용해 주세요."
        onPress={() => void Linking.openSettings()}
        title="알림을 허용해 주세요"
        buttonLabel="설정으로 이동"
        type="notification"
      />
    );
  }

  return children;
}

async function hasInternetConnection() {
  if (Platform.OS === 'web') {
    return typeof navigator === 'undefined' || navigator.onLine;
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    NETWORK_CHECK_TIMEOUT_MS,
  );

  try {
    const response = await fetch(CONNECTIVITY_CHECK_URL, {
      cache: 'no-store',
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function AccessLoadingScreen({ message }: { message: string }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.centeredContent}>
        <ActivityIndicator color="#182366" size="large" />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

function AccessBlockedScreen({
  buttonLabel,
  description,
  onPress,
  title,
  type,
}: {
  buttonLabel: string;
  description: string;
  onPress: () => void;
  title: string;
  type: 'network' | 'notification';
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.centeredContent}>
        <View style={styles.iconCircle}>
          {type === 'notification' ? (
            <AppIcon color="#182366" name="bell" size={42} />
          ) : (
            <Text style={styles.networkIcon}>!</Text>
          )}
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>{buttonLabel}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centeredContent: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666666',
    fontFamily: 'FreesentationRegular',
    fontSize: 16,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF1FF',
  },
  networkIcon: {
    color: '#182366',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 42,
    lineHeight: 48,
  },
  title: {
    marginTop: 24,
    color: '#1F1F1F',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 24,
    textAlign: 'center',
  },
  description: {
    marginTop: 12,
    color: '#666666',
    fontFamily: 'FreesentationRegular',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    height: 52,
    marginTop: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#182366',
  },
  primaryButtonPressed: {
    opacity: 0.82,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 17,
  },
});
