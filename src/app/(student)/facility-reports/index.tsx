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

import { COLORS } from '../../../constants/colors';
import { getAuthErrorMessage } from '../../../services/auth';
import {
  type FacilityReport,
  type FacilityReportStatus,
  getFacilityCategoryLabel,
  getFacilityStatusLabel,
  getMyFacilityReports,
} from '../../../services/facility-reports';

export default function FacilityReportsScreen() {
  const [reports, setReports] = useState<FacilityReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReports = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);

    try {
      setErrorMessage(null);
      setReports(await getMyFacilityReports());
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadReports();
    }, [loadReports]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>내 시설 신고</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/facility-report')}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Text style={styles.addText}>신고</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadReports(true)}
            colors={[COLORS.navy]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={COLORS.navy} />
          </View>
        ) : errorMessage ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorTitle}>신고 내역을 불러오지 못했습니다.</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable
              onPress={() => void loadReports()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.emptyTitle}>접수한 시설 신고가 없습니다.</Text>
            <Text style={styles.stateText}>불편한 시설이 있다면 신고해 주세요.</Text>
            <Pressable
              onPress={() => router.push('/facility-report')}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>시설 신고하기</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {reports.map((report) => {
              const statusStyle = getStatusStyle(report.status);

              return (
                <Pressable
                  key={report.id}
                  accessibilityRole="button"
                  onPress={() => router.push(`/facility-reports/${report.id}`)}
                  style={({ pressed }) => [
                    styles.card,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.category}>
                      {getFacilityCategoryLabel(report.category)} · {report.location}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusStyle.backgroundColor },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: statusStyle.color },
                        ]}
                      >
                        {getFacilityStatusLabel(report.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.title} numberOfLines={2}>
                    {report.title}
                  </Text>
                  <View style={styles.cardBottom}>
                    <Text style={styles.date}>{formatDate(report.created_at)}</Text>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStatusStyle(status: FacilityReportStatus) {
  if (status === 'resolved') {
    return { backgroundColor: '#EAF8F0', color: COLORS.success };
  }
  if (status === 'in_progress') {
    return { backgroundColor: '#FFF3DB', color: '#9A5B00' };
  }
  if (status === 'rejected') {
    return { backgroundColor: '#FCECEF', color: COLORS.error };
  }
  return { backgroundColor: COLORS.softNavy, color: COLORS.navy };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  addButton: { minWidth: 44, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: COLORS.navy },
  addText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  stateBox: { minHeight: 280, padding: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: COLORS.surface },
  errorTitle: { color: COLORS.error, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  stateText: { marginTop: 10, color: COLORS.subText, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  retryButton: { marginTop: 18, minHeight: 42, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: COLORS.navy },
  retryText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  list: { gap: 13 },
  card: { padding: 18, borderWidth: 1, borderColor: COLORS.border, borderRadius: 17, backgroundColor: COLORS.surface },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  category: { flex: 1, color: COLORS.subText, fontSize: 11, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800' },
  title: { marginTop: 14, color: COLORS.text, fontSize: 16, lineHeight: 23, fontWeight: '800' },
  cardBottom: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { color: COLORS.placeholder, fontSize: 11 },
  chevron: { color: COLORS.subText, fontSize: 23, lineHeight: 23 },
  pressed: { opacity: 0.7 },
});
