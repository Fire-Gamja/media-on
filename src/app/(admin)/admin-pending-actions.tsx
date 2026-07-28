import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '../../components/common/AppIcon';
import { COLORS } from '../../constants/colors';
import {
  getPendingActions,
  type PendingAction,
  type PendingActionKind,
} from '../../services/admin-dashboard';
import { getAuthErrorMessage } from '../../services/auth';

export default function AdminPendingActionsScreen() {
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadActions = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);

    try {
      setErrorMessage(null);
      setActions(await getPendingActions());
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadActions();
    }, [loadActions]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          hitSlop={10}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>조치 대기</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[COLORS.navy]}
            onRefresh={() => void loadActions(true)}
            refreshing={isRefreshing}
          />
        }
      >
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryTitle}>처리가 필요한 항목</Text>
            <Text style={styles.summaryDescription}>
              오래 접수된 순서대로 표시됩니다.
            </Text>
          </View>
          <Text style={styles.summaryCount}>{actions.length}건</Text>
        </View>

        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={COLORS.navy} size="large" />
          </View>
        ) : errorMessage ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorTitle}>
              조치 대기 목록을 불러오지 못했습니다.
            </Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable
              onPress={() => void loadActions()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : actions.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.emptyTitle}>대기 중인 조치가 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {actions.map((action) => (
              <PendingActionCard
                action={action}
                key={`${action.kind}-${action.id}`}
                onPress={() => openPendingAction(action)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PendingActionCard({
  action,
  onPress,
}: {
  action: PendingAction;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconBox}>
        <AppIcon name={getIconName(action.kind)} size={27} />
      </View>
      <View style={styles.cardText}>
        <View style={styles.cardMeta}>
          <Text style={styles.category}>{action.category}</Text>
          <Text style={styles.status}>{action.status}</Text>
        </View>
        <Text numberOfLines={1} style={styles.title}>
          {action.title}
        </Text>
        <Text numberOfLines={1} style={styles.description}>
          {action.description}
        </Text>
        <Text style={styles.date}>{formatDate(action.createdAt)}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function getIconName(kind: PendingActionKind): AppIconName {
  if (kind === 'facility') return 'report';
  if (kind === 'inquiry') return 'assistant';
  return kind;
}

function openPendingAction(action: PendingAction) {
  if (action.kind === 'equipment') {
    router.push({
      pathname: '/admin-equipment-request',
      params: { id: action.id },
    });
    return;
  }

  if (action.kind === 'room') {
    router.push({
      pathname: '/admin-room-request',
      params: { id: action.id },
    });
    return;
  }

  if (action.kind === 'facility') {
    router.push({
      pathname: '/admin-facility-report',
      params: { id: action.id },
    });
    return;
  }

  router.push({
    pathname: '/admin-assistant-inquiry',
    params: { id: action.id },
  });
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
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backText: {
    width: 40,
    color: COLORS.navy,
    fontSize: 38,
    lineHeight: 40,
  },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  headerSide: { width: 40 },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  summaryCard: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 17,
    backgroundColor: COLORS.navy,
  },
  summaryTitle: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  summaryDescription: {
    marginTop: 6,
    color: '#D9DDEF',
    fontSize: 12,
  },
  summaryCount: { color: COLORS.white, fontSize: 22, fontWeight: '900' },
  stateBox: {
    minHeight: 280,
    marginTop: 18,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  errorTitle: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateText: {
    marginTop: 10,
    color: COLORS.subText,
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 42,
    marginTop: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: COLORS.navy,
  },
  retryText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  list: { marginTop: 18, gap: 12 },
  card: {
    minHeight: 112,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  iconBox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.softNavy,
  },
  cardText: { flex: 1, marginLeft: 13 },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  category: { color: COLORS.subText, fontSize: 11, fontWeight: '700' },
  status: { color: COLORS.navy, fontSize: 11, fontWeight: '800' },
  title: {
    marginTop: 6,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  description: { marginTop: 5, color: COLORS.subText, fontSize: 12 },
  date: { marginTop: 6, color: COLORS.placeholder, fontSize: 10 },
  chevron: { marginLeft: 8, color: COLORS.subText, fontSize: 24 },
  pressed: { opacity: 0.7 },
});
