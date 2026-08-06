import { StatusBar } from 'expo-status-bar';
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  const checkNetwork = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setNetworkStatus('checking');
    }

    const hasInternet = await hasInternetConnection();
    setNetworkStatus(hasInternet ? 'allowed' : 'blocked');
  }, []);

  useEffect(() => {
    void checkNetwork();
    const interval = setInterval(
      () => void checkNetwork(),
      NETWORK_RECHECK_INTERVAL_MS,
    );

    return () => clearInterval(interval);
  }, [checkNetwork]);

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
}: {
  buttonLabel: string;
  description: string;
  onPress: () => void;
  title: string;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.centeredContent}>
        <View style={styles.iconCircle}>
          <Text style={styles.networkIcon}>!</Text>
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
