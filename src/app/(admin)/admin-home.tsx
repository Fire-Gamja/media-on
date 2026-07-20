import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/colors';
import {
  type AdminStudentProfile,
  getAuthErrorMessage,
  getPendingStudents,
  reviewStudentAccount,
  signOutUser,
} from '../../services/auth';

type ReviewDecision = 'approved' | 'rejected';

export default function AdminHomeScreen() {
  const [students, setStudents] = useState<AdminStudentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStudents = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setErrorMessage(null);
      setStudents(await getPendingStudents());
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const handleLogout = () => {
    Alert.alert('로그아웃', '관리자 계정에서 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOutUser();
          } finally {
            router.replace('/login');
          }
        },
      },
    ]);
  };

  const handleReview = (
    student: AdminStudentProfile,
    decision: ReviewDecision,
  ) => {
    const isApproval = decision === 'approved';

    Alert.alert(
      isApproval ? '가입 승인' : '가입 거절',
      `${student.name} 학생의 가입을 ${
        isApproval ? '승인' : '거절'
      }하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: isApproval ? '승인' : '거절',
          style: isApproval ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setProcessingId(student.id);
              await reviewStudentAccount(student.id, decision);
              setStudents((current) =>
                current.filter((item) => item.id !== student.id),
              );
              Alert.alert(
                '처리 완료',
                `${student.name} 학생의 가입을 ${
                  isApproval ? '승인했습니다.' : '거절했습니다.'
                }`,
              );
            } catch (error) {
              Alert.alert('처리 실패', getAuthErrorMessage(error));
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>MEDIA ON</Text>
          <Text style={styles.headerTitle}>관리자 홈</Text>
          <Text style={styles.headerDescription}>
            학부 서비스 가입 신청을 확인해 주세요.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.logoutText}>로그아웃</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadStudents(true)}
            tintColor={COLORS.navy}
            colors={[COLORS.navy]}
          />
        }
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/admin-notices')}
          style={({ pressed }) => [
            styles.managementCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.managementIcon}>
            <Text style={styles.managementIconText}>공</Text>
          </View>
          <View style={styles.managementTextArea}>
            <Text style={styles.managementTitle}>공지사항 관리</Text>
            <Text style={styles.managementDescription}>
              공지를 작성하고 게시 상태를 관리합니다.
            </Text>
          </View>
          <Text style={styles.managementChevron}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/admin-assistant-inquiries')}
          style={({ pressed }) => [
            styles.managementCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.managementIcon}>
            <Text style={styles.managementIconText}>문</Text>
          </View>
          <View style={styles.managementTextArea}>
            <Text style={styles.managementTitle}>조교 문의 관리</Text>
            <Text style={styles.managementDescription}>
              학생 문의를 확인하고 답변을 전송합니다.
            </Text>
          </View>
          <Text style={styles.managementChevron}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/admin-room-requests')}
          style={({ pressed }) => [
            styles.managementCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.managementIcon}>
            <Text style={styles.managementIconText}>실</Text>
          </View>
          <View style={styles.managementTextArea}>
            <Text style={styles.managementTitle}>실습실 대여 관리</Text>
            <Text style={styles.managementDescription}>
              실습실 예약 신청과 이용 상태를 관리합니다.
            </Text>
          </View>
          <Text style={styles.managementChevron}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/admin-equipment-requests')}
          style={({ pressed }) => [
            styles.managementCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.managementIcon}>
            <Text style={styles.managementIconText}>장</Text>
          </View>
          <View style={styles.managementTextArea}>
            <Text style={styles.managementTitle}>기자재 대여 관리</Text>
            <Text style={styles.managementDescription}>
              학생 대여 신청과 반납 상태를 관리합니다.
            </Text>
          </View>
          <Text style={styles.managementChevron}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/admin-facility-reports')}
          style={({ pressed }) => [
            styles.managementCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.managementIcon}>
            <Text style={styles.managementIconText}>시</Text>
          </View>
          <View style={styles.managementTextArea}>
            <Text style={styles.managementTitle}>시설 신고 관리</Text>
            <Text style={styles.managementDescription}>
              학생 신고를 확인하고 처리 상태를 관리합니다.
            </Text>
          </View>
          <Text style={styles.managementChevron}>›</Text>
        </Pressable>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>가입 승인 대기</Text>
            <Text style={styles.summaryDescription}>
              이름과 학번을 확인한 뒤 처리해 주세요.
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{students.length}</Text>
            <Text style={styles.countUnit}>명</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>대기 학생</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadStudents()}
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
            <Text style={styles.stateText}>가입 신청을 불러오는 중입니다.</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorTitle}>목록을 불러오지 못했습니다.</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void loadStudents()}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : students.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.emptyIcon}>✓</Text>
            <Text style={styles.emptyTitle}>대기 중인 신청이 없습니다.</Text>
            <Text style={styles.stateText}>
              새로운 가입 신청이 접수되면 이곳에 표시됩니다.
            </Text>
          </View>
        ) : (
          <View style={styles.studentList}>
            {students.map((student) => {
              const isProcessing = processingId === student.id;

              return (
                <View key={student.id} style={styles.studentCard}>
                  <View style={styles.studentTopRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {student.name.slice(0, 1)}
                      </Text>
                    </View>
                    <View style={styles.studentTitleArea}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentNumber}>
                        {student.student_number}
                      </Text>
                    </View>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>승인 대기</Text>
                    </View>
                  </View>

                  <View style={styles.detailBox}>
                    <DetailRow label="학적" value={`${student.grade}학년 · ${student.enrollment_status}`} />
                    <DetailRow label="전공" value={student.major} />
                    <DetailRow label="연락처" value={formatPhoneNumber(student.phone_number)} />
                    <DetailRow label="신청일" value={formatDate(student.created_at)} />
                  </View>

                  <View style={styles.actionRow}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isProcessing}
                      onPress={() => handleReview(student, 'rejected')}
                      style={({ pressed }) => [
                        styles.rejectButton,
                        isProcessing && styles.disabled,
                        pressed && !isProcessing && styles.pressed,
                      ]}
                    >
                      <Text style={styles.rejectText}>거절</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isProcessing}
                      onPress={() => handleReview(student, 'approved')}
                      style={({ pressed }) => [
                        styles.approveButton,
                        isProcessing && styles.disabled,
                        pressed && !isProcessing && styles.pressed,
                      ]}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <Text style={styles.approveText}>승인</Text>
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

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function formatPhoneNumber(phoneNumber: string) {
  if (phoneNumber.length !== 11) {
    return phoneNumber;
  }

  return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(
    3,
    7,
  )}-${phoneNumber.slice(7)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  header: {
    minHeight: 176,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: COLORS.navy,
  },
  brand: {
    color: '#D9DDEF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerTitle: {
    marginTop: 15,
    color: COLORS.white,
    fontSize: 27,
    fontWeight: '800',
  },
  headerDescription: {
    marginTop: 8,
    color: '#D9DDEF',
    fontSize: 13,
    lineHeight: 20,
  },
  logoutButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.34)',
    borderRadius: 10,
  },
  logoutText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
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
  managementCard: {
    minHeight: 88,
    marginBottom: 14,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.navy,
  },
  managementIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  managementIconText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
  },
  managementTextArea: {
    flex: 1,
    marginLeft: 13,
  },
  managementTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  managementDescription: {
    marginTop: 5,
    color: '#D9DDEF',
    fontSize: 12,
  },
  managementChevron: {
    color: COLORS.white,
    fontSize: 26,
  },
  summaryLabel: {
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
    marginTop: 30,
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
    minHeight: 220,
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
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '800',
  },
  retryButton: {
    minHeight: 42,
    marginTop: 20,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: COLORS.navy,
  },
  retryText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyIcon: {
    width: 48,
    height: 48,
    color: COLORS.success,
    fontSize: 27,
    lineHeight: 48,
    fontWeight: '800',
    textAlign: 'center',
    borderRadius: 24,
    backgroundColor: '#EAF8F0',
  },
  emptyTitle: {
    marginTop: 15,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  studentList: {
    gap: 14,
  },
  studentCard: {
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  studentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: COLORS.navy,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  studentTitleArea: {
    flex: 1,
    marginLeft: 12,
  },
  studentName: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  studentNumber: {
    marginTop: 4,
    color: COLORS.subText,
    fontSize: 12,
  },
  pendingBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 11,
    backgroundColor: '#FFF3DB',
  },
  pendingText: {
    color: '#9A5B00',
    fontSize: 11,
    fontWeight: '800',
  },
  detailBox: {
    marginTop: 17,
    padding: 14,
    gap: 9,
    borderRadius: 13,
    backgroundColor: '#F7F8FC',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailLabel: {
    width: 54,
    color: COLORS.subText,
    fontSize: 12,
    fontWeight: '700',
  },
  detailValue: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
  },
  rejectText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '800',
  },
  approveButton: {
    flex: 2,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: COLORS.navy,
  },
  approveText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.5,
  },
});
