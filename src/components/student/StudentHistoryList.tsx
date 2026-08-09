import { useMemo, useState } from 'react';
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
import { StatusBar } from 'expo-status-bar';

import { COLORS } from '../../constants/colors';
import { PlatformHeaderIcon } from '../common/PlatformHeaderIcon';

export type HistoryStage = 'pending' | 'processing' | 'completed';

export type StudentHistoryItem = {
  category: string;
  date: string;
  id: string;
  onPress: () => void;
  stage: HistoryStage;
  statusLabel: string;
  title: string;
};

type StudentHistoryListProps = {
  actionLabel?: string;
  emptyActionLabel?: string;
  emptyMessage: string;
  errorMessage: string | null;
  errorTitle: string;
  initialStage?: HistoryStage;
  isLoading: boolean;
  isRefreshing: boolean;
  items: readonly StudentHistoryItem[];
  onAction?: () => void;
  onBack: () => void;
  onRefresh: () => void;
  onRetry: () => void;
  title: string;
};

const STAGE_LABELS: Record<HistoryStage, string> = {
  pending: '신청 대기',
  processing: '처리 중',
  completed: '진행 완료',
};

const STAGES = Object.keys(STAGE_LABELS) as HistoryStage[];

export function StudentHistoryList({
  actionLabel,
  emptyActionLabel,
  emptyMessage,
  errorMessage,
  errorTitle,
  initialStage = 'pending',
  isLoading,
  isRefreshing,
  items,
  onAction,
  onBack,
  onRefresh,
  onRetry,
  title,
}: StudentHistoryListProps) {
  const [stage, setStage] = useState<HistoryStage>(initialStage);
  const visibleItems = useMemo(
    () => items.filter((item) => item.stage === stage),
    [items, stage],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          hitSlop={10}
          onPress={onBack}
          style={({ pressed }) => [
            styles.headerSide,
            pressed && styles.pressed,
          ]}
        >
          <PlatformHeaderIcon name="back" />
        </Pressable>
        <Text pointerEvents="none" style={styles.headerTitle}>
          {title}
        </Text>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={onAction}
            style={({ pressed }) => [
              styles.headerSide,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        ) : (
          <View style={styles.headerSide} />
        )}
      </View>

      <View style={styles.tabsWrap}>
        <View accessibilityRole="tablist" style={styles.tabs}>
          {STAGES.map((stageOption) => {
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
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={['#3550FF']}
            onRefresh={onRefresh}
            refreshing={isRefreshing}
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#3550FF" size="large" />
          </View>
        ) : errorMessage ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorTitle}>{errorTitle}</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable
              onPress={onRetry}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : visibleItems.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.emptyTitle}>
              {STAGE_LABELS[stage]} 상태의 {emptyMessage}
            </Text>
            {emptyActionLabel && onAction ? (
              <Pressable
                onPress={onAction}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.retryText}>{emptyActionLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.list}>
            {visibleItems.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={item.onPress}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.rowTop}>
                  <Text style={styles.category}>[{item.category}]</Text>
                  <View style={styles.statusBadge}>
                    <Text
                      style={[
                        styles.statusText,
                        item.stage === 'processing' && styles.processingText,
                        item.stage === 'completed' && styles.completedText,
                      ]}
                    >
                      {item.statusLabel}
                    </Text>
                  </View>
                </View>
                <Text numberOfLines={2} style={styles.title}>
                  {item.title}
                </Text>
                <View style={styles.rowFooter}>
                  <Text style={styles.date}>{item.date}</Text>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    height: 56,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: COLORS.surface,
  },
  headerSide: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    position: 'absolute',
    right: 50,
    left: 50,
    color: '#2D2D2D',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 20,
    textAlign: 'center',
  },
  actionText: {
    color: '#3550FF',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 13,
  },
  tabsWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
  },
  tabs: {
    height: 50,
    padding: 3,
    flexDirection: 'row',
    borderRadius: 23,
    backgroundColor: '#EFF1F6',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  tabSelected: { backgroundColor: '#3550FF' },
  tabText: {
    color: '#586285',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 18,
  },
  tabTextSelected: { color: COLORS.white },
  scrollView: { flex: 1, backgroundColor: COLORS.surface },
  content: { flexGrow: 1, paddingBottom: 40 },
  list: { borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  row: {
    minHeight: 112,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: COLORS.surface,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  category: {
    flex: 1,
    color: '#586285',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#EFF1FA',
  },
  statusText: {
    color: '#586285',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 11,
  },
  processingText: { color: '#3550FF' },
  completedText: { color: '#636363' },
  title: {
    marginTop: 8,
    color: '#111111',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 16,
    lineHeight: 21,
  },
  rowFooter: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    color: '#999999',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
  },
  chevron: {
    color: '#111111',
    fontFamily: 'FreesentationRegular',
    fontSize: 22,
    lineHeight: 18,
  },
  stateBox: {
    flex: 1,
    minHeight: 300,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    color: COLORS.error,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 15,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#586285',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 15,
    textAlign: 'center',
  },
  stateText: {
    marginTop: 10,
    color: '#586285',
    fontFamily: 'FreesentationRegular',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 42,
    marginTop: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#3550FF',
  },
  retryText: {
    color: COLORS.white,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 13,
  },
  pressed: { opacity: 0.65 },
});
