import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  type ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MonthCalendar, {
  fromDateKey,
  toDateKey,
} from '../../components/student/MonthCalendar';
import { useNoticeSettings } from '../../context/notice-settings-context';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  type AssistantInquiry,
  getMyAssistantInquiries,
} from '../../services/assistant-inquiries';
import {
  type EquipmentRentalRequest,
  getMyEquipmentRentalRequests,
} from '../../services/equipment-rentals';
import {
  type FacilityReport,
  getMyFacilityReports,
} from '../../services/facility-reports';
import {
  getCurrentProfile,
  signOutUser,
  type StudentProfile,
} from '../../services/auth';
import { getPublishedNotices } from '../../services/notices';
import {
  getMyRoomReservationRequests,
  type RoomReservationRequest,
} from '../../services/room-reservations';
import {
  getStudentSchedules,
  type StudentSchedule,
} from '../../services/student-schedule';

const bellIcon = require('../../../assets/figma/student/bell.png');
const searchIcon = require('../../../assets/figma/student/search.png');
const settingsIcon = require('../../../assets/figma/student/settings.png');
const profileAvatar = require('../../../assets/figma/student/profile-avatar.png');
const menuIcon = require('../../../assets/figma/student/menu.png');
const sirenIcon = require('../../../assets/figma/student/siren.png');
const assistantIcon = require('../../../assets/figma/student/quick-assistant.png');

type QuickAction = {
  id: 'notice' | 'equipment' | 'room' | 'report' | 'assistant';
  title: string;
  icon: ImageSourcePropType;
};

type HomeNotice = {
  id: string;
  title: string;
  publishedAt: string;
  urgent?: boolean;
};

type RequestStage = 'pending' | 'processing' | 'completed';

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'notice',
    title: '공지사항',
    icon: require('../../../assets/figma/student/quick-notice.png'),
  },
  {
    id: 'equipment',
    title: '기자재 대여',
    icon: require('../../../assets/figma/student/quick-equipment.png'),
  },
  {
    id: 'room',
    title: '실습실 대여',
    icon: require('../../../assets/figma/student/quick-room.png'),
  },
  {
    id: 'report',
    title: '시설 신고',
    icon: require('../../../assets/figma/student/quick-report.png'),
  },
  {
    id: 'assistant',
    title: '조교 문의',
    icon: assistantIcon,
  },
];

const FALLBACK_NOTICES: HomeNotice[] = [
  {
    id: 'notice-emergency',
    title: '[긴급] 학년별 조사',
    publishedAt: '2026-07-26T09:00:00+09:00',
    urgent: true,
  },
  {
    id: 'notice-camp',
    title: '방학 중 캠프 안내',
    publishedAt: '2026-07-26T09:00:00+09:00',
  },
  {
    id: 'notice-lab',
    title: '2학기 실습 배정 및 안내',
    publishedAt: '2026-07-26T09:00:00+09:00',
  },
];

export default function StudentHomeScreen() {
  const { noticeCount } = useNoticeSettings();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [notices, setNotices] = useState<HomeNotice[]>(FALLBACK_NOTICES);
  const [schedules, setSchedules] = useState<StudentSchedule[]>([]);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [equipmentRequest, setEquipmentRequest] =
    useState<EquipmentRentalRequest | null>(null);
  const [facilityReport, setFacilityReport] = useState<FacilityReport | null>(
    null,
  );
  const [roomRequest, setRoomRequest] =
    useState<RoomReservationRequest | null>(null);
  const [assistantInquiry, setAssistantInquiry] =
    useState<AssistantInquiry | null>(null);

  const visibleNotices = notices.slice(0, Math.max(1, noticeCount));
  const requestCounts = useMemo(
    () =>
      calculateRequestCounts(
        equipmentRequest,
        facilityReport,
        roomRequest,
        assistantInquiry,
      ),
    [assistantInquiry, equipmentRequest, facilityReport, roomRequest],
  );
  const eventDates = useMemo(
    () => new Set(schedules.map((schedule) => schedule.startDate)),
    [schedules],
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    void getPublishedNotices(7)
      .then((data) =>
        setNotices(
          data.map((notice) => ({
            id: notice.id,
            title: notice.title,
            publishedAt: notice.published_at ?? notice.created_at,
            urgent: /^\[긴급\]/.test(notice.title),
          })),
        ),
      )
      .catch(() => setNotices(FALLBACK_NOTICES));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void getStudentSchedules().then(setSchedules);

      if (!isSupabaseConfigured) {
        return;
      }

      void Promise.all([
        getCurrentProfile(),
        getMyEquipmentRentalRequests(1),
        getMyFacilityReports(1),
        getMyRoomReservationRequests(1),
        getMyAssistantInquiries(1),
      ])
        .then(([nextProfile, equipment, facility, room, inquiry]) => {
          setProfile(nextProfile);
          setEquipmentRequest(equipment[0] ?? null);
          setFacilityReport(facility[0] ?? null);
          setRoomRequest(room[0] ?? null);
          setAssistantInquiry(inquiry[0] ?? null);
        })
        .catch(() => {
          setProfile(null);
        });
    }, []),
  );

  const handleQuickAction = (action: QuickAction) => {
    const routes = {
      notice: '/notices',
      equipment: '/equipment',
      room: '/rooms',
      report: '/facility-report',
      assistant: '/assistant-inquiry',
    } as const;

    router.push(routes[action.id]);
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃하시겠습니까?', [
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

      <View style={styles.header}>
        <Text style={styles.headerTitle}>홈</Text>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="알림"
            hitSlop={6}
            onPress={() => router.push('/notifications')}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <Image source={bellIcon} style={styles.bellIcon} />
            <View style={styles.notificationDot} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="공지사항 검색"
            hitSlop={6}
            onPress={() => router.push('/notices')}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <Image source={searchIcon} style={styles.searchIcon} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SectionTitle
          action={
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/profile')}
              style={({ pressed }) => [
                styles.profileEdit,
                pressed && styles.pressed,
              ]}
            >
              <Image source={settingsIcon} style={styles.settingsIcon} />
              <Text style={styles.profileEditText}>정보 변경</Text>
            </Pressable>
          }
          title="내 정보"
        />

        <View style={styles.profileCard}>
          <Image source={profileAvatar} style={styles.profileAvatar} />
          <View style={styles.profileTextArea}>
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>
                {profile
                  ? `${profile.grade}학년ㆍ${formatEnrollmentStatus(
                      profile.enrollment_status,
                    )}`
                  : '2학년ㆍ재학생'}
              </Text>
            </View>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName}>{profile?.name ?? '홍길동'}</Text>
              <Text style={styles.studentNumber}>
                ({profile?.student_number ?? '2022112736'})
              </Text>
            </View>
            <Text style={styles.profileDepartment}>
              미디어콘텐츠학부ㆍ
              {formatMajor(profile?.major ?? '영상미디어전공')}
            </Text>
          </View>
        </View>

        <View style={styles.sectionGap}>
          <SectionTitle title="내 신청 현황" />
          <View style={styles.requestSummary}>
            <RequestCount
              count={requestCounts.pending}
              label="신청 대기"
              tone="pending"
            />
            <View style={styles.requestDivider} />
            <RequestCount
              count={requestCounts.processing}
              label="처리 중"
              tone="processing"
            />
            <View style={styles.requestDivider} />
            <RequestCount
              count={requestCounts.completed}
              label="진행 완료"
              tone="completed"
            />
          </View>
        </View>

        <View style={styles.sectionGap}>
          <SectionTitle title="빠른 메뉴" />
          <View style={styles.quickMenu}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                accessibilityRole="button"
                onPress={() => handleQuickAction(action)}
                style={({ pressed }) => [
                  styles.quickAction,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.quickIconBox}>
                  <Image source={action.icon} style={styles.quickIcon} />
                </View>
                <Text style={styles.quickLabel}>{action.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.cardSection}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>학과 공지사항</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="공지사항 표시 설정"
              hitSlop={8}
              onPress={() => router.push('/notice-settings')}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Image source={menuIcon} style={styles.menuIcon} />
            </Pressable>
          </View>

          <View style={styles.noticeList}>
            {visibleNotices.map((notice, index) => (
              <Pressable
                key={notice.id}
                accessibilityRole="button"
                onPress={() => router.push(`/notices/${notice.id}`)}
                style={({ pressed }) => [
                  styles.noticeRow,
                  index < visibleNotices.length - 1 && styles.noticeDivider,
                  pressed && styles.noticePressed,
                ]}
              >
                <View style={styles.noticeTitleArea}>
                  {notice.urgent ? (
                    <Image source={sirenIcon} style={styles.sirenIcon} />
                  ) : null}
                  <Text numberOfLines={1} style={styles.noticeTitle}>
                    {notice.title}
                  </Text>
                </View>
                <Text style={styles.noticeDate}>
                  {formatNoticeDate(notice.publishedAt)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>일정</Text>
            <View style={styles.calendarHeaderActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const today = new Date();
                  setVisibleMonth(
                    new Date(today.getFullYear(), today.getMonth(), 1),
                  );
                  setSelectedDate(toDateKey(today));
                }}
                style={({ pressed }) => [
                  styles.todayButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.todayText}>오늘</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/schedule',
                    params: { date: toDateKey(new Date()) },
                  })
                }
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <Image source={menuIcon} style={styles.menuIcon} />
              </Pressable>
            </View>
          </View>

          <View style={styles.calendarBody}>
            <MonthCalendar
              eventDates={eventDates}
              month={visibleMonth}
              onChangeMonth={setVisibleMonth}
              onSelectDate={setSelectedDate}
              selectedDate={selectedDate}
              showMonthControls
            />
          </View>
        </View>

        <View style={styles.operationWrap}>
          <View style={styles.operationCard}>
            <View style={styles.operationIcon}>
              <Text style={styles.operationIconText}>i</Text>
            </View>
            <View style={styles.operationTextArea}>
              <Text style={styles.operationTitle}>방학 중 운영시간</Text>
              <Text style={styles.operationText}>
                평일 09:00 ~ 17:00ㆍ주말 및 공휴일 휴무
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="조교 문의"
            onPress={() => router.push('/assistant-inquiry')}
            style={({ pressed }) => [
              styles.floatingInquiry,
              pressed && styles.pressed,
            ]}
          >
            <Image source={assistantIcon} style={styles.floatingInquiryIcon} />
          </Pressable>
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
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setSelectedDate(null)}
        transparent
        visible={selectedDate !== null}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel="일정 메뉴 닫기"
            onPress={() => setSelectedDate(null)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.dateSheet}>
            <Text style={styles.dateSheetTitle}>
              {selectedDate ? formatSelectedDate(selectedDate) : ''}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="선택한 날짜에 일정 추가"
              onPress={() => {
                const date = selectedDate;
                setSelectedDate(null);
                if (date) {
                  router.push({ pathname: '/schedule', params: { date } });
                }
              }}
              style={({ pressed }) => [
                styles.addScheduleButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.addScheduleText}>+</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

function RequestCount({
  count,
  label,
  tone,
}: {
  count: number;
  label: string;
  tone: RequestStage;
}) {
  return (
    <View style={styles.requestCount}>
      <View style={styles.requestNumberRow}>
        <Text style={styles.requestNumber}>{count}</Text>
        <Text style={styles.requestUnit}>건</Text>
      </View>
      <View
        style={[
          styles.requestBadge,
          tone === 'pending' && styles.requestBadgePending,
          tone === 'processing' && styles.requestBadgeProcessing,
          tone === 'completed' && styles.requestBadgeCompleted,
        ]}
      >
        <Text
          style={[
            styles.requestBadgeText,
            tone === 'pending' && styles.requestTextPending,
            tone === 'processing' && styles.requestTextProcessing,
            tone === 'completed' && styles.requestTextCompleted,
          ]}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

function calculateRequestCounts(
  equipment: EquipmentRentalRequest | null,
  facility: FacilityReport | null,
  room: RoomReservationRequest | null,
  inquiry: AssistantInquiry | null,
) {
  const stages: RequestStage[] = [];

  if (equipment) {
    stages.push(
      equipment.status === 'submitted'
        ? 'pending'
        : equipment.status === 'returned' || equipment.status === 'rejected'
          ? 'completed'
          : 'processing',
    );
  }

  if (facility) {
    stages.push(
      facility.status === 'submitted'
        ? 'pending'
        : facility.status === 'resolved' || facility.status === 'rejected'
          ? 'completed'
          : 'processing',
    );
  }

  if (room) {
    stages.push(
      room.status === 'submitted'
        ? 'pending'
        : room.status === 'approved' || room.status === 'rejected'
          ? 'completed'
          : 'processing',
    );
  }

  if (inquiry) {
    stages.push(
      inquiry.status === 'submitted'
        ? 'pending'
        : inquiry.status === 'answered'
          ? 'completed'
          : 'processing',
    );
  }

  return {
    pending: stages.filter((stage) => stage === 'pending').length,
    processing: stages.filter((stage) => stage === 'processing').length,
    completed: stages.filter((stage) => stage === 'completed').length,
  };
}

function formatEnrollmentStatus(status: string) {
  return status === '재학' ? '재학생' : status;
}

function formatMajor(major: string) {
  return major === '영상미디어전공' ? '영상전공' : major;
}

function formatNoticeDate(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}.${`${date.getMonth() + 1}`.padStart(
    2,
    '0',
  )}.${`${date.getDate()}`.padStart(2, '0')}`;
}

function formatSelectedDate(dateKey: string) {
  const date = fromDateKey(dateKey);
  const weekday = new Intl.DateTimeFormat('ko-KR', {
    weekday: 'long',
  }).format(date);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${weekday}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    paddingLeft: 24,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 24,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    width: 18,
    height: 20,
    resizeMode: 'contain',
  },
  searchIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 7,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#182365',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  sectionTitleRow: {
    height: 23,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#000000',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 20,
  },
  profileEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  settingsIcon: {
    width: 12,
    height: 12,
    resizeMode: 'contain',
  },
  profileEditText: {
    color: '#9C9C9C',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
  },
  profileCard: {
    minHeight: 102,
    marginTop: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  profileAvatar: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  profileTextArea: {
    flex: 1,
    gap: 6,
  },
  profileBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 30,
    backgroundColor: 'rgba(184, 184, 184, 0.2)',
  },
  profileBadgeText: {
    color: '#182365',
    fontFamily: 'FreesentationRegular',
    fontSize: 10,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  profileName: {
    color: '#000000',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 16,
  },
  studentNumber: {
    color: '#000000',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
  },
  profileDepartment: {
    color: '#5C5C5C',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
  },
  sectionGap: {
    marginTop: 20,
  },
  requestSummary: {
    height: 96,
    marginTop: 8,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F2F2F2',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  requestCount: {
    flex: 1,
    alignItems: 'center',
    gap: 14,
  },
  requestNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },
  requestNumber: {
    color: '#000000',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 19,
  },
  requestUnit: {
    color: '#5C5C5C',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
  },
  requestDivider: {
    width: 1,
    height: 56,
    marginHorizontal: 16,
    backgroundColor: '#E5E5EA',
  },
  requestBadge: {
    width: '100%',
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  requestBadgePending: {
    backgroundColor: 'rgba(29, 86, 188, 0.1)',
  },
  requestBadgeProcessing: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  requestBadgeCompleted: {
    backgroundColor: '#E5E5EA',
  },
  requestBadgeText: {
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
  },
  requestTextPending: {
    color: '#1D56BC',
  },
  requestTextProcessing: {
    color: '#34C759',
  },
  requestTextCompleted: {
    color: '#8E8E93',
  },
  quickMenu: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  quickIconBox: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  quickIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  quickLabel: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
    textAlign: 'center',
  },
  cardSection: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: '#000000',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 20,
  },
  menuIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  noticeList: {
    marginTop: 24,
  },
  noticeRow: {
    minHeight: 35,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  noticeDivider: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  noticePressed: {
    opacity: 0.55,
  },
  noticeTitleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sirenIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  noticeTitle: {
    flex: 1,
    color: '#000000',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 16,
  },
  noticeDate: {
    marginTop: 2,
    color: '#8C8C8C',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
  },
  calendarCard: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  calendarHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  todayButton: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: '#000000',
    borderRadius: 30,
  },
  todayText: {
    color: '#000000',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
  },
  calendarBody: {
    marginTop: 24,
  },
  operationWrap: {
    marginTop: 20,
  },
  operationCard: {
    minHeight: 78,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderRadius: 16,
    backgroundColor: '#E9EBF8',
  },
  operationIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#172364',
  },
  operationIconText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationRegular',
    fontSize: 24,
  },
  operationTextArea: {
    flex: 1,
    gap: 5,
  },
  operationTitle: {
    color: '#000000',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 16,
  },
  operationText: {
    color: '#606060',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
  },
  floatingInquiry: {
    position: 'absolute',
    top: -15,
    right: 0,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#182365',
  },
  floatingInquiryIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  logoutButton: {
    alignSelf: 'center',
    marginTop: 16,
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
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  dateSheet: {
    minHeight: 162,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 36,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  dateSheetTitle: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  addScheduleButton: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#000000',
  },
  addScheduleText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
    lineHeight: 16,
  },
});
