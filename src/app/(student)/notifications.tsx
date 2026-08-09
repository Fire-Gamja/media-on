import { router, useFocusEffect, type Href } from 'expo-router';
import { Image as SvgImage } from 'expo-image';
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
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  deleteAllMyNotifications,
  deleteNotification,
  getMyNotifications,
  markNotificationRead,
  type AppNotification,
} from '../../services/notifications';

const backIcon = require('../../../assets/figma/student-v2/back-button.svg');

export default function StudentNotificationsScreen() {
  const [notifications, setNotifications] =
    useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

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
      router.push(notification.route as Href);
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

  const removeAllNotifications = () => {
    Alert.alert(
      '알림 전체 삭제',
      '모든 알림을 삭제하시겠습니까? 삭제한 알림은 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '전체 삭제',
          style: 'destructive',
          onPress: () => {
            setIsDeletingAll(true);
            void deleteAllMyNotifications()
              .then(() => setNotifications([]))
              .catch(() => {
                Alert.alert('삭제 실패', '알림을 모두 삭제하지 못했습니다.');
              })
              .finally(() => setIsDeletingAll(false));
          },
        },
      ],
    );
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
          <SvgImage
            contentFit="contain"
            source={backIcon}
            style={styles.backIcon}
          />
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
        {!isLoading && notifications.length > 0 ? (
          <View style={styles.deleteAllRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="알림 전체 삭제"
              disabled={isDeletingAll}
              hitSlop={8}
              onPress={removeAllNotifications}
              style={({ pressed }) => [
                styles.deleteAllButton,
                (pressed || isDeletingAll) && styles.pressed,
              ]}
            >
              <Text style={styles.deleteAllText}>
                {isDeletingAll ? '삭제 중' : '전체 삭제'}
              </Text>
            </Pressable>
          </View>
        ) : null}

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
                  style={styles.notificationCard}
                >
                  <View style={styles.notificationTitleRow}>
                    <View style={styles.titleArea}>
                      <Text numberOfLines={1} style={styles.notificationTitle}>
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
  const date = new Date(value);
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isToday) {
    return '오늘';
  }

  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
    backgroundColor: '#FFFFFF',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    flex: 1,
    color: '#1A2035',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 18,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  deleteAllRow: {
    minHeight: 18,
    marginBottom: 14,
    paddingHorizontal: 4,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  deleteAllButton: {
    minHeight: 18,
    justifyContent: 'center',
  },
  deleteAllText: {
    color: '#7E7E7E',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
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
    minHeight: 78,
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
    color: '#000000',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 16,
  },
  titleArea: {
    flex: 1,
  },
  notificationTime: {
    color: '#8C8C8C',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
  },
  notificationDescription: {
    marginTop: 12,
    color: '#000000',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
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
