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
  type EquipmentItem,
  getEquipmentItems,
} from '../../../services/equipment-rentals';

export default function EquipmentScreen() {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadItems = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);

    try {
      setErrorMessage(null);
      setItems(await getEquipmentItems());
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadItems();
    }, [loadItems]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>기자재 대여</Text>
        <Pressable
          onPress={() => router.push('/equipment-requests')}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Text style={styles.historyText}>내 신청</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadItems(true)}
            colors={[COLORS.navy]}
          />
        }
      >
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>대여할 기자재를 선택해 주세요.</Text>
          <Text style={styles.guideText}>
            신청 후 관리자 승인이 완료되면 지정한 날짜에 수령할 수 있습니다.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={COLORS.navy} />
          </View>
        ) : errorMessage ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorTitle}>기자재 목록을 불러오지 못했습니다.</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable onPress={() => void loadItems()} style={styles.retryButton}>
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.emptyTitle}>대여 가능한 기자재가 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  router.push({
                    pathname: '/equipment-request',
                    params: { equipmentId: item.id },
                  })
                }
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.cardIcon}>
                  <Text style={styles.cardIconText}>장</Text>
                </View>
                <View style={styles.cardTextArea}>
                  <Text style={styles.category}>{item.category}</Text>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.description} numberOfLines={2}>
                    {item.description ?? '학부 기자재 대여 품목'}
                  </Text>
                  <Text style={styles.quantity}>보유 수량 {item.total_quantity}개</Text>
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
  card: { minHeight: 132, padding: 17, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 17, backgroundColor: COLORS.surface },
  cardIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#FFF3E7' },
  cardIconText: { color: '#A85D11', fontSize: 16, fontWeight: '900' },
  cardTextArea: { flex: 1, marginLeft: 14, paddingRight: 12 },
  category: { color: COLORS.subText, fontSize: 11, fontWeight: '700' },
  name: { marginTop: 5, color: COLORS.text, fontSize: 16, fontWeight: '800' },
  description: { marginTop: 6, color: COLORS.subText, fontSize: 11, lineHeight: 17 },
  quantity: { marginTop: 7, color: COLORS.navy, fontSize: 11, fontWeight: '800' },
  chevron: { color: COLORS.subText, fontSize: 25 },
  pressed: { opacity: 0.7 },
});
