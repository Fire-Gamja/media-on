import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
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

import { COLORS } from '../../../constants/colors';
import { getAuthErrorMessage } from '../../../services/auth';
import {
  formatNoticeTitle,
  getPublishedNotices,
  type Notice,
} from '../../../services/notices';

const backIcon = require('../../../../assets/figma/student/back.png');
const homeIcon = require('../../../../assets/figma/student/home.png');
const sirenIcon = require('../../../../assets/figma/student/siren.png');

export default function NoticesScreen() {
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
        <Text style={styles.headerTitle}>학과 공지사항</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="홈으로 이동"
          hitSlop={8}
          onPress={() => router.replace('/home')}
          style={({ pressed }) => [
            styles.headerIconButton,
            pressed && styles.pressed,
          ]}
        >
          <Image source={homeIcon} style={styles.headerIcon} />
        </Pressable>
      </View>

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
                  <View style={styles.titleRow}>
                    {notice.is_urgent ? (
                      <Image source={sirenIcon} style={styles.sirenIcon} />
                    ) : null}
                    <Text numberOfLines={2} style={styles.title}>
                      {formatNoticeTitle(
                        notice.title,
                        notice.is_urgent,
                      )}
                    </Text>
                  </View>
                  <Text style={styles.date}>
                    {formatDate(notice.published_at ?? notice.created_at)}
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

function formatDate(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}.${month}.${day}~ ${hour}:${minute}`;
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
  noticeRow: {
    minHeight: 77,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  noticeTextArea: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  sirenIcon: {
    width: 18,
    height: 18,
    marginTop: 1,
    resizeMode: 'contain',
  },
  title: {
    flex: 1,
    color: '#2D2D2D',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 16,
    lineHeight: 21,
  },
  date: {
    marginTop: 8,
    color: '#2D2D2D',
    fontFamily: 'FreesentationRegular',
    fontSize: 13,
  },
  chevron: {
    color: '#5C5C5C',
    fontFamily: 'FreesentationRegular',
    fontSize: 34,
    lineHeight: 36,
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
});
