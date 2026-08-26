import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
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

import { StudentBottomNavigation } from '../../../components/student/StudentBottomNavigation';
import { StudentTopBar } from '../../../components/student/StudentTopBar';
import { useAppSettings } from '../../../context/app-settings-context';
import { translate } from '../../../i18n/translations';
import { COLORS } from '../../../constants/colors';
import { getAuthErrorMessage } from '../../../services/auth';
import {
  formatNoticeTitle,
  getPublishedNotices,
  type Notice,
} from '../../../services/notices';

export default function NoticesScreen() {
  const { language } = useAppSettings();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadNotices = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);

    try {
      setErrorMessage(null);
      setNotices(await getPublishedNotices());
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadNotices();
  }, [loadNotices]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      <StudentTopBar />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[COLORS.navy]}
            onRefresh={() => void loadNotices(true)}
            refreshing={isRefreshing}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>{translate(language, 'notices.title')}</Text>
        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#182365" size="large" />
          </View>
        ) : errorMessage ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorTitle}>
              공지사항을 불러오지 못했습니다.
            </Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable
              onPress={() => void loadNotices()}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : notices.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.emptyTitle}>게시된 공지사항이 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notices.map((notice) => (
              <Pressable
                key={notice.id}
                onPress={() => router.push(`/notices/${notice.id}`)}
                style={({ pressed }) => [
                  styles.noticeRow,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.noticeTextArea}>
                  <Text numberOfLines={2} style={styles.title}>
                    {formatNoticeTitle(notice.title, notice.is_urgent)}
                  </Text>
                  <Text style={styles.date}>
                    {formatDate(notice.published_at ?? notice.created_at)}
                  </Text>
                  {notice.attachments.length > 0 ? (
                    <View style={styles.attachmentBadge}>
                      <Text style={styles.attachmentBadgeText}>
                        첨부 {notice.attachments.length}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
      <StudentBottomNavigation activeTab="notices" />
    </SafeAreaView>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}.${month}.${day}`;
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
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    position: 'absolute',
    right: 48,
    left: 48,
    color: '#2D2D2D',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
  },
  list: {},
  noticeRow: {
    minHeight: 78,
    paddingVertical: 16,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
    backgroundColor: '#FFFFFF',
  },
  noticeTextArea: {
    flex: 1,
  },
  title: {
    color: '#000000',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 16,
    lineHeight: 21,
  },
  date: {
    marginTop: 12,
    color: '#000000',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
  },
  attachmentBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EEF1FF',
  },
  attachmentBadgeText: {
    color: '#3550FF',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 11,
  },
  stateBox: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    color: COLORS.error,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 16,
  },
  stateText: {
    marginTop: 10,
    color: '#8C8C8C',
    fontFamily: 'FreesentationRegular',
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    height: 42,
    marginTop: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#182365',
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 13,
  },
  emptyTitle: {
    color: '#8C8C8C',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 15,
  },
  pressed: {
    opacity: 0.65,
  },
  pageTitle: {
    marginBottom: 18,
    color: '#1E2024',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 22,
  },
});
