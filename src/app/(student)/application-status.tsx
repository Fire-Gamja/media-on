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

import { AppIcon, type AppIconName } from '../../components/common/AppIcon';
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
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>내 신청 현황</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.tabs}>
        {(Object.keys(STAGE_LABELS) as ApplicationStage[]).map(
          (stageOption) => {
            const isSelected = stage === stageOption;
            const count = items.filter(
              (item) => item.stage === stageOption,
            ).length;

            return (
              <Pressable
                key={stageOption}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setStage(stageOption)}
                style={[
                  styles.tab,
                  isSelected && styles.tabSelected,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    isSelected && styles.tabTextSelected,
                  ]}
                >
                  {STAGE_LABELS[stageOption]} {count}
                </Text>
              </Pressable>
            );
          },
        )}
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
            <Pressable
              onPress={() => void loadItems()}
              style={styles.retryButton}
            >
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
                  styles.card,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.iconBox}>
                  <AppIcon name={getIconName(item)} size={26} />
                </View>
                <View style={styles.cardText}>
                  <View style={styles.cardTop}>
                    <Text style={styles.category}>{item.category}</Text>
                    <Text style={styles.status}>{item.statusLabel}</Text>
                  </View>
                  <Text numberOfLines={1} style={styles.title}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.description}>
                    {item.description}
                  </Text>
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

function getIconName(item: ApplicationStatusItem): AppIconName {
  if (item.kind === 'facility') return 'report';
  if (item.kind === 'inquiry') return 'assistant';
  return item.kind;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
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
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSide: {
    width: 40,
  },
  tabs: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.surface,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  tabSelected: {
    backgroundColor: COLORS.navy,
  },
  tabText: {
    color: COLORS.subText,
    fontSize: 12,
    fontWeight: '800',
  },
  tabTextSelected: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  list: {
    gap: 12,
  },
  card: {
    minHeight: 96,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
  },
  iconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: COLORS.softNavy,
  },
  cardText: {
    flex: 1,
    marginLeft: 13,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  category: {
    color: COLORS.subText,
    fontSize: 11,
    fontWeight: '700',
  },
  status: {
    color: COLORS.navy,
    fontSize: 11,
    fontWeight: '800',
  },
  title: {
    marginTop: 7,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  description: {
    marginTop: 5,
    color: COLORS.subText,
    fontSize: 12,
  },
  chevron: {
    marginLeft: 8,
    color: COLORS.subText,
    fontSize: 25,
  },
  stateBox: {
    minHeight: 300,
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
  emptyTitle: {
    color: COLORS.subText,
    fontSize: 15,
    fontWeight: '700',
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
  retryText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.68,
  },
});
