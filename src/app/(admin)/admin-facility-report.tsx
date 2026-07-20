import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/colors';
import { getAuthErrorMessage } from '../../services/auth';
import {
  type AdminFacilityReport,
  FACILITY_STATUS_OPTIONS,
  type FacilityReportStatus,
  getAdminFacilityReport,
  getFacilityCategoryLabel,
  updateFacilityReportStatus,
} from '../../services/facility-reports';

export default function AdminFacilityReportScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const reportId = Array.isArray(id) ? id[0] : id;
  const [report, setReport] = useState<AdminFacilityReport | null>(null);
  const [status, setStatus] = useState<FacilityReportStatus>('received');
  const [adminNote, setAdminNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!reportId) {
      router.back();
      return;
    }

    void getAdminFacilityReport(reportId)
      .then((data) => {
        setReport(data);
        setStatus(data.status);
        setAdminNote(data.admin_note ?? '');
      })
      .catch((error) => {
        Alert.alert('조회 실패', getAuthErrorMessage(error), [
          { text: '확인', onPress: () => router.back() },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, [reportId]);

  const handleSave = async () => {
    if (!reportId) return;

    try {
      setIsSaving(true);
      await updateFacilityReportStatus(reportId, status, adminNote);
      Alert.alert('저장 완료', '처리 상태와 관리자 메모를 저장했습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('저장 실패', getAuthErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>시설 신고 처리</Text>
          <View style={styles.headerSide} />
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.navy} />
          </View>
        ) : report ? (
          <>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.studentCard}>
                <Text style={styles.studentName}>
                  {report.reporter?.name ?? '학생'}
                </Text>
                <Text style={styles.studentNumber}>
                  {report.reporter?.student_number ?? '학번 미확인'} · {formatDateTime(report.created_at)} 접수
                </Text>
              </View>

              <View style={styles.reportCard}>
                <DetailRow label="신고 유형" value={getFacilityCategoryLabel(report.category)} />
                <DetailRow label="장소" value={report.location} />
                <DetailRow label="제목" value={report.title} />
                <View style={styles.descriptionSection}>
                  <Text style={styles.detailLabel}>상세 내용</Text>
                  <Text style={styles.description}>{report.description}</Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>처리 상태</Text>
              <View style={styles.statusGrid}>
                {FACILITY_STATUS_OPTIONS.map((option) => {
                  const isSelected = status === option.value;

                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => setStatus(option.value)}
                      style={({ pressed }) => [
                        styles.statusButton,
                        isSelected && styles.statusButtonSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.radio,
                          isSelected && styles.radioSelected,
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          isSelected && styles.statusTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionLabel}>관리자 처리 메모</Text>
              <TextInput
                value={adminNote}
                onChangeText={setAdminNote}
                maxLength={2000}
                multiline
                textAlignVertical="top"
                placeholder="학생에게 안내할 처리 내용이나 반려 사유를 입력해 주세요"
                placeholderTextColor={COLORS.placeholder}
                style={styles.noteInput}
              />
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                accessibilityRole="button"
                disabled={isSaving}
                onPress={() => void handleSave()}
                style={({ pressed }) => [
                  styles.saveButton,
                  isSaving && styles.disabled,
                  pressed && !isSaving && styles.pressed,
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveText}>처리 내용 저장</Text>
                )}
              </Pressable>
            </View>
          </>
        ) : null}
      </KeyboardAvoidingView>
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
  flex: { flex: 1 },
  header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  headerSide: { width: 40 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 38 },
  studentCard: { padding: 18, borderRadius: 16, backgroundColor: COLORS.navy },
  studentName: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  studentNumber: { marginTop: 7, color: '#D9DDEF', fontSize: 11 },
  reportCard: { marginTop: 15, padding: 18, gap: 16, borderWidth: 1, borderColor: COLORS.border, borderRadius: 17, backgroundColor: COLORS.surface },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  detailLabel: { width: 74, color: COLORS.subText, fontSize: 12, fontWeight: '700' },
  detailValue: { flex: 1, color: COLORS.text, fontSize: 14, lineHeight: 21, fontWeight: '700' },
  descriptionSection: { paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  description: { marginTop: 10, color: COLORS.text, fontSize: 14, lineHeight: 23 },
  sectionLabel: { marginTop: 25, marginBottom: 10, color: COLORS.text, fontSize: 15, fontWeight: '800' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  statusButton: { width: '48%', minHeight: 52, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 13, backgroundColor: COLORS.surface },
  statusButtonSelected: { borderColor: COLORS.navy, backgroundColor: COLORS.softNavy },
  radio: { width: 18, height: 18, marginRight: 9, borderWidth: 1, borderColor: COLORS.placeholder, borderRadius: 9, backgroundColor: COLORS.surface },
  radioSelected: { borderWidth: 5, borderColor: COLORS.navy },
  statusText: { color: COLORS.subText, fontSize: 13, fontWeight: '700' },
  statusTextSelected: { color: COLORS.navy, fontWeight: '800' },
  noteInput: { minHeight: 150, padding: 16, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, backgroundColor: COLORS.surface, color: COLORS.text, fontSize: 14, lineHeight: 22 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface },
  saveButton: { height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: COLORS.navy },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.7 },
});
