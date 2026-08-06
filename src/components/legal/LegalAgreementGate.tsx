import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type PropsWithChildren, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/colors';
import { PRIVACY_VERSION, TERMS_VERSION } from '../../content/legal';
import {
  acceptRequiredLegalDocuments,
  getRequiredLegalAcceptanceStatus,
} from '../../services/legal';
import { getAuthErrorMessage, signOutUser } from '../../services/auth';

type GateStatus = 'checking' | 'required' | 'allowed' | 'error';

export function LegalAgreementGate({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<GateStatus>('checking');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const checkAcceptance = useCallback(async () => {
    setStatus('checking');

    try {
      const result = await getRequiredLegalAcceptanceStatus();
      setTermsAgreed(result.termsAccepted);
      setPrivacyConfirmed(result.privacyConfirmed);
      setStatus(result.accepted ? 'allowed' : 'required');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void checkAcceptance();
  }, [checkAcceptance]);

  const acceptDocuments = async () => {
    if (!termsAgreed || !privacyConfirmed) {
      Alert.alert('확인 필요', '필수 항목을 모두 확인해 주세요.');
      return;
    }

    try {
      setIsSaving(true);
      await acceptRequiredLegalDocuments();
      setStatus('allowed');
    } catch (error) {
      Alert.alert('저장 실패', getAuthErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const signOut = async () => {
    await signOutUser();
    router.replace('/login');
  };

  if (status === 'allowed') {
    return children;
  }

  if (status === 'checking') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.stateBox}>
          <ActivityIndicator color={COLORS.navy} size="large" />
          <Text style={styles.stateText}>약관 적용 상태를 확인하고 있어요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.stateBox}>
          <Text style={styles.errorTitle}>약관 정보를 불러오지 못했습니다.</Text>
          <Text style={styles.stateText}>
            인터넷 연결을 확인한 뒤 다시 시도해 주세요.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void checkAcceptance()}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void signOut()}
            style={styles.signOutButton}
          >
            <Text style={styles.signOutText}>로그아웃</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>정식 서비스 약관 적용</Text>
        </View>
        <Text style={styles.title}>서비스 이용 전 확인해 주세요</Text>
        <Text style={styles.description}>
          정식 서비스 전환에 따라 이용약관과 개인정보처리방침이
          적용되었습니다. 아래 내용을 확인한 뒤 계속 이용할 수 있습니다.
        </Text>

        <View style={styles.card}>
          <AgreementRow
            checked={termsAgreed}
            label="[필수] 서비스 이용약관 동의"
            onPress={() => setTermsAgreed((value) => !value)}
            onView={() =>
              router.push({
                pathname: '/legal-document',
                params: { type: 'terms' },
              })
            }
            version={TERMS_VERSION}
          />
          <View style={styles.divider} />
          <AgreementRow
            checked={privacyConfirmed}
            label="[필수] 개인정보처리방침 확인"
            onPress={() => setPrivacyConfirmed((value) => !value)}
            onView={() =>
              router.push({
                pathname: '/legal-document',
                params: { type: 'privacy' },
              })
            }
            version={PRIVACY_VERSION}
          />
        </View>

        <Text style={styles.guide}>
          개인정보처리방침에는 수집 항목, 이용 목적, 보유기간, 해외 처리,
          계정 삭제 방법과 문의처가 포함되어 있습니다.
        </Text>

        <Pressable
          accessibilityRole="button"
          disabled={isSaving || !termsAgreed || !privacyConfirmed}
          onPress={() => void acceptDocuments()}
          style={({ pressed }) => [
            styles.acceptButton,
            (!termsAgreed || !privacyConfirmed || isSaving) &&
              styles.disabledButton,
            pressed && styles.pressed,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.acceptText}>동의하고 계속하기</Text>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => void signOut()}
          style={styles.rejectButton}
        >
          <Text style={styles.rejectText}>동의하지 않고 로그아웃</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function AgreementRow({
  checked,
  label,
  onPress,
  onView,
  version,
}: {
  checked: boolean;
  label: string;
  onPress: () => void;
  onView: () => void;
  version: string;
}) {
  return (
    <View style={styles.agreementRow}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        hitSlop={8}
        onPress={onPress}
        style={styles.agreementMain}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <View style={styles.agreementTextArea}>
          <Text style={styles.agreementLabel}>{label}</Text>
          <Text style={styles.version}>버전 {version}</Text>
        </View>
      </Pressable>
      <Pressable accessibilityRole="link" hitSlop={8} onPress={onView}>
        <Text style={styles.viewText}>내용 보기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 36,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.softNavy,
  },
  badgeText: { color: COLORS.navy, fontSize: 11, fontWeight: '900' },
  title: {
    marginTop: 20,
    color: COLORS.text,
    fontSize: 27,
    fontWeight: '900',
  },
  description: {
    marginTop: 12,
    color: COLORS.subText,
    fontSize: 14,
    lineHeight: 22,
  },
  card: {
    marginTop: 32,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
  },
  agreementRow: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  agreementMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 7,
    backgroundColor: COLORS.surface,
  },
  checkboxChecked: { borderColor: COLORS.navy, backgroundColor: COLORS.navy },
  checkmark: { color: COLORS.white, fontSize: 14, fontWeight: '900' },
  agreementTextArea: { flex: 1 },
  agreementLabel: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  version: { marginTop: 5, color: COLORS.placeholder, fontSize: 11 },
  viewText: {
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  divider: { height: 1, backgroundColor: COLORS.border },
  guide: {
    marginTop: 16,
    paddingHorizontal: 4,
    color: COLORS.subText,
    fontSize: 12,
    lineHeight: 19,
  },
  acceptButton: {
    minHeight: 54,
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: COLORS.navy,
  },
  disabledButton: { opacity: 0.42 },
  acceptText: { color: COLORS.white, fontSize: 16, fontWeight: '900' },
  rejectButton: {
    minHeight: 48,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: { color: COLORS.subText, fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.72 },
  stateBox: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    marginTop: 14,
    color: COLORS.subText,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  errorTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  retryButton: {
    minHeight: 46,
    marginTop: 22,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: COLORS.navy,
  },
  retryText: { color: COLORS.white, fontSize: 14, fontWeight: '900' },
  signOutButton: { marginTop: 10, padding: 12 },
  signOutText: { color: COLORS.subText, fontSize: 13, fontWeight: '700' },
});
