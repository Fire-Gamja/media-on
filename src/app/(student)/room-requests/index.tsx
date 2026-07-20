import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants/colors';
import { getAuthErrorMessage } from '../../../services/auth';
import { getMyRoomReservationRequests, getRoomStatusLabel, type RoomReservationRequest, type RoomReservationStatus } from '../../../services/room-reservations';

export default function RoomRequestsScreen() {
  const [requests, setRequests] = useState<RoomReservationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loadRequests = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);
    try { setErrorMessage(null); setRequests(await getMyRoomReservationRequests()); }
    catch (error) { setErrorMessage(getAuthErrorMessage(error)); }
    finally { setIsLoading(false); setIsRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { void loadRequests(); }, [loadRequests]));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.backText}>‹</Text></Pressable>
        <Text style={styles.headerTitle}>내 실습실 신청</Text>
        <Pressable onPress={() => router.push('/rooms')} style={styles.addButton}><Text style={styles.addText}>신청</Text></Pressable>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadRequests(true)} colors={[COLORS.navy]} />}>
        {isLoading ? <View style={styles.stateBox}><ActivityIndicator size="large" color={COLORS.navy} /></View>
          : errorMessage ? <View style={styles.stateBox}><Text style={styles.errorTitle}>신청 내역을 불러오지 못했습니다.</Text><Text style={styles.stateText}>{errorMessage}</Text><Pressable onPress={() => void loadRequests()} style={styles.retryButton}><Text style={styles.retryText}>다시 시도</Text></Pressable></View>
          : requests.length === 0 ? <View style={styles.stateBox}><Text style={styles.emptyTitle}>실습실 대여 신청이 없습니다.</Text><Pressable onPress={() => router.push('/rooms')} style={styles.retryButton}><Text style={styles.retryText}>실습실 둘러보기</Text></Pressable></View>
          : <View style={styles.list}>{requests.map((request) => { const statusStyle = getStatusStyle(request.status); return <Pressable key={request.id} onPress={() => router.push(`/room-requests/${request.id}`)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <View style={styles.cardTop}><Text style={styles.location}>{request.room?.location ?? '실습실'}</Text><View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}><Text style={[styles.statusText, { color: statusStyle.color }]}>{getRoomStatusLabel(request.status)}</Text></View></View>
              <Text style={styles.title}>{request.room?.name ?? '실습실'}</Text><Text style={styles.schedule}>{request.reservation_date} · {request.start_time.slice(0, 5)}~{request.end_time.slice(0, 5)}</Text><Text style={styles.chevron}>›</Text>
            </Pressable>; })}</View>}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStatusStyle(status: RoomReservationStatus) {
  if (status === 'approved') return { backgroundColor: COLORS.softNavy, color: COLORS.navy };
  if (status === 'completed') return { backgroundColor: '#EAF8F0', color: COLORS.success };
  if (status === 'rejected') return { backgroundColor: '#FCECEF', color: COLORS.error };
  return { backgroundColor: '#F1F2F6', color: COLORS.subText };
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface }, header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border }, backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 }, headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' }, addButton: { minWidth: 44, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: COLORS.navy }, addText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  scrollView: { flex: 1, backgroundColor: COLORS.background }, content: { padding: 20, paddingBottom: 40 }, stateBox: { minHeight: 270, padding: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: COLORS.surface }, errorTitle: { color: COLORS.error, fontSize: 15, fontWeight: '800', textAlign: 'center' }, emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' }, stateText: { marginTop: 10, color: COLORS.subText, fontSize: 13, textAlign: 'center' }, retryButton: { marginTop: 18, minHeight: 42, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: COLORS.navy }, retryText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  list: { gap: 12 }, card: { padding: 18, borderWidth: 1, borderColor: COLORS.border, borderRadius: 17, backgroundColor: COLORS.surface }, cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, location: { color: COLORS.subText, fontSize: 11, fontWeight: '700' }, statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 }, statusText: { fontSize: 11, fontWeight: '800' }, title: { marginTop: 14, color: COLORS.text, fontSize: 16, fontWeight: '800' }, schedule: { marginTop: 9, color: COLORS.subText, fontSize: 12 }, chevron: { position: 'absolute', right: 17, bottom: 13, color: COLORS.subText, fontSize: 23 }, pressed: { opacity: 0.7 },
});
