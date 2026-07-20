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
  type EquipmentRentalRequest,
  type EquipmentRequestStatus,
  getEquipmentStatusLabel,
  getMyEquipmentRentalRequests,
} from '../../../services/equipment-rentals';

export default function EquipmentRequestsScreen() {
  const [requests, setRequests] = useState<EquipmentRentalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRequests = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);

    try {
      setErrorMessage(null);
      setRequests(await getMyEquipmentRentalRequests());
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>내 대여 신청</Text>
        <Pressable
          onPress={() => router.push('/equipment')}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Text style={styles.addText}>신청</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadRequests(true)}
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
            <Text style={styles.errorTitle}>신청 내역을 불러오지 못했습니다.</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable onPress={() => void loadRequests()} style={styles.retryButton}>
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.emptyTitle}>대여 신청 내역이 없습니다.</Text>
            <Pressable onPress={() => router.push('/equipment')} style={styles.retryButton}>
              <Text style={styles.retryText}>기자재 둘러보기</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {requests.map((request) => {
              const statusStyle = getStatusStyle(request.status);
              return (
                <Pressable
                  key={request.id}
                  onPress={() =>
                    router.push(`/equipment-requests/${request.id}`)
                  }
                  style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.category}>
                      {request.equipment?.category ?? '기자재'}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                      <Text style={[styles.statusText, { color: statusStyle.color }]}>
                        {getEquipmentStatusLabel(request.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.title}>
                    {request.equipment?.name ?? '기자재'} {request.quantity}개
                  </Text>
                  <Text style={styles.period}>
                    {formatDate(request.pickup_date)} ~ {formatDate(request.return_date)}
                  </Text>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStatusStyle(status: EquipmentRequestStatus) {
  if (status === 'approved') return { backgroundColor: '#FFF3DB', color: '#9A5B00' };
  if (status === 'checked_out') return { backgroundColor: COLORS.softNavy, color: COLORS.navy };
  if (status === 'returned') return { backgroundColor: '#EAF8F0', color: COLORS.success };
  if (status === 'rejected') return { backgroundColor: '#FCECEF', color: COLORS.error };
  return { backgroundColor: '#F1F2F6', color: COLORS.subText };
}

function formatDate(value: string) {
  return value.replaceAll('-', '.');
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
  stateBox: { minHeight: 270, padding: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: COLORS.surface },
  errorTitle: { color: COLORS.error, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  stateText: { marginTop: 10, color: COLORS.subText, fontSize: 13, textAlign: 'center' },
  retryButton: { marginTop: 18, minHeight: 42, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: COLORS.navy },
  retryText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  list: { gap: 12 },
  card: { padding: 18, borderWidth: 1, borderColor: COLORS.border, borderRadius: 17, backgroundColor: COLORS.surface },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  category: { color: COLORS.subText, fontSize: 11, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800' },
  title: { marginTop: 14, paddingRight: 30, color: COLORS.text, fontSize: 16, fontWeight: '800' },
  period: { marginTop: 9, color: COLORS.subText, fontSize: 12 },
  chevron: { position: 'absolute', right: 17, bottom: 13, color: COLORS.subText, fontSize: 23 },
  pressed: { opacity: 0.7 },
});
