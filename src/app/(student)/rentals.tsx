import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '../../components/common/AppIcon';
import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import { COLORS } from '../../constants/colors';

const RENTAL_MENUS = [
  {
    title: '기자재 대여',
    description: '카메라, 노트북, 태블릿 등 학부 기자재를 신청합니다.',
    icon: 'equipment' as const,
    route: '/equipment' as const,
    historyRoute: '/equipment-requests' as const,
  },
  {
    title: '실습실 대여',
    description: '제1자연관 학부 실습실의 이용 일정을 신청합니다.',
    icon: 'room' as const,
    route: '/rooms' as const,
    historyRoute: '/room-requests' as const,
  },
];

export default function StudentRentalsScreen() {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.headerSide}
        >
          <PlatformHeaderIcon name="back" />
        </Pressable>
        <Text style={styles.headerTitle}>대여</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        style={styles.scrollView}
      >
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>필요한 대여 항목을 선택하세요.</Text>
          <Text style={styles.guideText}>
            기자재와 실습실의 신청 및 진행 상태를 각각 확인할 수 있습니다.
          </Text>
        </View>

        {RENTAL_MENUS.map((menu) => (
          <View key={menu.title} style={styles.card}>
            <View style={styles.iconBox}>
              <AppIcon name={menu.icon} size={36} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{menu.title}</Text>
              <Text style={styles.cardDescription}>{menu.description}</Text>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => router.push(menu.historyRoute)}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryText}>내 신청</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push(menu.route)}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryText}>대여 신청</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerSide: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: COLORS.text, fontSize: 19, fontWeight: '900' },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 48, gap: 15 },
  guideCard: {
    marginBottom: 3,
    padding: 19,
    borderRadius: 18,
    backgroundColor: COLORS.navy,
  },
  guideTitle: { color: COLORS.white, fontSize: 17, fontWeight: '900' },
  guideText: {
    marginTop: 7,
    color: '#D9DDEF',
    fontSize: 12,
    lineHeight: 19,
  },
  card: {
    padding: 18,
    flexDirection: 'row',
    gap: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  iconBox: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: COLORS.softNavy,
  },
  cardText: { flex: 1 },
  cardTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  cardDescription: {
    marginTop: 7,
    color: COLORS.subText,
    fontSize: 12,
    lineHeight: 18,
  },
  actions: { marginTop: 15, flexDirection: 'row', gap: 8 },
  secondaryButton: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
  },
  secondaryText: { color: COLORS.subText, fontSize: 12, fontWeight: '800' },
  primaryButton: {
    flex: 1.4,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: COLORS.navy,
  },
  primaryText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },
});
