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
  type FacilityReportStatus,
  getAdminFacilityReport,
  getFacilityCategoryLabel,
  getFacilityStatusLabel,
  transitionFacilityReport,
} from '../../services/facility-reports';

export default function AdminFacilityReportScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const reportId = Array.isArray(id) ? id[0] : id;
  const [report, setReport] = useState<AdminFacilityReport | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!reportId) {
      router.back();
      return;
    }

    void getAdminFacilityReport(reportId)
      .then(setReport)
      .catch((error) => {
        Alert.alert('조회 실패', getAuthErrorMessage(error), [
          { text: '확인', onPress: () => router.back() },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, [reportId]);

  const performTransition = async (
    nextStatus: FacilityReportStatus,
    note = '',
  ) => {
    if (!reportId || !report) return;

    if (
      (nextStatus === 'rejected' || nextStatus === 'resolved') &&
      !note.trim()
    ) {
      Alert.alert(
        '처리 메모 확인',
        nextStatus === 'rejected'
          ? '학생이 확인할 반려 사유를 입력해 주세요.'
          : '학생이 확인할 조치 완료 내용을 입력해 주세요.',
      );
      return;
    }

    try {
      setIsSaving(true);
      await transitionFacilityReport(reportId, nextStatus, note);
      setReport({
        ...report,
        status: nextStatus,
        admin_note:
          nextStatus === 'rejected' || nextStatus === 'resolved'
            ? note.trim()
            : null,
      });
      setAdminNote('');
      setIsRejecting(false);

      if (nextStatus === 'rejected' || nextStatus === 'resolved') {
        Alert.alert(
          nextStatus === 'rejected' ? '반려 완료' : '조치 완료',
          nextStatus === 'rejected'
            ? '반려 사유를 학생에게 전달했습니다.'
            : '조치 완료 내용이 학생에게 표시됩니다.',
          [{ text: '확인', onPress: () => router.back() }],
        );
      } else {
        Alert.alert(
          '상태 변경 완료',
          nextStatus === 'received'
            ? '신고를 접수 완료로 변경했습니다.'
            : '신고를 조치 중으로 변경했습니다.',
        );
      }
    } catch (error) {
      Alert.alert('처리 실패', getAuthErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReceive = () => {
    Alert.alert('시설 신고 접수', '이 신고를 접수하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '접수하기',
        onPress: () => void performTransition('received'),
      },
    ]);
  };

  const handleStartWork = () => {
    Alert.alert('조치 시작', '이 신고의 조치를 시작하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '조치하기',
        onPress: () => void performTransition('in_progress'),
      },
    ]);
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
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.studentCard}>
              <View style={styles.studentTopRow}>
                <View style={styles.studentTextArea}>
                  <Text style={styles.studentName}>
                    {report.reporter?.name ?? '학생'}
                  </Text>
                  <Text style={styles.studentNumber}>
                    {report.reporter?.student_number ?? '학번 미확인'} ·{' '}
                    {formatDateTime(report.created_at)} 신청
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {getFacilityStatusLabel(report.status)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.reportCard}>
              <DetailRow
                label="신고 유형"
                value={getFacilityCategoryLabel(report.category)}
              />
              <DetailRow label="장소" value={report.location} />
              <DetailRow label="제목" value={report.title} />
              <View style={styles.descriptionSection}>
                <Text style={styles.detailLabel}>상세 내용</Text>
                <Text style={styles.description}>{report.description}</Text>
              </View>
            </View>

            <View style={styles.workflowCard}>
              <Text style={styles.workflowTitle}>처리 단계</Text>
              <Text style={styles.workflowDescription}>
                {getWorkflowDescription(report.status)}
              </Text>

              {report.status === 'submitted' ? (
                isRejecting ? (
                  <View style={styles.noteArea}>
                    <Text style={styles.noteLabel}>반려 사유</Text>
                    <TextInput
                      value={adminNote}
                      onChangeText={setAdminNote}
                      maxLength={2000}
                      multiline
                      textAlignVertical="top"
                      placeholder="학생이 확인할 반려 사유를 입력해 주세요"
                      placeholderTextColor={COLORS.placeholder}
                      style={styles.noteInput}
                    />
                    <View style={styles.actionRow}>
                      <Pressable
                        disabled={isSaving}
                        onPress={() => {
                          setIsRejecting(false);
                          setAdminNote('');
                        }}
                        style={({ pressed }) => [
                          styles.cancelButton,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.cancelText}>취소</Text>
                      </Pressable>
                      <Pressable
                        disabled={isSaving}
                        onPress={() =>
                          void performTransition('rejected', adminNote)
                        }
                        style={({ pressed }) => [
                          styles.rejectSubmitButton,
                          isSaving && styles.disabled,
                          pressed && !isSaving && styles.pressed,
                        ]}
                      >
                        {isSaving ? (
                          <ActivityIndicator color={COLORS.white} />
                        ) : (
                          <Text style={styles.primaryButtonText}>
                            반려 사유 전송
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.actionRow}>
                    <Pressable
                      disabled={isSaving}
                      onPress={() => setIsRejecting(true)}
                      style={({ pressed }) => [
                        styles.rejectButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.rejectText}>반려</Text>
                    </Pressable>
                    <Pressable
                      disabled={isSaving}
                      onPress={handleReceive}
                      style={({ pressed }) => [
                        styles.primaryButton,
                        isSaving && styles.disabled,
                        pressed && !isSaving && styles.pressed,
                      ]}
                    >
                      <Text style={styles.primaryButtonText}>접수하기</Text>
                    </Pressable>
                  </View>
                )
              ) : null}

              {report.status === 'received' ? (
                <Pressable
                  disabled={isSaving}
                  onPress={handleStartWork}
                  style={({ pressed }) => [
                    styles.fullPrimaryButton,
                    isSaving && styles.disabled,
                    pressed && !isSaving && styles.pressed,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>조치하기</Text>
                </Pressable>
              ) : null}

              {report.status === 'in_progress' ? (
                <View style={styles.noteArea}>
                  <Text style={styles.noteLabel}>처리 메모</Text>
                  <TextInput
                    value={adminNote}
                    onChangeText={setAdminNote}
                    maxLength={2000}
                    multiline
                    textAlignVertical="top"
                    placeholder="학생이 확인할 조치 내용을 입력해 주세요"
                    placeholderTextColor={COLORS.placeholder}
                    style={styles.noteInput}
                  />
                  <Pressable
                    disabled={isSaving}
                    onPress={() =>
                      void performTransition('resolved', adminNote)
                    }
                    style={({ pressed }) => [
                      styles.fullPrimaryButton,
                      isSaving && styles.disabled,
                      pressed && !isSaving && styles.pressed,
                    ]}
                  >
                    {isSaving ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={styles.primaryButtonText}>조치 완료</Text>
                    )}
                  </Pressable>
                </View>
              ) : null}

              {report.status === 'rejected' ||
              report.status === 'resolved' ? (
                <View style={styles.completedNote}>
                  <Text style={styles.noteLabel}>
                    {report.status === 'rejected' ? '반려 사유' : '처리 메모'}
                  </Text>
                  <Text style={styles.completedNoteText}>
                    {report.admin_note}
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>
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

function getWorkflowDescription(status: FacilityReportStatus) {
  if (status === 'submitted') {
    return '신청 내용을 확인한 뒤 접수하거나 반려해 주세요.';
  }
  if (status === 'received') {
    return '접수가 완료되었습니다. 실제 조치를 시작할 때 조치하기를 눌러 주세요.';
  }
  if (status === 'in_progress') {
    return '조치가 진행 중입니다. 완료 후 처리 메모와 함께 조치 완료해 주세요.';
  }
  if (status === 'resolved') {
    return '조치가 완료되어 학생에게 처리 메모가 전달되었습니다.';
  }
  return '반려 사유가 학생에게 전달되었습니다.';
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
  content: { padding: 20, paddingBottom: 40 },
  studentCard: { padding: 18, borderRadius: 16, backgroundColor: COLORS.navy },
  studentTopRow: { flexDirection: 'row', alignItems: 'center' },
  studentTextArea: { flex: 1, paddingRight: 12 },
  studentName: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  studentNumber: { marginTop: 7, color: '#D9DDEF', fontSize: 11 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.16)' },
  statusText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  reportCard: { marginTop: 15, padding: 18, gap: 16, borderWidth: 1, borderColor: COLORS.border, borderRadius: 17, backgroundColor: COLORS.surface },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  detailLabel: { width: 74, color: COLORS.subText, fontSize: 12, fontWeight: '700' },
  detailValue: { flex: 1, color: COLORS.text, fontSize: 14, lineHeight: 21, fontWeight: '700' },
  descriptionSection: { paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  description: { marginTop: 10, color: COLORS.text, fontSize: 14, lineHeight: 23 },
  workflowCard: { marginTop: 15, padding: 18, borderWidth: 1, borderColor: COLORS.border, borderRadius: 17, backgroundColor: COLORS.surface },
  workflowTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  workflowDescription: { marginTop: 7, color: COLORS.subText, fontSize: 12, lineHeight: 19 },
  actionRow: { marginTop: 18, flexDirection: 'row', gap: 9 },
  rejectButton: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F4B8BE', borderRadius: 13, backgroundColor: '#FFF7F8' },
  rejectText: { color: COLORS.error, fontSize: 14, fontWeight: '800' },
  primaryButton: { flex: 2, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: COLORS.navy },
  fullPrimaryButton: { height: 52, marginTop: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: COLORS.navy },
  primaryButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  noteArea: { marginTop: 18 },
  noteLabel: { marginBottom: 9, color: COLORS.text, fontSize: 13, fontWeight: '800' },
  noteInput: { minHeight: 130, padding: 14, borderWidth: 1, borderColor: COLORS.border, borderRadius: 13, backgroundColor: COLORS.background, color: COLORS.text, fontSize: 14, lineHeight: 22 },
  cancelButton: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 13, backgroundColor: COLORS.surface },
  cancelText: { color: COLORS.subText, fontSize: 14, fontWeight: '800' },
  rejectSubmitButton: { flex: 2, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: COLORS.error },
  completedNote: { marginTop: 18, padding: 15, borderRadius: 13, backgroundColor: COLORS.background },
  completedNoteText: { color: COLORS.text, fontSize: 13, lineHeight: 21 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.7 },
});
