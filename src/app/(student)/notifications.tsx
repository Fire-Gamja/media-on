import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '../../components/common/AppIcon';
import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  deleteNotification,
  getMyNotifications,
  markNotificationRead,
  type AppNotification,
} from '../../services/notifications';

export default function StudentNotificationsScreen() {
  const [notifications, setNotifications] =
    useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotifications = useCallback(async (refreshing = false) => {
    if (!isSupabaseConfigured) {
      return;
    }

    refreshing ? setIsRefreshing(true) : setIsLoading(true);

    try {
      setNotifications(await getMyNotifications());
    } catch {
      setNotifications([]);
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

  const openNotification = async (notification: AppNotification) => {
    if (!notification.is_read) {
      await markNotificationRead(notification.id);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item,
        ),
      );
    }

    if (notification.route) {
      router.push(notification.route);
    }
  };

  const removeNotification = async (notification: AppNotification) => {
    try {
      await deleteNotification(notification.id);
      setNotifications((current) =>
        current.filter((item) => item.id !== notification.id),
      );
    } catch {
      Alert.alert('삭제 실패', '알림을 삭제하지 못했습니다.');
    }
  };

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
          <PlatformHeaderIcon name="back" />
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
              <Swipeable
                key={notification.id}
                overshootRight={false}
                renderRightActions={() => (
                  <Pressable
                    accessibilityLabel="알림 삭제"
                    onPress={() => void removeNotification(notification)}
                    style={styles.deleteAction}
                  >
                    <AppIcon color="#FFFFFF" name="trash" size={22} />
                    <Text style={styles.deleteText}>삭제</Text>
                  </Pressable>
                )}
              >
                <Pressable
                  onPress={() => void openNotification(notification)}
                  style={[
                    styles.notificationCard,
                    !notification.is_read && styles.unreadCard,
                  ]}
                >
                  <View style={styles.notificationTitleRow}>
                    <View style={styles.titleArea}>
                      {!notification.is_read ? (
                        <View style={styles.unreadDot} />
                      ) : null}
                      <Text
                        style={[
                          styles.notificationTitle,
                          !notification.is_read && styles.unreadTitle,
                        ]}
                      >
                        {notification.title}
                      </Text>
                    </View>
                    <Text style={styles.notificationTime}>
                      {formatTime(notification.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.notificationDescription}>
                    {notification.body}
                  </Text>
                </Pressable>
              </Swipeable>
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
  deleteAction: {
    width: 78,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 16,
    backgroundColor: '#D92D20',
  },
  deleteText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 12,
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
  unreadCard: {
    borderColor: '#C7CDEE',
    backgroundColor: '#F1F3FC',
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  notificationTitle: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 16,
  },
  titleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#182365',
  },
  unreadTitle: {
    fontFamily: 'FreesentationExtraBold',
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
