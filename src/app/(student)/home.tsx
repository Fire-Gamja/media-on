import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  BackHandler,
  Image,
  type ImageSourcePropType,
  Modal,
  Linking,
  Platform,
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
import { AppIcon } from '../../components/common/AppIcon';
import { useNoticeSettings } from '../../context/notice-settings-context';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  type ApplicationStage,
  type ApplicationStatusItem,
  getApplicationStageCounts,
  getMyApplicationStatusItems,
} from '../../services/application-status';
import {
  getCurrentProfile,
  signOutUser,
  type StudentProfile,
} from '../../services/auth';
import { getPublishedNotices } from '../../services/notices';
import {
  getUnreadNotificationCount,
  subscribeToMyNotifications,
} from '../../services/notifications';
import {
  DEFAULT_OPERATING_HOURS,
  formatOperatingHours,
  getOperatingHoursSettings,
  type OperatingHoursSettings,
} from '../../services/operating-hours';
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
};

type HomeNotice = {
  id: string;
  title: string;
  publishedAt: string;
  urgent?: boolean;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'notice',
    title: '공지사항',
  },
  {
    id: 'equipment',
    title: '기자재 대여',
  },
  {
    id: 'room',
    title: '실습실 대여',
  },
  {
    id: 'report',
    title: '시설 신고',
  },
  {
    id: 'assistant',
    title: '조교 문의',
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
  const [applicationItems, setApplicationItems] = useState<
    ApplicationStatusItem[]
  >([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [operatingHours, setOperatingHours] =
    useState<OperatingHoursSettings>(DEFAULT_OPERATING_HOURS);
  const [showInstagram, setShowInstagram] = useState(false);

  const visibleNotices = notices.slice(0, Math.max(1, noticeCount));
  const requestCounts = useMemo(
    () => getApplicationStageCounts(applicationItems),
    [applicationItems],
  );
  const operatingHoursDisplay = useMemo(
    () => formatOperatingHours(operatingHours),
    [operatingHours],
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
            urgent: notice.is_urgent,
          })),
        ),
      )
      .catch(() => setNotices(FALLBACK_NOTICES));
  }, []);

  const refreshUnreadNotificationCount = useCallback(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    void getUnreadNotificationCount()
      .then(setUnreadNotificationCount)
      .catch(() => setUnreadNotificationCount(0));
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let isActive = true;

    void subscribeToMyNotifications(refreshUnreadNotificationCount).then(
      (nextUnsubscribe) => {
        if (isActive) {
          unsubscribe = nextUnsubscribe;
        } else {
          nextUnsubscribe();
        }
      },
    );

    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, [refreshUnreadNotificationCount]);

  useEffect(() => {
    const url = process.env.EXPO_PUBLIC_INSTAGRAM_URL;
    if (!url) return;
    const today = new Date().toISOString().slice(0, 10);
    void AsyncStorage.getItem('instagram-popup-hidden-date').then((hidden) => {
      if (hidden !== today) setShowInstagram(true);
    });
  }, []);

  useFocusEffect(useCallback(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp();
      return true;
    });
    return () => subscription.remove();
  }, []));

  useFocusEffect(
    useCallback(() => {
      void getStudentSchedules().then(setSchedules);
      void getOperatingHoursSettings().then(setOperatingHours);

      if (!isSupabaseConfigured) {
        return;
      }

      void Promise.all([
        getCurrentProfile(),
        getMyApplicationStatusItems(),
        getUnreadNotificationCount(),
      ])
        .then(([nextProfile, nextApplicationItems, nextUnreadCount]) => {
          setProfile(nextProfile);
          setApplicationItems(nextApplicationItems);
          setUnreadNotificationCount(nextUnreadCount);
        })
        .catch(() => {
          setProfile(null);
        });
    }, []),
  );

  const openInstagram = () => {
    const url = process.env.EXPO_PUBLIC_INSTAGRAM_URL;

    if (!url) {
      Alert.alert(
        '인스타그램 주소 확인',
        '학부 인스타그램 주소가 아직 설정되지 않았습니다.',
      );
      return;
    }

    void Linking.openURL(url);
  };

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
            {unreadNotificationCount > 0 ? (
              <View style={styles.notificationDot} />
            ) : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="기능 검색"
            hitSlop={6}
            onPress={() => router.push('/feature-search')}
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
          <Image
            source={
              profile?.avatar_url
                ? { uri: profile.avatar_url }
                : profileAvatar
            }
            style={styles.profileAvatar}
          />
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
              onPress={() =>
                router.push({
                  pathname: '/application-status',
                  params: { stage: 'pending' },
                })
              }
              tone="pending"
            />
            <View style={styles.requestDivider} />
            <RequestCount
              count={requestCounts.processing}
              label="처리 중"
              onPress={() =>
                router.push({
                  pathname: '/application-status',
                  params: { stage: 'processing' },
                })
              }
              tone="processing"
            />
            <View style={styles.requestDivider} />
            <RequestCount
              count={requestCounts.completed}
              label="진행 완료"
              onPress={() =>
                router.push({
                  pathname: '/application-status',
                  params: { stage: 'completed' },
                })
              }
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
                  <AppIcon name={action.id} size={34} />
                </View>
                <Text style={styles.quickLabel}>{action.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          accessibilityRole="link"
          onPress={openInstagram}
          style={({ pressed }) => [
            styles.instagramBanner,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.instagramLogo}>
            <View style={styles.instagramCamera}>
              <View style={styles.instagramLens} />
              <View style={styles.instagramDot} />
            </View>
          </View>
          <View style={styles.instagramBannerText}>
            <Text style={styles.instagramBannerTitle}>
              미디어콘텐츠학부 Instagram
            </Text>
            <Text style={styles.instagramBannerDescription}>
              행사와 학부 소식을 빠르게 확인해 보세요.
            </Text>
          </View>
          <Text style={styles.instagramChevron}>›</Text>
        </Pressable>

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
          <Pressable onPress={() => router.push('/notices')} style={styles.noticeMore}>
            <Text style={styles.noticeMoreText}>공지사항 더보기</Text>
          </Pressable>
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
              <Text style={styles.operationTitle}>
                {operatingHoursDisplay.title}
              </Text>
              <Text style={styles.operationText}>
                {operatingHoursDisplay.description}
              </Text>
            </View>
          </View>
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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="조교 문의하기"
        onPress={() => router.push('/assistant-inquiry')}
        style={({ pressed }) => [
          styles.floatingInquiry,
          pressed && styles.pressed,
        ]}
      >
        <Image source={assistantIcon} style={styles.floatingInquiryIcon} />
      </Pressable>

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
      <Modal animationType="fade" transparent visible={showInstagram}>
        <View style={styles.instagramBackdrop}><View style={styles.instagramCard}>
          <Text style={styles.instagramTitle}>학부 인스타그램</Text>
          <Text style={styles.instagramBody}>행사와 학부 소식을 인스타그램에서도 확인해 보세요.</Text>
          <Pressable onPress={() => { setShowInstagram(false); openInstagram(); }} style={styles.instagramPrimary}><Text style={styles.instagramPrimaryText}>인스타그램 열기</Text></Pressable>
          <Pressable onPress={() => setShowInstagram(false)} style={styles.instagramClose}><Text>닫기</Text></Pressable>
          <Pressable onPress={() => { void AsyncStorage.setItem('instagram-popup-hidden-date', new Date().toISOString().slice(0, 10)); setShowInstagram(false); }}><Text style={styles.instagramToday}>오늘 하루 보지 않기</Text></Pressable>
        </View></View>
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
  onPress,
  tone,
}: {
  count: number;
  label: string;
  onPress: () => void;
  tone: ApplicationStage;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.requestCount,
        pressed && styles.pressed,
      ]}
    >
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
    </Pressable>
  );
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
    paddingBottom: 100,
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
    borderRadius: 35,
    resizeMode: 'cover',
    backgroundColor: '#F0F0F0',
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
  instagramBanner: {
    minHeight: 78,
    marginTop: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F2F2F2',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  instagramLogo: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F6EAF4',
  },
  instagramCamera: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#A6388B',
    borderRadius: 7,
  },
  instagramLens: {
    width: 9,
    height: 9,
    borderWidth: 2,
    borderColor: '#A6388B',
    borderRadius: 5,
  },
  instagramDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#A6388B',
  },
  instagramBannerText: {
    flex: 1,
    marginLeft: 13,
  },
  instagramBannerTitle: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 15,
  },
  instagramBannerDescription: {
    marginTop: 5,
    color: '#777777',
    fontFamily: 'FreesentationRegular',
    fontSize: 11,
  },
  instagramChevron: {
    marginLeft: 8,
    color: '#8C8C8C',
    fontSize: 24,
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
  noticeMore: { height: 48, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#EEEEEE' },
  noticeMoreText: { color: '#182365', fontSize: 13, fontWeight: '800' },
  instagramBackdrop: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  instagramCard: { width: '100%', maxWidth: 380, padding: 24, borderRadius: 22, backgroundColor: '#FFFFFF' },
  instagramTitle: { color: '#2D2D2D', fontSize: 20, fontWeight: '900' },
  instagramBody: { marginTop: 10, color: '#777777', lineHeight: 21 },
  instagramPrimary: { height: 52, marginTop: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#182365' },
  instagramPrimaryText: { color: '#FFFFFF', fontWeight: '800' },
  instagramClose: { height: 44, alignItems: 'center', justifyContent: 'center' },
  instagramToday: { textAlign: 'center', color: '#999999', fontSize: 11 },
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
    zIndex: 10,
    right: 20,
    bottom: 22,
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    backgroundColor: '#182365',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  floatingInquiryIcon: {
    width: 27,
    height: 27,
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
