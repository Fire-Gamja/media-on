import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/colors';
import { useNoticeSettings } from '../../context/notice-settings-context';

type QuickAction = {
  id: 'notice' | 'equipment' | 'room' | 'report';
  icon: string;
  title: string;
  description: string;
  iconBackground: string;
};

type Notice = {
  id: string;
  title: string;
};

type RequestItem = {
  id: string;
  type: string;
  title: string;
  status: string;
  detail: string;
  statusBackground: string;
  statusColor: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'notice',
    icon: '📢',
    title: '공지사항',
    description: '학부·학사 소식',
    iconBackground: '#E8EDFF',
  },
  {
    id: 'equipment',
    icon: '📷',
    title: '기자재 대여',
    description: '재고 확인·신청',
    iconBackground: '#FFF3E7',
  },
  {
    id: 'room',
    icon: '🏫',
    title: '실습실 대여',
    description: '일정 확인·안내',
    iconBackground: '#EAF8F0',
  },
  {
    id: 'report',
    icon: '🛠️',
    title: '시설 신고',
    description: '고장·불편 접수',
    iconBackground: '#FCECEF',
  },
];

const NOTICES: Notice[] = [
  {
    id: 'notice-1',
    title: '2026년 대한민국 인재상 홍보(한국장학재단)',
  },
  {
    id: 'notice-2',
    title: '2026학년도 2학기 세명대학교 학점교류 수학 안내',
  },
  {
    id: 'notice-3',
    title: '2026학년도 2학기 한국교원대학교 수학 안내',
  },
  {
    id: 'notice-4',
    title: '2026학년도 2학기 수강신청 일정 안내',
  },
  {
    id: 'notice-5',
    title: '미디어문화학부 졸업작품 전시 일정 안내',
  },
  {
    id: 'notice-6',
    title: '301호·501호 실습실 포맷 작업 안내',
  },
  {
    id: 'notice-7',
    title: '방학 중 학부 사무실 운영시간 안내',
  },
];

const REQUESTS: RequestItem[] = [
  {
    id: 'request-equipment',
    type: '기자재 대여',
    title: 'DSLR 카메라 1대',
    status: '준비 중',
    detail: '수령 예정 · 7월 22일 10:00',
    statusBackground: '#FFF3DB',
    statusColor: '#9A5B00',
  },
  {
    id: 'request-facility',
    type: '시설 신고',
    title: '301호 인터넷 연결 불량',
    status: '접수 완료',
    detail: '접수일 · 7월 20일',
    statusBackground: '#E8EDFF',
    statusColor: COLORS.navy,
  },
  {
    id: 'request-room',
    type: '실습실 대여',
    title: '501호 14:00~16:00',
    status: '확인 완료',
    detail: '이용 예정 · 7월 23일',
    statusBackground: '#EAF8F0',
    statusColor: '#167447',
  },
  {
    id: 'request-assistant',
    type: '조교 문의',
    title: '수강 관련 문의',
    status: '답변 대기',
    detail: '문의일 · 7월 20일',
    statusBackground: '#F1F2F6',
    statusColor: COLORS.subText,
  },
];

export default function HomeScreen() {
  const { noticeCount } = useNoticeSettings();
  const visibleNotices = NOTICES.slice(0, noticeCount);

  const handleQuickAction = (action: QuickAction) => {
    Alert.alert(
      action.title,
      `${action.title} 화면은 다음 단계에서 연결합니다.`,
    );
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => router.replace('/login'),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.topBar}>
            <Text style={styles.brand}>MEDIA ON</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="로그아웃"
              hitSlop={10}
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.logoutText}>로그아웃</Text>
            </Pressable>
          </View>

          <View style={styles.topOperationBar}>
            <Text
              style={styles.topOperationText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
            >
              방학 중 운영 시간  평일 09:00~17:00  주말 및 공휴일 휴무
            </Text>
          </View>

          <View style={styles.greetingRow}>
            <View style={styles.greetingTextArea}>
              <Text style={styles.greeting}>학생님, 안녕하세요!</Text>
              <Text style={styles.greetingDescription}>
                오늘의 학부 소식과 신청 현황을 확인해 보세요.
              </Text>
            </View>

            <View style={styles.avatar}>
              <Text style={styles.avatarText}>학</Text>
            </View>
          </View>

          <View style={styles.profileMeta}>
            <View style={styles.profileChip}>
              <Text style={styles.profileChipText}>4학년</Text>
            </View>
            <Text style={styles.profileInfo}>재학 · 학생 계정</Text>
          </View>
        </View>

        <View style={styles.content}>
          <SectionHeader
            title="빠른 메뉴"
            description="자주 사용하는 메뉴를 바로 이용해 보세요."
          />

          <View style={styles.actionGrid}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                accessibilityRole="button"
                onPress={() => handleQuickAction(action)}
                style={({ pressed }) => [
                  styles.actionCard,
                  pressed && styles.cardPressed,
                ]}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: action.iconBackground },
                  ]}
                >
                  <Text style={styles.actionIconText}>{action.icon}</Text>
                </View>

                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>
                  {action.description}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionSpacing}>
            <View style={styles.noticeCard}>
              <View style={styles.noticeCardHeader}>
                <Text style={styles.noticeHeading}>학과 공지사항</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="공지사항 표시 건수 설정"
                  hitSlop={10}
                  onPress={() => router.push('/notice-settings')}
                  style={({ pressed }) => [
                    styles.noticeMenuButton,
                    pressed && styles.noticePressed,
                  ]}
                >
                  <Text style={styles.noticeMenuDots}>•••</Text>
                </Pressable>
              </View>

              <View style={styles.noticeList}>
                {visibleNotices.map((notice, index) => (
                  <Pressable
                    key={notice.id}
                    accessibilityRole="button"
                    onPress={() => Alert.alert('공지사항', notice.title)}
                    style={({ pressed }) => [
                      styles.noticeRow,
                      index < visibleNotices.length - 1 &&
                        styles.noticeDivider,
                      pressed && styles.noticePressed,
                    ]}
                  >
                    <Text style={styles.noticeTitle} numberOfLines={1}>
                      {notice.title}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  Alert.alert('공지사항', '공지 목록 화면을 준비 중입니다.')
                }
                style={({ pressed }) => [
                  styles.noticeMoreButton,
                  pressed && styles.noticeMoreButtonPressed,
                ]}
              >
                <Text style={styles.noticeMoreButtonText}>더보기</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionSpacing}>
            <SectionHeader title="내 신청 현황" />

            <View style={styles.requestList}>
              {REQUESTS.map((request, index) => (
                <View
                  key={request.id}
                  style={[
                    styles.requestItem,
                    index < REQUESTS.length - 1 &&
                      styles.requestItemDivider,
                  ]}
                >
                  <View style={styles.requestHeader}>
                    <View style={styles.requestTextArea}>
                      <Text style={styles.requestType}>{request.type}</Text>
                      <Text style={styles.requestTitle} numberOfLines={1}>
                        {request.title}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: request.statusBackground },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: request.statusColor },
                        ]}
                      >
                        {request.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.requestDetail}>{request.detail}</Text>
                </View>
              ))}

              <Text style={styles.demoCaption}>
                현재는 화면 확인을 위한 예시 데이터입니다.
              </Text>
            </View>
          </View>

          <View style={styles.operationBox}>
            <View style={styles.operationIcon}>
              <Text style={styles.operationIconText}>i</Text>
            </View>
            <View style={styles.operationTextArea}>
              <Text style={styles.operationTitle}>방학 중 운영시간</Text>
              <Text style={styles.operationText}>
                평일 09:00~17:00 · 주말 및 공휴일 휴무
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type SectionHeaderProps = {
  title: string;
  description?: string;
};

function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleArea}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {description ? (
          <Text style={styles.sectionDescription}>{description}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 28,
    backgroundColor: COLORS.navy,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  logoutButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: 10,
  },
  logoutText: {
    color: '#E8EAF3',
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
  topOperationBar: {
    minHeight: 34,
    marginTop: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  topOperationText: {
    width: '100%',
    color: '#E8EAF3',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  greetingRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingTextArea: {
    flex: 1,
    paddingRight: 18,
  },
  greeting: {
    color: COLORS.white,
    fontSize: 26,
    lineHeight: 35,
    fontWeight: '800',
  },
  greetingDescription: {
    marginTop: 8,
    color: '#D9DDEF',
    fontSize: 13,
    lineHeight: 20,
  },
  avatar: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.42)',
    borderRadius: 29,
    backgroundColor: '#303D82',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
  },
  profileMeta: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileChip: {
    minHeight: 28,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  profileChipText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  profileInfo: {
    marginLeft: 10,
    color: '#D9DDEF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleArea: {
    flex: 1,
    paddingRight: 16,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  sectionDescription: {
    marginTop: 6,
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 19,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    minHeight: 152,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  cardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  actionIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  actionIconText: {
    fontSize: 22,
  },
  actionTitle: {
    marginTop: 14,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  actionDescription: {
    marginTop: 5,
    color: COLORS.subText,
    fontSize: 12,
  },
  chevron: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    color: COLORS.subText,
    fontSize: 23,
    lineHeight: 25,
  },
  sectionSpacing: {
    marginTop: 34,
  },
  noticeCard: {
    overflow: 'hidden',
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
  },
  noticeCardHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noticeHeading: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  noticeMenuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  noticeMenuDots: {
    color: COLORS.text,
    fontSize: 15,
    letterSpacing: 3,
    fontWeight: '800',
  },
  noticeList: {
    marginTop: 18,
  },
  noticeRow: {
    minHeight: 58,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  noticePressed: {
    backgroundColor: '#F3F4F8',
  },
  noticeTitle: {
    width: '100%',
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  noticeMoreButton: {
    height: 50,
    marginTop: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
  },
  noticeMoreButtonPressed: {
    backgroundColor: '#F3F4F8',
  },
  noticeMoreButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  requestList: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  requestItem: {
    padding: 18,
  },
  requestItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  requestTextArea: {
    flex: 1,
    paddingRight: 12,
  },
  requestType: {
    color: COLORS.subText,
    fontSize: 12,
    fontWeight: '700',
  },
  requestTitle: {
    marginTop: 6,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  requestDetail: {
    marginTop: 11,
    color: COLORS.subText,
    fontSize: 12,
  },
  demoCaption: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    color: COLORS.placeholder,
    fontSize: 11,
    lineHeight: 17,
  },
  operationBox: {
    marginTop: 28,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: COLORS.softNavy,
  },
  operationIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: COLORS.navy,
  },
  operationIconText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  operationTextArea: {
    flex: 1,
    marginLeft: 12,
  },
  operationTitle: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: '800',
  },
  operationText: {
    marginTop: 4,
    color: COLORS.subText,
    fontSize: 12,
  },
});
