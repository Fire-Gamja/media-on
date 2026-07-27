import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  type ImageSourcePropType,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isSupabaseConfigured } from '../../lib/supabase';
import {
  type AdminAssistantInquiry,
  getAdminAssistantInquiries,
} from '../../services/assistant-inquiries';
import {
  type AdminStudentProfile,
  getApprovedStudentCount,
  getAuthErrorMessage,
  getCurrentProfile,
  getPendingStudents,
  reviewStudentAccount,
  signOutUser,
  type StudentProfile,
} from '../../services/auth';

const bellIcon = require('../../../assets/figma/manager/bell.png');

type ManagementAction = {
  id: 'notice' | 'equipment' | 'room' | 'facility' | 'assistant';
  title: string;
  route:
    | '/admin-notices'
    | '/admin-equipment-requests'
    | '/admin-room-requests'
    | '/admin-facility-reports'
    | '/admin-assistant-inquiries';
  icon: ImageSourcePropType;
};

type DashboardInquiry = {
  id: string;
  name: string;
  studentNumber: string;
  date: string;
  status: 'submitted' | 'in_progress' | 'answered';
};

const MANAGEMENT_ACTIONS: ManagementAction[] = [
  {
    id: 'notice',
    title: '공지사항',
    route: '/admin-notices',
    icon: require('../../../assets/figma/student/quick-notice.png'),
  },
  {
    id: 'equipment',
    title: '기자재 대여',
    route: '/admin-equipment-requests',
    icon: require('../../../assets/figma/student/quick-equipment.png'),
  },
  {
    id: 'room',
    title: '실습실 대여',
    route: '/admin-room-requests',
    icon: require('../../../assets/figma/student/quick-room.png'),
  },
  {
    id: 'facility',
    title: '시설 신고',
    route: '/admin-facility-reports',
    icon: require('../../../assets/figma/student/quick-report.png'),
  },
  {
    id: 'assistant',
    title: '조교 문의',
    route: '/admin-assistant-inquiries',
    icon: require('../../../assets/figma/student/quick-assistant.png'),
  },
];

const DEMO_INQUIRIES: DashboardInquiry[] = [
  ['Student 01', '2022112701', '2026-07-26', 'in_progress'],
  ['Student 02', '2022112702', '2026-07-26', 'in_progress'],
  ['Student 03', '2022112703', '2026-07-25', 'submitted'],
  ['Student 04', '2022112704', '2026-07-25', 'submitted'],
  ['Student 05', '2022112705', '2026-07-24', 'submitted'],
  ['Student 06', '2022112706', '2026-07-24', 'answered'],
].map(([name, studentNumber, date, status], index) => ({
  id: `demo-inquiry-${index}`,
  name,
  studentNumber,
  date,
  status: status as DashboardInquiry['status'],
}));

export default function AdminHomeScreen() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [students, setStudents] = useState<AdminStudentProfile[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [inquiries, setInquiries] =
    useState<DashboardInquiry[]>(DEMO_INQUIRIES);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const dashboardInquiries = inquiries.slice(0, 6);

  const loadDashboard = useCallback(async (refreshing = false) => {
    if (!isSupabaseConfigured) {
      return;
    }

    refreshing ? setIsRefreshing(true) : setIsLoading(true);

    try {
      setErrorMessage(null);
      const [nextProfile, pendingStudents, approvedCount, nextInquiries] =
        await Promise.all([
          getCurrentProfile(),
          getPendingStudents(),
          getApprovedStudentCount(),
          getAdminAssistantInquiries(),
        ]);
      setProfile(nextProfile);
      setStudents(pendingStudents);
      setStudentCount(approvedCount);
      setInquiries(nextInquiries.map(toDashboardInquiry));
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const handleReview = (
    student: AdminStudentProfile,
    decision: 'approved' | 'rejected',
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
              if (isApproval) {
                setStudentCount((current) => current + 1);
              }
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

  const handleLogout = () => {
    Alert.alert('로그아웃', '관리자 계정에서 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await signOutUser();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={['#182365']}
            onRefresh={() => void loadDashboard(true)}
            refreshing={isRefreshing}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/profile')}
            style={({ pressed }) => [
              styles.greeting,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.adminAvatar} />
            <View>
              <Text style={styles.greetingCaption}>
                오늘도 활기찬 하루 입니다.
              </Text>
              <Text style={styles.greetingName}>
                {profile?.name ? `${profile.name}님` : '조교님'}
              </Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="비밀번호 재설정 요청 알림"
            onPress={() => router.push('/admin-password-reset-requests')}
            style={({ pressed }) => [
              styles.bellButton,
              pressed && styles.pressed,
            ]}
          >
            <Image source={bellIcon} style={styles.bellIcon} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#182365" size="large" />
          </View>
        ) : null}

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeadingRow}>
              <Text style={styles.summaryTitle}>조치 대기</Text>
              <Text style={styles.summaryCount}>{students.length}건</Text>
            </View>
            <View style={styles.pendingPreview}>
              {students[0] ? (
                <>
                  <Text numberOfLines={1} style={styles.pendingStudentName}>
                    {students[0].name} 학생
                  </Text>
                  <Text style={styles.pendingDescription}>
                    가입 승인 신청을 확인해 주세요.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.pendingStudentName}>
                    대기 중인 신청이 없습니다.
                  </Text>
                  <Text style={styles.pendingDescription}>
                    새로운 가입 신청이 접수되면{'\n'}이곳에 표시 됩니다.
                  </Text>
                </>
              )}
            </View>
            <View style={styles.studentCountBar}>
              <Text style={styles.studentCountLabel}>학생 수</Text>
              <Text style={styles.studentCountValue}>
                {`${studentCount}`.padStart(3, '0')}
              </Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.dateRow}>
              <Text style={styles.dateNumber}>{today.getDate()}일</Text>
              <Text style={styles.dateWeekday}>
                {formatWeekday(today)}
              </Text>
            </View>
            <DashboardStatusRow label="문의" value="상담 휴무" />
            <DashboardStatusRow label="가입 대기" value={`${students.length} 명`} />
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/admin-notices')}
              style={({ pressed }) => [
                styles.emergencyButton,
                pressed && styles.pressed,
              ]}
            >
              <Image source={bellIcon} style={styles.emergencyIcon} />
              <Text style={styles.emergencyText}>긴급 공지 재 발송</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>관리 메뉴</Text>
          <View style={styles.managementMenu}>
            {MANAGEMENT_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                accessibilityRole="button"
                onPress={() => router.push(action.route)}
                style={({ pressed }) => [
                  styles.managementAction,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.managementIconBox}>
                  <Image source={action.icon} style={styles.managementIcon} />
                </View>
                <Text style={styles.managementLabel}>{action.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.inquirySection}>
          <View style={styles.inquiryHeader}>
            <Text style={styles.sectionTitle}>조교 문의</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/admin-assistant-inquiries')}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Text style={styles.viewAll}>모두 보기</Text>
            </Pressable>
          </View>

          <View style={styles.inquiryList}>
            {dashboardInquiries.length === 0 ? (
              <View style={styles.emptyInquiry}>
                <Text style={styles.emptyInquiryText}>
                  접수된 조교 문의가 없습니다.
                </Text>
              </View>
            ) : (
              dashboardInquiries.map((inquiry, index) => (
                <Pressable
                  key={inquiry.id}
                  accessibilityRole="button"
                  disabled={inquiry.id.startsWith('demo-')}
                  onPress={() =>
                    router.push({
                      pathname: '/admin-assistant-inquiry',
                      params: { id: inquiry.id },
                    })
                  }
                  style={({ pressed }) => [
                    styles.inquiryCard,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.inquiryAvatar,
                      { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] },
                    ]}
                  >
                    <Text style={styles.inquiryAvatarText}>
                      {inquiry.name.slice(0, 1)}
                    </Text>
                  </View>
                  <View style={styles.inquiryPerson}>
                    <Text numberOfLines={1} style={styles.inquiryName}>
                      {inquiry.name}
                    </Text>
                    <Text style={styles.inquiryDate}>
                      {formatShortDate(inquiry.date)}
                    </Text>
                  </View>
                  <View style={styles.inquiryStatus}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: getInquiryStatusStyle(inquiry.status)
                            .color,
                        },
                      ]}
                    />
                    <Text style={styles.inquiryStatusText}>
                      {getInquiryStatusStyle(inquiry.status).label}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </View>

        {errorMessage ? (
          <Pressable
            onPress={() => void loadDashboard()}
            style={({ pressed }) => [
              styles.errorCard,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.errorTitle}>일부 정보를 불러오지 못했습니다.</Text>
            <Text style={styles.errorText}>{errorMessage} · 다시 시도</Text>
          </Pressable>
        ) : null}

        <View style={styles.pendingSection}>
          <View style={styles.pendingHeader}>
            <Text style={styles.sectionTitle}>가입 대기</Text>
            <Text style={styles.pendingHeaderCount}>{students.length}명</Text>
          </View>
          {students.length === 0 ? (
            <View style={styles.pendingEmpty}>
              <Text style={styles.pendingEmptyText}>
                확인할 가입 신청이 없습니다.
              </Text>
            </View>
          ) : (
            <View style={styles.studentList}>
              {students.map((student) => {
                const isProcessing = processingId === student.id;

                return (
                  <View key={student.id} style={styles.studentCard}>
                    <View style={styles.studentInfo}>
                      <View style={styles.studentAvatar}>
                        <Text style={styles.studentAvatarText}>
                          {student.name.slice(0, 1)}
                        </Text>
                      </View>
                      <View style={styles.studentTextArea}>
                        <Text style={styles.studentName}>{student.name}</Text>
                        <Text style={styles.studentMeta}>
                          {student.student_number} · {student.grade}학년 ·{' '}
                          {student.major}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reviewActions}>
                      <Pressable
                        disabled={isProcessing}
                        onPress={() => handleReview(student, 'rejected')}
                        style={({ pressed }) => [
                          styles.rejectButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.rejectText}>거절</Text>
                      </Pressable>
                      <Pressable
                        disabled={isProcessing}
                        onPress={() => handleReview(student, 'approved')}
                        style={({ pressed }) => [
                          styles.approveButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        {isProcessing ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
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
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/admin-password-reset-requests')}
          style={({ pressed }) => [
            styles.passwordResetLink,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.passwordResetText}>비밀번호 재설정 요청 관리</Text>
          <Text style={styles.passwordResetChevron}>›</Text>
        </Pressable>

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
      </ScrollView>
    </SafeAreaView>
  );
}

function DashboardStatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.dashboardStatusRow}>
      <Text style={styles.dashboardStatusLabel}>{label}</Text>
      <Text style={styles.dashboardStatusValue}>{value}</Text>
    </View>
  );
}

function toDashboardInquiry(
  inquiry: AdminAssistantInquiry,
): DashboardInquiry {
  return {
    id: inquiry.id,
    name: inquiry.requester?.name ?? '학생',
    studentNumber: inquiry.requester?.student_number ?? '',
    date: inquiry.created_at,
    status: inquiry.status,
  };
}

function getInquiryStatusStyle(status: DashboardInquiry['status']) {
  if (status === 'in_progress') {
    return { label: '상담 중', color: '#4BC151' };
  }

  if (status === 'answered') {
    return { label: '상담 완료', color: '#000000' };
  }

  return { label: '상담 대기', color: '#F19A49' };
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', { weekday: 'short' })
    .format(date)
    .replace('요일', '');
}

function formatShortDate(value: string) {
  const date = new Date(value);
  return `${`${date.getMonth() + 1}`.padStart(2, '0')} ${date.toLocaleString(
    'en-US',
    { month: 'short' },
  )} ${date.getFullYear()}`;
}

const AVATAR_COLORS = [
  '#566F7F',
  '#A46B42',
  '#25C967',
  '#45748C',
  '#2F4D3D',
  '#B27945',
] as const;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },
  topRow: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adminAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D2D2D2',
  },
  greetingCaption: {
    color: '#000000',
    fontFamily: 'FreesentationRegular',
    fontSize: 10,
  },
  greetingName: {
    color: '#000000',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 12,
  },
  bellButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  loadingBox: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    minHeight: 164,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  summaryHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    color: '#000000',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 16,
  },
  summaryCount: {
    color: '#000000',
    fontFamily: 'FreesentationRegular',
    fontSize: 16,
  },
  pendingPreview: {
    flex: 1,
    marginTop: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    backgroundColor: '#F0F0F0',
  },
  pendingStudentName: {
    color: '#000000',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
    textAlign: 'center',
  },
  pendingDescription: {
    marginTop: 8,
    color: '#000000',
    fontFamily: 'FreesentationRegular',
    fontSize: 8,
    lineHeight: 10,
    textAlign: 'center',
  },
  studentCountBar: {
    height: 23,
    marginTop: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 3,
    backgroundColor: '#182365',
  },
  studentCountLabel: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 8,
  },
  studentCountValue: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 8,
  },
  dateRow: {
    height: 43,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  dateNumber: {
    color: '#000000',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 24,
  },
  dateWeekday: {
    color: '#FF0000',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
  },
  dashboardStatusRow: {
    height: 23,
    marginTop: 6,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 3,
    backgroundColor: '#182365',
  },
  dashboardStatusLabel: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 10,
  },
  dashboardStatusValue: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationRegular',
    fontSize: 9,
  },
  emergencyButton: {
    height: 23,
    marginTop: 6,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 3,
    backgroundColor: '#182365',
  },
  emergencyIcon: {
    height: 12,
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
    width: 12,
  },
  emergencyText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationRegular',
    fontSize: 10,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: '#000000',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 18,
  },
  managementMenu: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  managementAction: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  managementIconBox: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  managementIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  managementLabel: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
    textAlign: 'center',
  },
  inquirySection: {
    marginTop: 24,
  },
  inquiryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAll: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationRegular',
    fontSize: 13,
  },
  inquiryList: {
    marginTop: 12,
    gap: 14,
  },
  inquiryCard: {
    minHeight: 50,
    paddingHorizontal: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  inquiryAvatar: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  inquiryAvatarText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 10,
  },
  inquiryPerson: {
    flex: 1,
    marginLeft: 8,
  },
  inquiryName: {
    color: '#000000',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 10,
  },
  inquiryDate: {
    marginTop: 2,
    color: '#39393E',
    fontFamily: 'FreesentationRegular',
    fontSize: 8,
  },
  inquiryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inquiryStatusText: {
    color: '#000000',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 12,
  },
  emptyInquiry: {
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
  },
  emptyInquiryText: {
    color: '#8C8C8C',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
  },
  errorCard: {
    marginTop: 20,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#FFF1F1',
  },
  errorTitle: {
    color: '#DC2626',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 13,
  },
  errorText: {
    marginTop: 4,
    color: '#8C8C8C',
    fontFamily: 'FreesentationRegular',
    fontSize: 11,
  },
  pendingSection: {
    marginTop: 30,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingHeaderCount: {
    color: '#182365',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  pendingEmpty: {
    height: 92,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
  },
  pendingEmptyText: {
    color: '#8C8C8C',
    fontFamily: 'FreesentationRegular',
    fontSize: 13,
  },
  studentList: {
    marginTop: 12,
    gap: 12,
  },
  studentCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#182365',
  },
  studentAvatarText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 15,
  },
  studentTextArea: {
    flex: 1,
    marginLeft: 10,
  },
  studentName: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 15,
  },
  studentMeta: {
    marginTop: 4,
    color: '#8C8C8C',
    fontFamily: 'FreesentationRegular',
    fontSize: 11,
  },
  reviewActions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  rejectButton: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#F0F0F0',
  },
  rejectText: {
    color: '#6F6F6F',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 13,
  },
  approveButton: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#182365',
  },
  approveText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 13,
  },
  passwordResetLink: {
    height: 50,
    marginTop: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    backgroundColor: '#E9EBF8',
  },
  passwordResetText: {
    color: '#182365',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  passwordResetChevron: {
    color: '#182365',
    fontSize: 25,
  },
  logoutButton: {
    alignSelf: 'center',
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#9C9C9C',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
  },
  pressed: {
    opacity: 0.65,
  },
});
