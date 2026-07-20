import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants/colors';
import { getAuthErrorMessage } from '../../../services/auth';
import { getMyRoomReservationRequest, getRoomStatusLabel, type RoomReservationRequest } from '../../../services/room-reservations';

export default function RoomRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const requestId = Array.isArray(id) ? id[0] : id;
  const [request, setRequest] = useState<RoomReservationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!requestId) { router.back(); return; }
    void getMyRoomReservationRequest(requestId).then(setRequest).catch((error) => Alert.alert('조회 실패', getAuthErrorMessage(error), [{ text: '확인', onPress: () => router.back() }])).finally(() => setIsLoading(false));
  }, [requestId]);

  return <SafeAreaView style={styles.safeArea} edges={['top']}>
    <StatusBar style="dark" /><View style={styles.header}><Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.headerTitle}>실습실 신청 상세</Text><View style={styles.headerSide} /></View>
    {isLoading ? <View style={styles.loadingBox}><ActivityIndicator size="large" color={COLORS.navy} /></View> : request ? <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <View style={styles.statusCard}><Text style={styles.statusLabel}>현재 상태</Text><Text style={styles.statusValue}>{getRoomStatusLabel(request.status)}</Text><Text style={styles.statusDescription}>{getStatusDescription(request)}</Text></View>
      <View style={styles.card}><DetailRow label="실습실" value={request.room?.name ?? '실습실'} /><DetailRow label="이용일" value={request.reservation_date} /><DetailRow label="이용 시간" value={`${request.start_time.slice(0, 5)}~${request.end_time.slice(0, 5)}`} /><DetailRow label="이용 인원" value="40명 고정" /><View style={styles.purposeSection}><Text style={styles.detailLabel}>사용 목적</Text><Text style={styles.purpose}>{request.purpose}</Text></View></View>
      <View style={styles.noteCard}><Text style={styles.noteTitle}>{request.status === 'rejected' ? '반려 사유' : '관리자 안내'}</Text><Text style={styles.noteText}>{request.admin_note?.trim() || getDefaultNote(request.status)}</Text></View>
    </ScrollView> : null}
  </SafeAreaView>;
}

function DetailRow({ label, value }: { label: string; value: string }) { return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>; }
function getStatusDescription(request: RoomReservationRequest) {
  if (request.status === 'submitted') return '관리자가 신청 내용을 확인 중입니다.';
  if (request.status === 'received') return '신청이 접수되어 ERP 등록 내용을 확인할 예정입니다.';
  if (request.status === 'erp_checking') return '통합정보시스템의 신청 내용을 확인 중입니다.';
  if (request.status === 'approved') return '통합정보시스템 신청 확인과 승인이 완료되었습니다.';
  return '신청이 반려되었습니다. 아래 사유를 확인해 주세요.';
}
function getDefaultNote(status: RoomReservationRequest['status']) {
  if (status === 'submitted') return '승인 결과를 기다려 주세요.';
  if (status === 'received') return '신청 접수가 완료되었습니다.';
  if (status === 'erp_checking') return 'ERP 신청 정보를 확인하고 있습니다.';
  if (status === 'approved') return 'ERP 신청 확인과 승인이 완료되었습니다.';
  return '등록된 반려 사유가 없습니다.';
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface }, header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border }, backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 }, headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' }, headerSide: { width: 40 }, loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }, scrollView: { flex: 1, backgroundColor: COLORS.background }, content: { padding: 20, paddingBottom: 40 },
  statusCard: { padding: 20, borderRadius: 18, backgroundColor: COLORS.navy }, statusLabel: { color: '#D9DDEF', fontSize: 12, fontWeight: '700' }, statusValue: { marginTop: 8, color: COLORS.white, fontSize: 23, fontWeight: '900' }, statusDescription: { marginTop: 10, color: '#D9DDEF', fontSize: 12, lineHeight: 19 }, card: { marginTop: 16, padding: 19, gap: 17, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, backgroundColor: COLORS.surface }, detailRow: { flexDirection: 'row', alignItems: 'flex-start' }, detailLabel: { width: 78, color: COLORS.subText, fontSize: 12, fontWeight: '700' }, detailValue: { flex: 1, color: COLORS.text, fontSize: 14, lineHeight: 21, fontWeight: '700' }, purposeSection: { paddingTop: 17, borderTopWidth: 1, borderTopColor: COLORS.border }, purpose: { marginTop: 10, color: COLORS.text, fontSize: 14, lineHeight: 23 }, noteCard: { marginTop: 16, padding: 19, borderRadius: 18, backgroundColor: COLORS.softNavy }, noteTitle: { color: COLORS.navy, fontSize: 14, fontWeight: '800' }, noteText: { marginTop: 10, color: COLORS.text, fontSize: 13, lineHeight: 21 },
});
