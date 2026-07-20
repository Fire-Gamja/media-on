import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
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
  getFacilityCategoryLabel,
  getFacilityStatusLabel,
  getMyFacilityReport,
} from '../../../services/facility-reports';

export default function FacilityReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const reportId = Array.isArray(id) ? id[0] : id;
  const [report, setReport] = useState<FacilityReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!reportId) {
      router.back();
      return;
    }

    void getMyFacilityReport(reportId)
      .then(setReport)
      .catch((error) => {
        Alert.alert('조회 실패', getAuthErrorMessage(error), [
          { text: '확인', onPress: () => router.back() },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, [reportId]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>시설 신고 상세</Text>
        <View style={styles.headerSide} />
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.navy} />
        </View>
      ) : report ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>현재 처리 상태</Text>
            <Text style={styles.statusValue}>
              {getFacilityStatusLabel(report.status)}
            </Text>
            <Text style={styles.statusDate}>
              접수일 {formatDateTime(report.created_at)}
            </Text>
          </View>

          <View style={styles.card}>
            <DetailRow label="신고 유형" value={getFacilityCategoryLabel(report.category)} />
            <DetailRow label="장소" value={report.location} />
            <DetailRow label="제목" value={report.title} />
            <View style={styles.contentSection}>
              <Text style={styles.detailLabel}>상세 내용</Text>
              <Text style={styles.description}>{report.description}</Text>
            </View>
          </View>

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>관리자 처리 메모</Text>
            <Text style={styles.noteText}>
              {report.admin_note?.trim() || '아직 등록된 처리 메모가 없습니다.'}
            </Text>
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
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

function formatDateTime(value: string) {
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
  header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  headerSide: { width: 40 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  statusCard: { padding: 20, borderRadius: 18, backgroundColor: COLORS.navy },
  statusLabel: { color: '#D9DDEF', fontSize: 12, fontWeight: '700' },
  statusValue: { marginTop: 9, color: COLORS.white, fontSize: 23, fontWeight: '900' },
  statusDate: { marginTop: 10, color: '#D9DDEF', fontSize: 11 },
  card: { marginTop: 16, padding: 19, gap: 17, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, backgroundColor: COLORS.surface },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  detailLabel: { width: 74, color: COLORS.subText, fontSize: 12, fontWeight: '700' },
  detailValue: { flex: 1, color: COLORS.text, fontSize: 14, lineHeight: 21, fontWeight: '700' },
  contentSection: { paddingTop: 17, borderTopWidth: 1, borderTopColor: COLORS.border },
  description: { marginTop: 10, color: COLORS.text, fontSize: 14, lineHeight: 23 },
  noteCard: { marginTop: 16, padding: 19, borderRadius: 18, backgroundColor: COLORS.softNavy },
  noteTitle: { color: COLORS.navy, fontSize: 14, fontWeight: '800' },
  noteText: { marginTop: 10, color: COLORS.text, fontSize: 13, lineHeight: 21 },
});
