import * as Network from 'expo-network';
import { StatusBar } from 'expo-status-bar';
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AccessStatus = 'checking' | 'allowed' | 'blocked';

const NETWORK_RECHECK_INTERVAL_MS = 10_000;

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
    const subscription = Network.addNetworkStateListener((state) => {
      setNetworkStatus(getAccessStatus(state));
    });
    const interval = setInterval(
      () => void checkNetwork(),
      NETWORK_RECHECK_INTERVAL_MS,
    );

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
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
  try {
    const state = await Network.getNetworkStateAsync();
    return getAccessStatus(state) === 'allowed';
  } catch {
    // 네트워크 상태 조회 자체의 일시적 실패로 앱 이용을 잘못 막지 않는다.
    return true;
  }
}

function getAccessStatus(state: Network.NetworkState): AccessStatus {
  const isDefinitelyOffline =
    state.type === Network.NetworkStateType.NONE ||
    state.isConnected === false ||
    state.isInternetReachable === false;

  return isDefinitelyOffline ? 'blocked' : 'allowed';
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
