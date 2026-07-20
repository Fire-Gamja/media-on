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
  getPracticeRooms,
  type PracticeRoom,
} from '../../../services/room-reservations';

export default function RoomsScreen() {
  const [rooms, setRooms] = useState<PracticeRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRooms = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);
    try {
      setErrorMessage(null);
      setRooms(await getPracticeRooms());
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRooms();
    }, [loadRooms]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>실습실 대여</Text>
        <Pressable onPress={() => router.push('/room-requests')}>
          <Text style={styles.historyText}>내 신청</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadRooms(true)}
            colors={[COLORS.navy]}
          />
        }
      >
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>이용할 실습실을 선택해 주세요.</Text>
          <Text style={styles.guideText}>
            같은 시간의 예약은 관리자 승인 과정에서 중복 여부를 확인합니다.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={COLORS.navy} />
          </View>
        ) : errorMessage ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorTitle}>실습실 목록을 불러오지 못했습니다.</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable onPress={() => void loadRooms()} style={styles.retryButton}>
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : rooms.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.emptyTitle}>대여 가능한 실습실이 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {rooms.map((room) => (
              <Pressable
                key={room.id}
                onPress={() =>
                  router.push({
                    pathname: '/room-request',
                    params: { roomId: room.id },
                  })
                }
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <View style={styles.iconBox}>
                  <Text style={styles.iconText}>실</Text>
                </View>
                <View style={styles.cardTextArea}>
                  <Text style={styles.location}>{room.location}</Text>
                  <Text style={styles.name}>{room.name}</Text>
                  <Text style={styles.description} numberOfLines={2}>
                    {room.description ?? '학부 공용 실습실'}
                  </Text>
                  <Text style={styles.meta}>
                    {formatTime(room.open_time)}~{formatTime(room.close_time)} · 최대 {room.capacity}명
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  historyText: { width: 48, color: COLORS.navy, fontSize: 12, fontWeight: '800', textAlign: 'right' },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  guideCard: { marginBottom: 18, padding: 18, borderRadius: 17, backgroundColor: COLORS.navy },
  guideTitle: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  guideText: { marginTop: 7, color: '#D9DDEF', fontSize: 12, lineHeight: 19 },
  stateBox: { minHeight: 260, padding: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: COLORS.surface },
  errorTitle: { color: COLORS.error, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  emptyTitle: { color: COLORS.subText, fontSize: 15, fontWeight: '700' },
  stateText: { marginTop: 10, color: COLORS.subText, fontSize: 13, textAlign: 'center' },
  retryButton: { marginTop: 18, minHeight: 42, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: COLORS.navy },
  retryText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  list: { gap: 12 },
  card: { minHeight: 136, padding: 17, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 17, backgroundColor: COLORS.surface },
  iconBox: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#EAF8F0' },
  iconText: { color: '#167447', fontSize: 16, fontWeight: '900' },
  cardTextArea: { flex: 1, marginLeft: 14, paddingRight: 10 },
  location: { color: COLORS.subText, fontSize: 11, fontWeight: '700' },
  name: { marginTop: 5, color: COLORS.text, fontSize: 16, fontWeight: '800' },
  description: { marginTop: 6, color: COLORS.subText, fontSize: 11, lineHeight: 17 },
  meta: { marginTop: 7, color: COLORS.navy, fontSize: 11, fontWeight: '800' },
  chevron: { color: COLORS.subText, fontSize: 25 },
  pressed: { opacity: 0.7 },
});
