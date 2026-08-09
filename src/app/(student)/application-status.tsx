import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
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

import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import { COLORS } from '../../constants/colors';
import {
  type ApplicationStage,
  type ApplicationStatusItem,
  getMyApplicationStatusItems,
} from '../../services/application-status';
import { getAuthErrorMessage } from '../../services/auth';

const STAGE_LABELS: Record<ApplicationStage, string> = {
  pending: '신청 대기',
  processing: '처리 중',
  completed: '진행 완료',
};

export default function ApplicationStatusScreen() {
  const { stage: rawStage } = useLocalSearchParams<{ stage?: string }>();
  const initialStage = isApplicationStage(rawStage) ? rawStage : 'pending';
  const [stage, setStage] = useState<ApplicationStage>(initialStage);
  const [items, setItems] = useState<ApplicationStatusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const visibleItems = useMemo(
    () => items.filter((item) => item.stage === stage),
    [items, stage],
  );

  const loadItems = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);

    try {
      setErrorMessage(null);
      setItems(await getMyApplicationStatusItems());
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadItems();
    }, [loadItems]),
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.headerSide}
        >
          <PlatformHeaderIcon name="back" />
        </Pressable>
        <Text style={styles.headerTitle}>내 신청 현황</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.tabsWrap}>
        <View accessibilityRole="tablist" style={styles.tabs}>
          {(Object.keys(STAGE_LABELS) as ApplicationStage[]).map(
            (stageOption) => {
              const isSelected = stage === stageOption;
              return (
                <Pressable
                  key={stageOption}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setStage(stageOption)}
                  style={[styles.tab, isSelected && styles.tabSelected]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      isSelected && styles.tabTextSelected,
                    ]}
                  >
                    {STAGE_LABELS[stageOption]}
                  </Text>
                </Pressable>
              );
            },
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[COLORS.navy]}
            onRefresh={() => void loadItems(true)}
            refreshing={isRefreshing}
          />
        }
        style={styles.scrollView}
      >
        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={COLORS.navy} size="large" />
          </View>
        ) : errorMessage ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorTitle}>
              신청 현황을 불러오지 못했습니다.
            </Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable onPress={() => void loadItems()} style={styles.retryButton}>
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : visibleItems.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.emptyTitle}>
              {STAGE_LABELS[stage]} 상태의 신청이 없습니다.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visibleItems.map((item) => (
              <Pressable
                key={`${item.kind}-${item.id}`}
                accessibilityRole="button"
                onPress={() => router.push(item.route)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.rowBody}>
                  <View style={styles.rowTop}>
                    <Text style={styles.category}>[{item.category}]</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{item.statusLabel}</Text>
                    </View>
                  </View>
                  <Text numberOfLines={1} style={styles.title}>
                    {item.title}
                  </Text>
                  <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function isApplicationStage(value?: string): value is ApplicationStage {
  return value === 'pending' || value === 'processing' || value === 'completed';
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10).replaceAll('-', '.');
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replace(/\s/g, '');
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerSide: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.text,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 20,
  },
  tabsWrap: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tabs: {
    height: 44,
    padding: 2,
    flexDirection: 'row',
    borderRadius: 22,
    backgroundColor: '#F0F2F8',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  tabSelected: { backgroundColor: '#3D4C7B' },
  tabText: {
    color: '#53617F',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  tabTextSelected: { color: COLORS.white },
  scrollView: { flex: 1, backgroundColor: COLORS.surface },
  content: { flexGrow: 1, paddingBottom: 40 },
  list: { borderTopWidth: 1, borderTopColor: '#EEEEEE' },
  row: {
    minHeight: 116,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: COLORS.surface,
  },
  rowBody: { flex: 1 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: {
    color: '#4D6098',
    fontFamily: 'FreesentationRegular',
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 3,
    backgroundColor: '#F0F2F8',
  },
  statusText: {
    color: '#52618B',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 10,
  },
  title: {
    marginTop: 8,
    color: '#171717',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 15,
  },
  date: {
    marginTop: 9,
    color: '#A4A4A4',
    fontFamily: 'FreesentationRegular',
    fontSize: 11,
  },
  chevron: { marginLeft: 12, color: '#111111', fontSize: 26 },
  stateBox: {
    flex: 1,
    minHeight: 300,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: { color: COLORS.error, fontSize: 15, fontWeight: '800' },
  emptyTitle: { color: COLORS.subText, fontSize: 15, fontWeight: '700' },
  stateText: { marginTop: 10, color: COLORS.subText, fontSize: 13 },
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
  pressed: { opacity: 0.62 },
});
