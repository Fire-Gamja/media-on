import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isSupabaseConfigured } from '../../lib/supabase';
import {
  getEquipmentStatusLabel,
  getMyEquipmentRentalRequests,
} from '../../services/equipment-rentals';

const backIcon = require('../../../assets/figma/student/back.png');

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
};

const DEMO_NOTIFICATIONS: NotificationItem[] = Array.from(
  { length: 5 },
  (_, index) => ({
    id: `demo-notification-${index}`,
    title: '기자재 대여 상태 변경',
    description: '신청 상태가 대여 중(으)로 변경되었습니다.',
    time: '16:38',
  }),
);

export default function StudentNotificationsScreen() {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(DEMO_NOTIFICATIONS);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotifications = useCallback(async (refreshing = false) => {
    if (!isSupabaseConfigured) {
      return;
    }

    refreshing ? setIsRefreshing(true) : setIsLoading(true);

    try {
      const requests = await getMyEquipmentRentalRequests(10);
      setNotifications(
        requests.length > 0
          ? requests.map((request) => ({
              id: request.id,
              title: '기자재 대여 상태 변경',
              description: `신청 상태가 ${getEquipmentStatusLabel(
                request.status,
              )}(으)로 변경되었습니다.`,
              time: formatTime(request.updated_at),
            }))
          : [],
      );
    } catch {
      setNotifications(DEMO_NOTIFICATIONS);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.headerIconButton,
            pressed && styles.pressed,
          ]}
        >
          <Image source={backIcon} style={styles.headerIcon} />
        </Pressable>
        <Text style={styles.headerTitle}>알림</Text>
        <View style={styles.headerIconButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={['#182365']}
            onRefresh={() => void loadNotifications(true)}
            refreshing={isRefreshing}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#182365" size="large" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.emptyTitle}>새로운 알림이 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((notification) => (
              <View key={notification.id} style={styles.notificationCard}>
                <View style={styles.notificationTitleRow}>
                  <Text style={styles.notificationTitle}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {notification.time}
                  </Text>
                </View>
                <Text style={styles.notificationDescription}>
                  {notification.description}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  headerIconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  headerTitle: {
    flex: 1,
    color: '#2D2D2D',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  list: {
    gap: 16,
  },
  notificationCard: {
    minHeight: 77,
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F2F2F2',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  notificationTitle: {
    flex: 1,
    color: '#2D2D2D',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 16,
  },
  notificationTime: {
    color: '#9C9C9C',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
  },
  notificationDescription: {
    marginTop: 10,
    color: '#2D2D2D',
    fontFamily: 'FreesentationRegular',
    fontSize: 13,
  },
  stateBox: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#8C8C8C',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 15,
  },
  pressed: {
    opacity: 0.65,
  },
});
