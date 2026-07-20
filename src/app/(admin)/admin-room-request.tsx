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
  type AdminRoomReservationRequest,
  getAdminRoomReservationRequest,
  getRoomStatusLabel,
  type RoomReservationStatus,
  transitionRoomReservationRequest,
} from '../../services/room-reservations';

export default function AdminRoomRequestScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const requestId = Array.isArray(id) ? id[0] : id;
  const [request, setRequest] =
    useState<AdminRoomReservationRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!requestId) {
      router.back();
      return;
    }

    void getAdminRoomReservationRequest(requestId)
      .then(setRequest)
      .catch((error) => {
        Alert.alert('조회 실패', getAuthErrorMessage(error), [
          { text: '확인', onPress: () => router.back() },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, [requestId]);

  const performTransition = async (
    nextStatus: RoomReservationStatus,
    note = '',
  ) => {
    if (!requestId || !request) return;
    if (nextStatus === 'rejected' && !note.trim()) {
      Alert.alert('반려 사유 확인', '학생이 확인할 반려 사유를 입력해 주세요.');
      return;
    }

    try {
      setIsSaving(true);
      await transitionRoomReservationRequest(requestId, nextStatus, note);
      setRequest({
        ...request,
        status: nextStatus,
        admin_note: nextStatus === 'rejected' ? note.trim() : null,
      });
      setAdminNote('');
      setIsRejecting(false);

      if (nextStatus === 'rejected' || nextStatus === 'approved') {
        Alert.alert(
          nextStatus === 'rejected' ? '반려 완료' : '승인 완료',
          nextStatus === 'rejected'
            ? '반려 사유를 학생에게 전달했습니다.'
            : 'ERP 신청 확인과 승인을 완료했습니다.',
          [{ text: '확인', onPress: () => router.back() }],
        );
      } else {
        Alert.alert(
          '상태 변경 완료',
          nextStatus === 'received'
            ? '신청을 접수 완료로 변경했습니다.'
            : '신청을 ERP 확인 중으로 변경했습니다.',
        );
      }
    } catch (error) {
      Alert.alert('처리 실패', getAuthErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const confirmNextStep = (status: RoomReservationStatus) => {
    const nextStatus = getNextStatus(status);
    if (!nextStatus) return;

    Alert.alert(getNextActionLabel(status), getNextActionMessage(status), [
      { text: '취소', style: 'cancel' },
      {
        text: getNextActionLabel(status),
        onPress: () => void performTransition(nextStatus),
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
          <Text style={styles.headerTitle}>실습실 신청 처리</Text>
          <View style={styles.headerSide} />
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.navy} />
          </View>
        ) : request ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.studentCard}>
              <View style={styles.studentArea}>
                <Text style={styles.studentName}>
                  {request.requester?.name ?? '학생'}
                </Text>
                <Text style={styles.studentNumber}>
                  {request.requester?.student_number ?? '학번 미확인'}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {getRoomStatusLabel(request.status)}
                </Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <DetailRow label="실습실" value={request.room?.name ?? '실습실'} />
              <DetailRow label="이용일" value={request.reservation_date} />
              <DetailRow
                label="이용 시간"
                value={`${request.start_time.slice(0, 5)}~${request.end_time.slice(0, 5)}`}
              />
              <DetailRow label="이용 인원" value="40명 고정" />
              <View style={styles.purposeSection}>
                <Text style={styles.detailLabel}>사용 목적</Text>
                <Text style={styles.purpose}>{request.purpose}</Text>
              </View>
            </View>

            <View style={styles.workflowCard}>
              <Text style={styles.workflowTitle}>ERP 확인 단계</Text>
              <Text style={styles.workflowText}>
                {getWorkflowText(request.status)}
              </Text>

              {getNextStatus(request.status) ? (
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
                        style={styles.cancelButton}
                      >
                        <Text style={styles.cancelText}>취소</Text>
                      </Pressable>
                      <Pressable
                        disabled={isSaving}
                        onPress={() =>
                          void performTransition('rejected', adminNote)
                        }
                        style={[
                          styles.rejectSubmitButton,
                          isSaving && styles.disabled,
                        ]}
                      >
                        {isSaving ? (
                          <ActivityIndicator color={COLORS.white} />
                        ) : (
                          <Text style={styles.primaryText}>반려 사유 전송</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.actionRow}>
                    <Pressable
                      disabled={isSaving}
                      onPress={() => setIsRejecting(true)}
                      style={styles.rejectButton}
                    >
                      <Text style={styles.rejectText}>반려</Text>
                    </Pressable>
                    <Pressable
                      disabled={isSaving}
                      onPress={() => confirmNextStep(request.status)}
                      style={[
                        styles.primaryButton,
                        isSaving && styles.disabled,
                      ]}
                    >
                      <Text style={styles.primaryText}>
                        {getNextActionLabel(request.status)}
                      </Text>
                    </Pressable>
                  </View>
                )
              ) : null}

              {request.status === 'rejected' ? (
                <View style={styles.completedNote}>
                  <Text style={styles.noteLabel}>반려 사유</Text>
                  <Text style={styles.completedText}>{request.admin_note}</Text>
                </View>
              ) : null}

              {request.status === 'approved' ? (
                <View style={styles.completedNote}>
                  <Text style={styles.completedTitle}>
                    ERP 신청 확인과 승인이 완료되었습니다.
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

function getNextStatus(
  status: RoomReservationStatus,
): RoomReservationStatus | null {
  if (status === 'submitted') return 'received';
  if (status === 'received') return 'erp_checking';
  if (status === 'erp_checking') return 'approved';
  return null;
}

function getNextActionLabel(status: RoomReservationStatus) {
  if (status === 'submitted') return '접수하기';
  if (status === 'received') return 'ERP 확인하기';
  if (status === 'erp_checking') return '승인 완료';
  return '';
}

function getNextActionMessage(status: RoomReservationStatus) {
  if (status === 'submitted') return '이 신청을 접수 완료로 변경하시겠습니까?';
  if (status === 'received') return '통합정보시스템 신청 확인을 시작하시겠습니까?';
  return 'ERP 신청 내용과 중복 시간을 확인하고 승인하시겠습니까?';
}

function getWorkflowText(status: RoomReservationStatus) {
  if (status === 'submitted') return '신청 내용을 확인한 뒤 접수해 주세요.';
  if (status === 'received') return '통합정보시스템의 신청 내용을 확인해 주세요.';
  if (status === 'erp_checking') return 'ERP 신청 내용과 예약 중복을 확인한 뒤 승인해 주세요.';
  if (status === 'approved') return 'ERP 신청 확인과 승인이 완료되었습니다.';
  return '반려 사유가 학생에게 전달되었습니다.';
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  flex: { flex: 1 },
  header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  headerSide: { width: 40 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  studentCard: { padding: 18, flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: COLORS.navy },
  studentArea: { flex: 1 },
  studentName: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  studentNumber: { marginTop: 6, color: '#D9DDEF', fontSize: 11 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)' },
  statusText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  detailCard: { marginTop: 15, padding: 18, gap: 16, borderWidth: 1, borderColor: COLORS.border, borderRadius: 17, backgroundColor: COLORS.surface },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  detailLabel: { width: 78, color: COLORS.subText, fontSize: 12, fontWeight: '700' },
  detailValue: { flex: 1, color: COLORS.text, fontSize: 14, lineHeight: 21, fontWeight: '700' },
  purposeSection: { paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  purpose: { marginTop: 10, color: COLORS.text, fontSize: 14, lineHeight: 23 },
  workflowCard: { marginTop: 15, padding: 18, borderWidth: 1, borderColor: COLORS.border, borderRadius: 17, backgroundColor: COLORS.surface },
  workflowTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  workflowText: { marginTop: 7, color: COLORS.subText, fontSize: 12, lineHeight: 19 },
  actionRow: { marginTop: 18, flexDirection: 'row', gap: 9 },
  rejectButton: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F4B8BE', borderRadius: 13, backgroundColor: '#FFF7F8' },
  rejectText: { color: COLORS.error, fontSize: 14, fontWeight: '800' },
  primaryButton: { flex: 2, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: COLORS.navy },
  primaryText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  noteArea: { marginTop: 18 },
  noteLabel: { marginBottom: 9, color: COLORS.text, fontSize: 13, fontWeight: '800' },
  noteInput: { minHeight: 130, padding: 14, borderWidth: 1, borderColor: COLORS.border, borderRadius: 13, backgroundColor: COLORS.background, color: COLORS.text, fontSize: 14, lineHeight: 22 },
  cancelButton: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 13, backgroundColor: COLORS.surface },
  cancelText: { color: COLORS.subText, fontSize: 14, fontWeight: '800' },
  rejectSubmitButton: { flex: 2, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: COLORS.error },
  completedNote: { marginTop: 18, padding: 15, borderRadius: 13, backgroundColor: COLORS.background },
  completedText: { color: COLORS.text, fontSize: 13, lineHeight: 21 },
  completedTitle: { color: COLORS.success, fontSize: 13, fontWeight: '800' },
  disabled: { opacity: 0.55 },
});
