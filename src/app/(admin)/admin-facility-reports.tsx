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

import { COLORS } from '../../constants/colors';
import { getAuthErrorMessage } from '../../services/auth';
import {
  type AdminFacilityReport,
  type FacilityReportStatus,
  getAdminFacilityReports,
  getFacilityCategoryLabel,
  getFacilityStatusLabel,
} from '../../services/facility-reports';

export default function AdminFacilityReportsScreen() {
  const [reports, setReports] = useState<AdminFacilityReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReports = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);

    try {
      setErrorMessage(null);
      setReports(await getAdminFacilityReports());
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
        <Text style={styles.headerTitle}>시설 신고 관리</Text>
        <View style={styles.headerSide} />
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
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>전체 시설 신고</Text>
            <Text style={styles.summaryDescription}>
              신고 내용을 확인하고 처리 상태를 변경해 주세요.
            </Text>
          </View>
          <Text style={styles.summaryCount}>{reports.length}건</Text>
        </View>

        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={COLORS.navy} />
          </View>
        ) : errorMessage ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorTitle}>목록을 불러오지 못했습니다.</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable onPress={() => void loadReports()} style={styles.retryButton}>
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.emptyTitle}>접수된 시설 신고가 없습니다.</Text>
            <Text style={styles.stateText}>
              학생이 신고를 접수하면 이곳에 표시됩니다.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {reports.map((report) => {
              const statusStyle = getStatusStyle(report.status);

              return (
                <Pressable
                  key={report.id}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/admin-facility-report',
                      params: { id: report.id },
                    })
                  }
                  style={({ pressed }) => [
                    styles.card,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.studentArea}>
                      <Text style={styles.studentName}>
                        {report.reporter?.name ?? '학생'}
                      </Text>
                      <Text style={styles.studentNumber}>
                        {report.reporter?.student_number ?? '학번 미확인'}
                      </Text>
                    </View>
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
                  <Text style={styles.meta} numberOfLines={1}>
                    {getFacilityCategoryLabel(report.category)} · {report.location}
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
  if (status === 'submitted') {
    return { backgroundColor: '#F1F2F6', color: COLORS.subText };
  }
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
  headerSide: { width: 40 },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  summaryCard: { marginBottom: 18, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 17, backgroundColor: COLORS.navy },
  summaryLabel: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  summaryDescription: { maxWidth: 245, marginTop: 6, color: '#D9DDEF', fontSize: 11, lineHeight: 17 },
  summaryCount: { marginLeft: 12, color: COLORS.white, fontSize: 21, fontWeight: '900' },
  stateBox: { minHeight: 260, padding: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: COLORS.surface },
  errorTitle: { color: COLORS.error, fontSize: 15, fontWeight: '800' },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  stateText: { marginTop: 10, color: COLORS.subText, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  retryButton: { marginTop: 18, minHeight: 42, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: COLORS.navy },
  retryText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  list: { gap: 13 },
  card: { padding: 18, borderWidth: 1, borderColor: COLORS.border, borderRadius: 17, backgroundColor: COLORS.surface },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  studentArea: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  studentName: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  studentNumber: { color: COLORS.subText, fontSize: 11 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800' },
  title: { marginTop: 14, color: COLORS.text, fontSize: 16, lineHeight: 23, fontWeight: '800' },
  meta: { marginTop: 8, color: COLORS.subText, fontSize: 12 },
  cardBottom: { marginTop: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { color: COLORS.placeholder, fontSize: 11 },
  chevron: { color: COLORS.subText, fontSize: 23, lineHeight: 23 },
  pressed: { opacity: 0.7 },
});
