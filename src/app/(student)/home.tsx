import { router, useFocusEffect, useNavigation } from 'expo-router';
import { Image as SvgImage } from 'expo-image';
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
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import MonthCalendar, {
  fromDateKey,
  toDateKey,
} from '../../components/student/MonthCalendar';
import { AppIcon } from '../../components/common/AppIcon';
import { useNoticeSettings } from '../../context/notice-settings-context';
import { getProfileAvatarSource } from '../../lib/profile-avatar';
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
import { formatNoticeTitle, getPublishedNotices } from '../../services/notices';
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
  getActiveHomePopups,
  type HomePopup,
} from '../../services/home-popups';
import {
  getStudentSchedules,
  type StudentSchedule,
} from '../../services/student-schedule';
import {
  DEFAULT_PRE_GRADUATION_SETTINGS,
  getPreGraduationSettings,
  type PreGraduationSettings,
} from '../../services/pre-graduation';

const sirenIcon = require('../../../assets/figma/student/siren.png');

const homeIcons = {
  bell: require('../../../assets/figma/student-v2/bell.svg'),
  bookOpen: require('../../../assets/figma/student-v2/book-open.svg'),
  chevronRight: require('../../../assets/figma/student-v2/chervron-right.svg'),
  clock: require('../../../assets/figma/student-v2/clock.svg'),
  fileText: require('../../../assets/figma/student-v2/file-text.svg'),
  globe: require('../../../assets/figma/student-v2/globe.svg'),
  helpCircle: require('../../../assets/figma/student-v2/help-circle.svg'),
  instagram: require('../../../assets/figma/student-v2/instagram.svg'),
  logo: require('../../../assets/figma/student-v2/logo.svg'),
  menu: require('../../../assets/figma/student-v2/menu-settings.svg'),
  messageSquare: require('../../../assets/figma/student-v2/message-square.svg'),
  monitor: require('../../../assets/figma/student-v2/monitor.svg'),
  noticeBanner: require('../../../assets/figma/student-v2/notice-banner-icon.svg'),
  search: require('../../../assets/figma/student-v2/search.svg'),
  settings: require('../../../assets/figma/student-v2/settings.svg'),
  settingsSmall: require('../../../assets/figma/student-v2/settings-icon.svg'),
  tool: require('../../../assets/figma/student-v2/tool.svg'),
  toolbox: require('../../../assets/figma/student-v2/toolbox.svg'),
  xCircle: require('../../../assets/figma/student-v2/x-circle.svg'),
} as const;

type QuickAction = {
  id:
    | 'notice'
    | 'equipment'
    | 'room'
    | 'report'
    | 'preGraduation'
    | 'assistant'
    | 'faq'
    | 'language';
  title: string;
  icon: ImageSourcePropType;
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
    icon: homeIcons.fileText,
  },
  {
    id: 'equipment',
    title: '기자재 대여',
    icon: homeIcons.tool,
  },
  {
    id: 'room',
    title: '실습실 대여',
    icon: homeIcons.monitor,
  },
  {
    id: 'report',
    title: '시설 신고',
    icon: homeIcons.toolbox,
  },
  {
    id: 'preGraduation',
    title: '예비졸업사정',
    icon: homeIcons.bookOpen,
  },
  {
    id: 'assistant',
    title: '조교 문의',
    icon: homeIcons.messageSquare,
  },
  {
    id: 'faq',
    title: '자주 묻는 질문',
    icon: homeIcons.helpCircle,
  },
  {
    id: 'language',
    title: '언어 설정',
    icon: homeIcons.globe,
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
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
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
  const [operatingHours, setOperatingHours] = useState<OperatingHoursSettings>(
    DEFAULT_OPERATING_HOURS,
  );
  const [homePopups, setHomePopups] = useState<HomePopup[]>([]);
  const [popupIndex, setPopupIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStudentId, setShowStudentId] = useState(false);
  const [isOperatingNoticeHidden, setIsOperatingNoticeHidden] =
    useState(false);
  const [isPreGraduationNoticeHidden, setIsPreGraduationNoticeHidden] =
    useState(false);
  const [preGraduationSettings, setPreGraduationSettings] =
    useState<PreGraduationSettings>(DEFAULT_PRE_GRADUATION_SETTINGS);

  const visibleNotices = useMemo(
    () =>
      [...notices]
        .sort(
          (left, right) =>
            Number(Boolean(right.urgent)) - Number(Boolean(left.urgent)),
        )
        .slice(0, Math.max(1, noticeCount)),
    [noticeCount, notices],
  );
  const requestCounts = useMemo(
    () => getApplicationStageCounts(applicationItems),
    [applicationItems],
  );
  const operatingHoursDisplay = useMemo(
    () => formatOperatingHours(operatingHours),
    [operatingHours],
  );
  const isPreGraduationOpen =
    profile?.grade === 4 &&
    preGraduationSettings.access_enabled &&
    preGraduationSettings.enabled_weekdays.length > 0;
  const isPreGraduationDay =
    isPreGraduationOpen &&
    preGraduationSettings.enabled_weekdays.some(
      (weekday) => weekday === new Date().getDay(),
    );
  const eventDates = useMemo(
    () => {
      const dates = new Set(schedules.map((schedule) => schedule.startDate));
      if (isPreGraduationDay) {
        dates.add(getLocalDateKey());
      }
      return dates;
    }, [isPreGraduationDay, schedules],
  );
  const currentHomePopup = homePopups[popupIndex] ?? null;
  const selectedSchedule = schedules.find((schedule) => {
    const targetDate = selectedDate ?? getLocalDateKey();
    return schedule.startDate <= targetDate && schedule.endDate >= targetDate;
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    void getPublishedNotices(7)
      .then((data) =>
        setNotices(
          data.map((notice) => ({
            id: notice.id,
            title: formatNoticeTitle(notice.title, notice.is_urgent),
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
    if (!isSupabaseConfigured) {
      return;
    }

    void getActiveHomePopups()
      .then(async (data) => {
        const today = getLocalDateKey();
        const visiblePopups = (
          await Promise.all(
            data.map(async (popup) => {
              const hiddenValue = await AsyncStorage.getItem(
                getHomePopupStorageKey(popup),
              );
              return hiddenValue === today ? null : popup;
            }),
          )
        ).filter((popup): popup is HomePopup => popup !== null);

        setPopupIndex(0);
        setHomePopups(visiblePopups);
      })
      .catch(() => {
        setHomePopups([]);
      });
  }, []);

  const confirmAppExit = useCallback(() => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        '앱 종료',
        'iOS에서는 앱을 직접 종료할 수 없습니다. 홈 화면으로 이동한 뒤 앱 전환기에서 MEDIA ON을 닫아 주세요.',
        [{ text: '확인' }],
      );
      return;
    }

    Alert.alert('앱 종료', 'MEDIA ON을 종료하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '종료',
        style: 'destructive',
        onPress: () => BackHandler.exitApp(),
      },
    ]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const hardwareSubscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          confirmAppExit();
          return true;
        },
      );
      const navigationSubscription = navigation.addListener(
        'beforeRemove',
        (event) => {
          if (event.data.action.type !== 'GO_BACK') {
            return;
          }
          event.preventDefault();
          confirmAppExit();
        },
      );

      return () => {
        hardwareSubscription.remove();
        navigationSubscription();
      };
    }, [confirmAppExit, navigation]),
  );

  useFocusEffect(
    useCallback(() => {
      void getStudentSchedules().then(setSchedules);
      void getOperatingHoursSettings().then(setOperatingHours);
      void getPreGraduationSettings()
        .then(setPreGraduationSettings)
        .catch(() => setPreGraduationSettings(DEFAULT_PRE_GRADUATION_SETTINGS));

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

  const openInstagram = async () => {
    const url =
      process.env.EXPO_PUBLIC_INSTAGRAM_URL?.trim() ||
      'https://www.instagram.com/swu_mediacontents/';

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        '인스타그램 열기 실패',
        '브라우저에서 학부 인스타그램을 열지 못했습니다.',
      );
    }
  };

  const dismissHomePopup = async (hideToday: boolean) => {
    if (!currentHomePopup) {
      return;
    }

    if (hideToday) {
      const today = getLocalDateKey();
      await AsyncStorage.multiSet(
        homePopups.map((popup) => [getHomePopupStorageKey(popup), today]),
      );
      setHomePopups([]);
      setPopupIndex(0);
      return;
    }

    if (popupIndex < homePopups.length - 1) {
      setPopupIndex((current) => current + 1);
    } else {
      setHomePopups([]);
      setPopupIndex(0);
    }
  };

  const openHomePopupLink = async () => {
    const url = currentHomePopup?.action_url;
    if (!url) {
      return;
    }

    await dismissHomePopup(false);

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('링크 열기 실패', '등록된 이벤트 링크를 열 수 없습니다.');
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.id === 'preGraduation') {
      openPreGraduation();
      return;
    }

    const routes = {
      notice: '/notices',
      equipment: '/equipment',
      room: '/rooms',
      report: '/facility-report',
      assistant: '/assistant-inquiry',
      faq: '/frequently-asked-questions',
      language: '/settings',
    } as const;

    router.push(routes[action.id]);
  };

  const openPreGraduation = () => {
    if (!profile) {
      Alert.alert('정보 확인 중', '학생 정보를 확인한 뒤 다시 시도해 주세요.');
      return;
    }

    if (profile.grade !== 4) {
      Alert.alert(
        '4학년 전용',
        '예비졸업사정 신청은 4학년 학생만 이용할 수 있습니다.',
      );
      return;
    }

    if (
      !preGraduationSettings.access_enabled ||
      preGraduationSettings.enabled_weekdays.length === 0
    ) {
      Alert.alert(
        '신청 기간 아님',
        '관리자가 예비졸업사정 신청을 열면 이용할 수 있습니다.',
      );
      return;
    }

    router.push('/pre-graduation');
  };

  const refreshHome = async () => {
    setIsRefreshing(true);

    try {
      const [nextSchedules, nextHours] = await Promise.all([
        getStudentSchedules(),
        getOperatingHoursSettings(),
      ]);
      setSchedules(nextSchedules);
      setOperatingHours(nextHours);

      if (isSupabaseConfigured) {
        const preGraduationSettingsPromise = getPreGraduationSettings().catch(
          () => DEFAULT_PRE_GRADUATION_SETTINGS,
        );
        const [
          nextProfile,
          nextApplicationItems,
          nextUnreadCount,
          nextNotices,
        ] = await Promise.all([
          getCurrentProfile(),
          getMyApplicationStatusItems(),
          getUnreadNotificationCount(),
          getPublishedNotices(7),
        ]);
        setProfile(nextProfile);
        setApplicationItems(nextApplicationItems);
        setUnreadNotificationCount(nextUnreadCount);
        setPreGraduationSettings(await preGraduationSettingsPromise);
        setNotices(
          nextNotices.map((notice) => ({
            id: notice.id,
            title: formatNoticeTitle(notice.title, notice.is_urgent),
            publishedAt: notice.published_at ?? notice.created_at,
            urgent: notice.is_urgent,
          })),
        );
      }
    } finally {
      setIsRefreshing(false);
    }
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
        <SvgImage
          accessibilityLabel="MEDIA ON"
          contentFit="contain"
          source={homeIcons.logo}
          style={styles.headerLogo}
        />
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
            <SvgImage
              contentFit="contain"
              source={homeIcons.bell}
              style={styles.headerIcon}
            />
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
            <SvgImage
              contentFit="contain"
              source={homeIcons.search}
              style={styles.headerIcon}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="설정"
            hitSlop={6}
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <SvgImage
              contentFit="contain"
              source={homeIcons.settings}
              style={styles.headerIcon}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={['#182365']}
            onRefresh={() => void refreshHome()}
            refreshing={isRefreshing}
            tintColor="#182365"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.noticeBanners}>
          {!isOperatingNoticeHidden ? (
            <View style={styles.noticeBanner}>
              <SvgImage
                contentFit="contain"
                source={homeIcons.noticeBanner}
                style={styles.noticeBannerInfo}
              />
              <Text numberOfLines={1} style={styles.noticeBannerText}>
                {operatingHoursDisplay.title} ·{' '}
                {operatingHoursDisplay.description.replace('ㆍ', ' · ')}
              </Text>
              <Pressable
                accessibilityLabel="운영시간 안내 닫기"
                hitSlop={8}
                onPress={() => setIsOperatingNoticeHidden(true)}
              >
                <SvgImage
                  contentFit="contain"
                  source={homeIcons.xCircle}
                  style={styles.noticeBannerClose}
                />
              </Pressable>
            </View>
          ) : null}
          {isPreGraduationDay && !isPreGraduationNoticeHidden ? (
            <View style={[styles.noticeBanner, styles.preGraduationNotice]}>
              <View style={styles.preGraduationNoticeInfo}>
                <Text style={styles.preGraduationNoticeInfoText}>i</Text>
              </View>
              <Text
                numberOfLines={1}
                style={[styles.noticeBannerText, styles.preGraduationNoticeText]}
              >
                오늘은 예비졸업사정 예약일입니다. 오전 10:20에 시작됩니다.
              </Text>
              <Pressable
                accessibilityLabel="예비졸업사정 안내 닫기"
                hitSlop={8}
                onPress={() => setIsPreGraduationNoticeHidden(true)}
              >
                <SvgImage
                  contentFit="contain"
                  source={homeIcons.xCircle}
                  style={styles.noticeBannerClose}
                />
              </Pressable>
            </View>
          ) : null}
        </View>

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
              <SvgImage
                contentFit="contain"
                source={homeIcons.settingsSmall}
                style={styles.settingsIcon}
              />
              <Text style={styles.profileEditText}>정보 변경</Text>
            </Pressable>
          }
          title="내 정보"
        />

        <Pressable
          accessibilityLabel="모바일 학생증 보기"
          onPress={() => setShowStudentId(true)}
          style={({ pressed }) => [
            styles.profileCard,
            pressed && styles.pressed,
          ]}
        >
          <Image
            source={getProfileAvatarSource(profile?.avatar_url)}
            style={styles.profileAvatar}
          />
          <View style={styles.profileTextArea}>
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>
                {profile
                  ? `${profile.grade}학년 · ${formatEnrollmentStatus(
                      profile.enrollment_status,
                    )}`
                  : '4학년 · 재학생'}
              </Text>
            </View>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName}>
                {profile?.name ?? '홍길동'}
              </Text>
              <Text style={styles.studentNumber}>
                ({profile?.student_number ?? '2022112736'})
              </Text>
            </View>
            <Text style={styles.profileDepartment}>
              미디어콘텐츠학부 · {profile?.major ?? '멀티미디어전공'}
            </Text>
          </View>
        </Pressable>

        <View style={styles.requestSummary}>
          <View style={styles.requestSummaryTitleRow}>
            <Text style={styles.requestSummaryTitle}>내 신청 현황</Text>
          </View>
          <View style={styles.requestCountRow}>
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

        <View style={styles.mainSection}>
          <SectionTitle
            action={
              <SvgImage
                contentFit="contain"
                source={homeIcons.menu}
                style={styles.sectionMenuIcon}
              />
            }
            title="빠른 메뉴"
          />
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
                  <SvgImage
                    contentFit="contain"
                    source={action.icon}
                    style={styles.quickIcon}
                  />
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
            <SvgImage
              contentFit="contain"
              source={homeIcons.instagram}
              style={styles.instagramIcon}
            />
          </View>
          <View style={styles.instagramBannerText}>
            <Text style={styles.instagramBannerTitle}>
              미디어콘텐츠학부 Instagram
            </Text>
            <Text style={styles.instagramBannerDescription}>
              학부와 학교 소식을 빠르게 확인해 보세요.
            </Text>
          </View>
          <SvgImage
            contentFit="contain"
            source={homeIcons.chevronRight}
            style={styles.instagramChevron}
          />
        </Pressable>

        <View style={styles.noticeSection}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>학부 공지사항</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="공지사항 표시 설정"
              hitSlop={8}
              onPress={() => router.push('/notice-settings')}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <SvgImage
                contentFit="contain"
                source={homeIcons.menu}
                style={styles.menuIcon}
              />
            </Pressable>
          </View>

          <View style={styles.noticeCard}>
            <View style={styles.noticeList}>
              {visibleNotices.map((notice) => (
                <Pressable
                  key={notice.id}
                  accessibilityRole="button"
                  onPress={() => router.push(`/notices/${notice.id}`)}
                  style={({ pressed }) => [
                    styles.noticeRow,
                    pressed && styles.noticePressed,
                  ]}
                >
                  <View style={styles.noticeTitleArea}>
                    {notice.urgent ? (
                      <Image source={sirenIcon} style={styles.sirenIcon} />
                    ) : null}
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.noticeTitle,
                        notice.urgent && styles.noticeTitleUrgent,
                      ]}
                    >
                      {notice.title}
                    </Text>
                  </View>
                  <Text style={styles.noticeDate}>
                    {formatNoticeDate(notice.publishedAt)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => router.push('/notices')}
              style={styles.noticeMore}
            >
              <Text style={styles.noticeMoreText}>공지사항 전체보기</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.scheduleSection}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>일정</Text>
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
              <SvgImage
                contentFit="contain"
                source={homeIcons.menu}
                style={styles.menuIcon}
              />
            </Pressable>
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
            {isPreGraduationDay || selectedSchedule ? (
              <View style={styles.calendarEvent}>
                <View style={styles.calendarEventBar} />
                <View style={styles.calendarEventText}>
                  <Text style={styles.calendarEventTitle}>
                    {isPreGraduationDay
                      ? '4학년 예비졸업사정'
                      : selectedSchedule?.title}
                  </Text>
                  <Text style={styles.calendarEventTime}>
                    {isPreGraduationDay
                      ? '10:20'
                      : selectedSchedule?.allDay
                        ? '하루 종일'
                        : selectedSchedule?.startTime}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.operationWrap}>
          <View style={styles.operationCard}>
            <View style={styles.operationIcon}>
              <SvgImage
                contentFit="contain"
                source={homeIcons.clock}
                style={styles.operationIconImage}
              />
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
          { bottom: Math.max(insets.bottom + 20, 46) },
          pressed && styles.pressed,
        ]}
      >
        <AppIcon color="#FFFFFF" monochrome name="assistant" size={29} />
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
      <Modal
        animationType="fade"
        onRequestClose={() => void dismissHomePopup(false)}
        transparent
        visible={currentHomePopup !== null}
      >
        <View style={styles.homePopupBackdrop}>
          <View style={styles.homePopupCard}>
            {homePopups.length > 1 ? (
              <Text style={styles.homePopupCount}>
                {popupIndex + 1} / {homePopups.length}
              </Text>
            ) : null}
            {currentHomePopup?.image_url ? (
              <Image
                source={{ uri: currentHomePopup.image_url }}
                style={styles.homePopupImage}
              />
            ) : null}
            <Text style={styles.homePopupTitle}>{currentHomePopup?.title}</Text>
            <Text style={styles.homePopupBody}>{currentHomePopup?.body}</Text>
            {currentHomePopup?.action_url ? (
              <Pressable
                onPress={() => void openHomePopupLink()}
                style={styles.homePopupPrimary}
              >
                <Text style={styles.homePopupPrimaryText}>
                  {currentHomePopup.action_label || '자세히 보기'}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => void dismissHomePopup(false)}
              style={styles.homePopupClose}
            >
              <Text style={styles.homePopupCloseText}>
                {popupIndex < homePopups.length - 1 ? '다음' : '닫기'}
              </Text>
            </Pressable>
            <Pressable onPress={() => void dismissHomePopup(true)}>
              <Text style={styles.homePopupToday}>오늘 하루 보지 않기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        onRequestClose={() => setShowStudentId(false)}
        transparent
        visible={showStudentId}
      >
        <View style={styles.studentIdBackdrop}>
          <Pressable
            accessibilityLabel="학생증 닫기"
            onPress={() => setShowStudentId(false)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.studentIdCard}>
            <View style={styles.studentIdHeader}>
              <Text style={styles.studentIdBrand}>SEOWON UNIVERSITY</Text>
              <Text style={styles.studentIdType}>STUDENT ID</Text>
            </View>
            <Image
              source={getProfileAvatarSource(profile?.avatar_url)}
              style={styles.studentIdPhoto}
            />
            <Text style={styles.studentIdName}>{profile?.name ?? '학생'}</Text>
            <Text style={styles.studentIdNumber}>
              {profile?.student_number ?? '학번 미확인'}
            </Text>
            <View style={styles.studentIdDivider} />
            <Text style={styles.studentIdDepartment}>미디어콘텐츠학부</Text>
            <Text style={styles.studentIdMeta}>
              {profile
                ? `${profile.grade}학년 · ${formatMajor(profile.major)} · ${formatEnrollmentStatus(profile.enrollment_status)}`
                : '학생 정보 확인 중'}
            </Text>
            <Pressable
              onPress={() => setShowStudentId(false)}
              style={styles.studentIdClose}
            >
              <Text style={styles.studentIdCloseText}>닫기</Text>
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
      style={({ pressed }) => [styles.requestCount, pressed && styles.pressed]}
    >
      <Text style={styles.requestLabel}>{label}</Text>
      <View style={styles.requestNumberRow}>
        <Text
          style={[
            styles.requestNumber,
            tone === 'processing' && styles.requestNumberProcessing,
            tone === 'completed' && styles.requestNumberCompleted,
          ]}
        >
          {count}
        </Text>
        <Text
          style={[
            styles.requestUnit,
            tone === 'processing' && styles.requestNumberProcessing,
            tone === 'completed' && styles.requestNumberCompleted,
          ]}
        >
          건
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

function getLocalDateKey() {
  const date = new Date();
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(
    2,
    '0',
  )}-${`${date.getDate()}`.padStart(2, '0')}`;
}

function getHomePopupStorageKey(popup: HomePopup) {
  return `media-on:home-popup:${popup.slot_number}:${popup.updated_at}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FEFEFF',
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECEF',
    backgroundColor: '#FFFFFF',
  },
  headerLogo: {
    width: 24,
    height: 24,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    width: 22,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 22,
    height: 22,
  },
  notificationDot: {
    position: 'absolute',
    top: 3,
    right: -1,
    width: 6,
    height: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 3,
    backgroundColor: '#3550FF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FEFEFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  noticeBanners: {
    marginBottom: 8,
    gap: 8,
  },
  noticeBanner: {
    minHeight: 36,
    paddingHorizontal: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  noticeBannerInfo: {
    width: 16,
    height: 16,
  },
  noticeBannerText: {
    flex: 1,
    color: '#3550FF',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 11,
  },
  noticeBannerClose: {
    width: 12,
    height: 12,
  },
  preGraduationNotice: {
    backgroundColor: '#FFF5E5',
  },
  preGraduationNoticeInfo: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#ED8C24',
  },
  preGraduationNoticeInfoText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 10,
    lineHeight: 13,
  },
  preGraduationNoticeText: {
    color: '#B2660D',
  },
  sectionTitleRow: {
    minHeight: 38,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#1E2024',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
  },
  profileEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  settingsIcon: {
    width: 14,
    height: 14,
  },
  profileEditText: {
    color: '#9CA3B5',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
  },
  profileCard: {
    minHeight: 88,
    marginTop: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#EAECEF',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    resizeMode: 'cover',
    backgroundColor: '#F0F0F0',
  },
  profileTextArea: {
    flex: 1,
    gap: 4,
  },
  profileBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F5F6FA',
  },
  profileBadgeText: {
    color: '#50545E',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 10,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  profileName: {
    color: '#1E2024',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 16,
  },
  studentNumber: {
    color: '#9CA3B5',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
  },
  profileDepartment: {
    color: '#9CA3B5',
    fontFamily: 'FreesentationRegular',
    fontSize: 11,
  },
  mainSection: {
    marginTop: 16,
  },
  requestSummary: {
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAECEF',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  requestSummaryTitleRow: {
    paddingVertical: 8,
  },
  requestSummaryTitle: {
    color: '#1E2024',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
  },
  requestCountRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestCount: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 70,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F6FA',
  },
  requestLabel: {
    color: '#50545E',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
  },
  requestNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  requestNumber: {
    color: '#000000',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
  },
  requestUnit: {
    color: '#000000',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 14,
  },
  requestNumberProcessing: { color: '#3550FF' },
  requestNumberCompleted: { color: '#A9A9A9' },
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
    marginTop: 12,
    paddingHorizontal: 0,
    paddingVertical: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 20,
    borderWidth: 1,
    borderColor: '#EAECEF',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  quickAction: {
    width: '25%',
    alignItems: 'center',
    gap: 8,
  },
  quickIconBox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAECEF',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  quickIcon: {
    width: 24,
    height: 24,
  },
  quickLabel: {
    color: '#50545E',
    fontFamily: 'FreesentationRegular',
    fontSize: 11,
    textAlign: 'center',
  },
  sectionMenuIcon: {
    width: 18,
    height: 4,
  },
  instagramBanner: {
    minHeight: 72,
    marginTop: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  instagramLogo: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F6EAF4',
  },
  instagramBannerText: {
    flex: 1,
    marginLeft: 12,
  },
  instagramBannerTitle: {
    color: '#1E2024',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 14,
  },
  instagramBannerDescription: {
    marginTop: 2,
    color: '#9CA3B5',
    fontFamily: 'FreesentationRegular',
    fontSize: 11,
  },
  instagramChevron: {
    marginLeft: 8,
    width: 14,
    height: 14,
  },
  instagramIcon: {
    width: 22,
    height: 22,
  },
  preGraduationBanner: {
    minHeight: 78,
    marginTop: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E7F4',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  preGraduationLogo: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#ECEEF8',
  },
  preGraduationBannerText: {
    flex: 1,
    marginLeft: 13,
  },
  preGraduationBannerTitle: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 15,
  },
  preGraduationBannerDescription: {
    marginTop: 5,
    color: '#777777',
    fontFamily: 'FreesentationRegular',
    fontSize: 11,
  },
  preGraduationStatus: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  preGraduationStatusOpen: {
    backgroundColor: '#E9F8ED',
  },
  preGraduationStatusClosed: {
    backgroundColor: '#F1F2F5',
  },
  preGraduationStatusText: {
    fontFamily: 'FreesentationSemiBold',
    fontSize: 10,
  },
  preGraduationStatusTextOpen: {
    color: '#16A34A',
  },
  preGraduationStatusTextClosed: {
    color: '#8C8C8C',
  },
  preGraduationChevron: {
    marginLeft: 6,
    color: '#8C8C8C',
    fontSize: 24,
  },
  noticeSection: {
    marginTop: 16,
  },
  cardHeader: {
    minHeight: 38,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: '#1E2024',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
  },
  menuIcon: {
    width: 18,
    height: 4,
  },
  noticeCard: {
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAECEF',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  noticeList: {
    gap: 4,
  },
  noticeMore: {
    minHeight: 32,
    paddingTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeMoreText: {
    color: '#000000',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 12,
  },
  homePopupBackdrop: {
    flex: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  homePopupCard: {
    width: '100%',
    maxWidth: 380,
    padding: 24,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  homePopupCount: {
    marginBottom: 9,
    color: '#182365',
    fontSize: 12,
    fontWeight: '800',
  },
  homePopupImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginBottom: 18,
    borderRadius: 14,
    resizeMode: 'cover',
    backgroundColor: '#F0F0F0',
  },
  homePopupTitle: { color: '#2D2D2D', fontSize: 20, fontWeight: '900' },
  homePopupBody: {
    marginTop: 10,
    color: '#777777',
    fontSize: 14,
    lineHeight: 21,
  },
  homePopupPrimary: {
    height: 52,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#182365',
  },
  homePopupPrimaryText: { color: '#FFFFFF', fontWeight: '800' },
  homePopupClose: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homePopupCloseText: { color: '#2D2D2D', fontWeight: '700' },
  homePopupToday: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 11,
  },
  studentIdBackdrop: {
    flex: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  studentIdCard: {
    width: '100%',
    maxWidth: 350,
    padding: 25,
    alignItems: 'center',
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
  },
  studentIdHeader: {
    width: '100%',
    marginBottom: 22,
    alignItems: 'center',
  },
  studentIdBrand: {
    color: '#182365',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 15,
    letterSpacing: 1.2,
  },
  studentIdType: {
    marginTop: 4,
    color: '#858A9A',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 10,
    letterSpacing: 2,
  },
  studentIdPhoto: {
    width: 104,
    height: 104,
    borderWidth: 4,
    borderColor: '#E9EBF8',
    borderRadius: 52,
    resizeMode: 'cover',
    backgroundColor: '#F0F0F0',
  },
  studentIdName: {
    marginTop: 18,
    color: '#111827',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 25,
  },
  studentIdNumber: {
    marginTop: 5,
    color: '#5C6375',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 15,
  },
  studentIdDivider: {
    width: '100%',
    height: 1,
    marginVertical: 20,
    backgroundColor: '#E5E7EB',
  },
  studentIdDepartment: {
    color: '#182365',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 17,
  },
  studentIdMeta: {
    marginTop: 7,
    color: '#6B7280',
    fontFamily: 'FreesentationRegular',
    fontSize: 13,
  },
  studentIdClose: {
    width: '100%',
    height: 48,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#182365',
  },
  studentIdCloseText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 15,
  },
  noticeRow: {
    minHeight: 28,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  noticePressed: {
    opacity: 0.55,
  },
  noticeTitleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sirenIcon: {
    width: 10,
    height: 10,
    resizeMode: 'contain',
  },
  noticeTitle: {
    flex: 1,
    color: '#1E2024',
    fontFamily: 'FreesentationRegular',
    fontSize: 13,
  },
  noticeTitleUrgent: {
    fontFamily: 'FreesentationSemiBold',
  },
  noticeDate: {
    color: '#9CA3B5',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
  },
  scheduleSection: {
    marginTop: 16,
  },
  calendarBody: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: '#EAECEF',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  calendarEvent: {
    marginTop: 16,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EAECEF',
  },
  calendarEventBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
    backgroundColor: '#3550FF',
  },
  calendarEventText: {
    flex: 1,
    gap: 2,
  },
  calendarEventTitle: {
    color: '#1E2024',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 13,
  },
  calendarEventTime: {
    color: '#9CA3B5',
    fontFamily: 'FreesentationRegular',
    fontSize: 11,
  },
  operationWrap: {
    marginTop: 16,
  },
  operationCard: {
    minHeight: 64,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    backgroundColor: '#EBF0FF',
  },
  operationIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#3550FF',
  },
  operationIconImage: {
    width: 16,
    height: 16,
  },
  operationTextArea: {
    flex: 1,
    gap: 2,
  },
  operationTitle: {
    color: '#1E2024',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 13,
  },
  operationText: {
    color: '#50545E',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
  },
  floatingInquiry: {
    position: 'absolute',
    zIndex: 10,
    right: 17,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#141E46',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
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
