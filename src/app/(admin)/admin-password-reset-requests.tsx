import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/colors';
import { getAuthErrorMessage } from '../../services/auth';
import {
  getSubmittedPasswordResetRequests,
  type PasswordResetRequest,
  processPasswordResetRequest,
} from '../../services/password-reset-requests';

type IssuedCredential = {
  name: string;
  studentNumber: string;
  temporaryPassword: string;
};

export default function AdminPasswordResetRequestsScreen() {
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [issuedCredential, setIssuedCredential] =
    useState<IssuedCredential | null>(null);

  const loadRequests = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setLoadError(null);
      setRequests(await getSubmittedPasswordResetRequests());
    } catch (error) {
      setLoadError(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const performAction = async (
    item: PasswordResetRequest,
    action: 'issue' | 'reject',
  ) => {
    try {
      setProcessingId(item.id);
      const result = await processPasswordResetRequest(item.id, action);
      setRequests((current) =>
        current.filter((request) => request.id !== item.id),
      );

      if (result.status === 'completed') {
        setIssuedCredential({
          name: item.name,
          studentNumber: item.student_number,
          temporaryPassword: result.temporaryPassword,
        });
      } else {
        Alert.alert('반려 완료', '비밀번호 재설정 요청을 반려했습니다.');
      }
    } catch (error) {
      Alert.alert('처리 실패', getAuthErrorMessage(error));
    } finally {
      setProcessingId(null);
    }
  };

  const confirmAction = (
    item: PasswordResetRequest,
    action: 'issue' | 'reject',
  ) => {
    if (Platform.OS === 'web') {
      void performAction(item, action);
      return;
    }

    const isIssuing = action === 'issue';
    Alert.alert(
      isIssuing ? '임시 비밀번호 발급' : '재설정 요청 반려',
      isIssuing
        ? `${item.name}님의 기존 비밀번호를 임시 비밀번호로 변경하시겠습니까?`
        : `${item.name}님의 요청을 반려하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: isIssuing ? '발급' : '반려',
          style: isIssuing ? 'default' : 'destructive',
          onPress: () => void performAction(item, action),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="관리자 홈으로 이동"
          hitSlop={10}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>비밀번호 재설정</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadRequests(true)}
            tintColor={COLORS.navy}
            colors={[COLORS.navy]}
          />
        }
      >
        {issuedCredential ? (
          <View style={styles.credentialCard}>
            <Text style={styles.credentialEyebrow}>1회 표시</Text>
            <Text style={styles.credentialTitle}>
              임시 비밀번호가 발급되었습니다
            </Text>
            <Text style={styles.credentialDescription}>
              아래 비밀번호는 다시 확인할 수 없습니다. 학생에게 전달한
              뒤 닫아 주세요.
            </Text>

            <View style={styles.credentialInfo}>
              <DetailRow label="이름" value={issuedCredential.name} />
              <DetailRow
                label="학번/사번"
                value={issuedCredential.studentNumber}
              />
              <View style={styles.passwordRow}>
                <Text style={styles.passwordLabel}>임시 비밀번호</Text>
                <Text selectable style={styles.passwordValue}>
                  {issuedCredential.temporaryPassword}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => setIssuedCredential(null)}
              style={({ pressed }) => [
                styles.credentialClose,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.credentialCloseText}>
                전달 완료 후 닫기
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryTitle}>재설정 요청 대기</Text>
            <Text style={styles.summaryDescription}>
              가입 정보와 요청 사유를 확인해 주세요.
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{requests.length}</Text>
            <Text style={styles.countUnit}>건</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>요청 목록</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadRequests()}
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.refreshText}>새로고침</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={COLORS.navy} />
            <Text style={styles.stateText}>요청을 불러오는 중입니다.</Text>
          </View>
        ) : loadError ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorTitle}>목록을 불러오지 못했습니다.</Text>
            <Text style={styles.stateText}>{loadError}</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.emptyMark}>✓</Text>
            <Text style={styles.emptyTitle}>대기 중인 요청이 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.requestList}>
            {requests.map((item) => {
              const isProcessing = processingId === item.id;

              return (
                <View key={item.id} style={styles.requestCard}>
                  <View style={styles.requestTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {item.name.slice(0, 1)}
                      </Text>
                    </View>
                    <View style={styles.requestTitleArea}>
                      <Text style={styles.requestName}>{item.name}</Text>
                      <Text style={styles.requestNumber}>
                        {item.student_number}
                      </Text>
                    </View>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>접수</Text>
                    </View>
                  </View>

                  <View style={styles.detailBox}>
                    <DetailRow
                      label="연락처"
                      value={formatPhoneNumber(item.phone_number)}
                    />
                    <DetailRow
                      label="요청일"
                      value={formatDate(item.created_at)}
                    />
                    <DetailRow
                      label="사유"
                      value={item.reason || '별도 사유 없음'}
                    />
                  </View>

                  <View style={styles.actionRow}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isProcessing}
                      onPress={() => confirmAction(item, 'reject')}
                      style={({ pressed }) => [
                        styles.rejectButton,
                        isProcessing && styles.disabled,
                        pressed && !isProcessing && styles.pressed,
                      ]}
                    >
                      <Text style={styles.rejectText}>반려</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isProcessing}
                      onPress={() => confirmAction(item, 'issue')}
                      style={({ pressed }) => [
                        styles.issueButton,
                        isProcessing && styles.disabled,
                        pressed && !isProcessing && styles.pressed,
                      ]}
                    >
                      {isProcessing ? (
                        <ActivityIndicator
                          size="small"
                          color={COLORS.white}
                        />
                      ) : (
                        <Text style={styles.issueText}>
                          임시 비밀번호 발급
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function formatPhoneNumber(value: string) {
  if (value.length !== 11) {
    return value;
  }

  return `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    height: 58,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backText: {
    width: 36,
    color: COLORS.text,
    fontSize: 36,
    lineHeight: 38,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 52,
  },
  credentialCard: {
    marginBottom: 18,
    padding: 20,
    borderRadius: 18,
    backgroundColor: COLORS.navy,
  },
  credentialEyebrow: {
    color: '#BFC6F0',
    fontSize: 12,
    fontWeight: '800',
  },
  credentialTitle: {
    marginTop: 8,
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
  },
  credentialDescription: {
    marginTop: 8,
    color: '#D9DDEF',
    fontSize: 13,
    lineHeight: 20,
  },
  credentialInfo: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  passwordRow: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.18)',
  },
  passwordLabel: {
    color: '#D9DDEF',
    fontSize: 12,
    fontWeight: '700',
  },
  passwordValue: {
    marginTop: 6,
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  credentialClose: {
    minHeight: 46,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  credentialCloseText: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '800',
  },
  summaryCard: {
    minHeight: 106,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  summaryTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  summaryDescription: {
    maxWidth: 220,
    marginTop: 7,
    color: COLORS.subText,
    fontSize: 12,
    lineHeight: 18,
  },
  countBadge: {
    minWidth: 60,
    height: 60,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    borderRadius: 30,
    backgroundColor: COLORS.softNavy,
  },
  countText: {
    color: COLORS.navy,
    fontSize: 25,
    fontWeight: '900',
  },
  countUnit: {
    marginLeft: 2,
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  refreshButton: {
    minHeight: 34,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: COLORS.softNavy,
  },
  refreshText: {
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: '800',
  },
  stateBox: {
    minHeight: 230,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  stateText: {
    marginTop: 12,
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyMark: {
    color: COLORS.navy,
    fontSize: 34,
    fontWeight: '900',
  },
  emptyTitle: {
    marginTop: 12,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  requestList: {
    gap: 14,
  },
  requestCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  requestTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: COLORS.softNavy,
  },
  avatarText: {
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: '900',
  },
  requestTitleArea: {
    flex: 1,
    marginLeft: 12,
  },
  requestName: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  requestNumber: {
    marginTop: 3,
    color: COLORS.subText,
    fontSize: 13,
  },
  pendingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  pendingText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '800',
  },
  detailBox: {
    marginTop: 16,
    padding: 14,
    gap: 10,
    borderRadius: 13,
    backgroundColor: COLORS.background,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  detailLabel: {
    width: 68,
    color: COLORS.subText,
    fontSize: 12,
    fontWeight: '700',
  },
  detailValue: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'right',
  },
  actionRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  rejectButton: {
    width: 76,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  rejectText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '800',
  },
  issueButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.navy,
  },
  issueText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
});
