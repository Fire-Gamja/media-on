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

type QuickAction = {
  id: 'notice' | 'equipment' | 'room' | 'report';
  icon: string;
  title: string;
  description: string;
  iconBackground: string;
};

type Notice = {
  id: string;
  category: string;
  title: string;
  date: string;
  important?: boolean;
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
    category: '학사',
    title: '2026학년도 2학기 수강신청 안내',
    date: '07.20',
    important: true,
  },
  {
    id: 'notice-2',
    category: '실습',
    title: '301호·501호 실습실 포맷 작업 안내',
    date: '07.18',
  },
  {
    id: 'notice-3',
    category: '학부',
    title: '방학 중 학부 사무실 운영시간 안내',
    date: '07.15',
  },
];

export default function HomeScreen() {
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
              <View style={styles.onlineDot} />
              <Text style={styles.profileChipText}>승인 완료</Text>
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
            <SectionHeader
              title="중요 공지"
              actionLabel="전체보기"
              onActionPress={() =>
                Alert.alert('공지사항', '공지 목록 화면을 준비 중입니다.')
              }
            />

            <View style={styles.noticeCard}>
              {NOTICES.map((notice, index) => (
                <Pressable
                  key={notice.id}
                  accessibilityRole="button"
                  onPress={() => Alert.alert(notice.category, notice.title)}
                  style={({ pressed }) => [
                    styles.noticeRow,
                    index < NOTICES.length - 1 && styles.noticeDivider,
                    pressed && styles.noticePressed,
                  ]}
                >
                  <View style={styles.noticeBody}>
                    <View style={styles.noticeMetaRow}>
                      <Text style={styles.noticeCategory}>
                        {notice.category}
                      </Text>
                      {notice.important ? (
                        <View style={styles.importantBadge}>
                          <Text style={styles.importantBadgeText}>중요</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.noticeTitle} numberOfLines={1}>
                      {notice.title}
                    </Text>
                  </View>
                  <Text style={styles.noticeDate}>{notice.date}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.sectionSpacing}>
            <SectionHeader title="내 신청 현황" />

            <View style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View>
                  <Text style={styles.requestType}>기자재 대여</Text>
                  <Text style={styles.requestTitle}>DSLR 카메라 1대</Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>준비 중</Text>
                </View>
              </View>

              <View style={styles.requestDivider} />
              <DetailRow label="수령 예정" value="7월 22일 10:00" />
              <DetailRow
                label="수령 장소"
                value="제1자연관 학부사무실"
              />

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
  actionLabel?: string;
  onActionPress?: () => void;
};

function SectionHeader({
  title,
  description,
  actionLabel,
  onActionPress,
}: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleArea}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {description ? (
          <Text style={styles.sectionDescription}>{description}</Text>
        ) : null}
      </View>

      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={onActionPress}
        >
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
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
  greetingRow: {
    marginTop: 30,
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  onlineDot: {
    width: 7,
    height: 7,
    marginRight: 6,
    borderRadius: 4,
    backgroundColor: '#69DB9D',
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
  sectionAction: {
    marginTop: 3,
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: '700',
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
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  noticeRow: {
    minHeight: 78,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  noticePressed: {
    backgroundColor: '#F3F4F8',
  },
  noticeBody: {
    flex: 1,
    paddingRight: 12,
  },
  noticeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeCategory: {
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: '800',
  },
  importantBadge: {
    marginLeft: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: '#FDECEC',
  },
  importantBadgeText: {
    color: COLORS.error,
    fontSize: 10,
    fontWeight: '800',
  },
  noticeTitle: {
    marginTop: 7,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  noticeDate: {
    color: COLORS.subText,
    fontSize: 12,
  },
  requestCard: {
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
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
    backgroundColor: '#FFF3DB',
  },
  statusBadgeText: {
    color: '#9A5B00',
    fontSize: 11,
    fontWeight: '800',
  },
  requestDivider: {
    height: 1,
    marginVertical: 16,
    backgroundColor: COLORS.border,
  },
  detailRow: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: COLORS.subText,
    fontSize: 12,
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  demoCaption: {
    marginTop: 6,
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
