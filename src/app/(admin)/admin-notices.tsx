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
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/colors';
import { getAuthErrorMessage } from '../../services/auth';
import {
  deleteNotice,
  getAdminNotices,
  type Notice,
} from '../../services/notices';

export default function AdminNoticesScreen() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotices = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);

    try {
      setNotices(await getAdminNotices());
    } catch (error) {
      Alert.alert('조회 실패', getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadNotices();
    }, [loadNotices]),
  );

  const handleDelete = (notice: Notice) => {
    Alert.alert('공지 삭제', `“${notice.title}” 공지를 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNotice(notice.id);
            setNotices((current) =>
              current.filter((item) => item.id !== notice.id),
            );
          } catch (error) {
            Alert.alert('삭제 실패', getAuthErrorMessage(error));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>공지사항 관리</Text>
        <Pressable
          onPress={() => router.push('/admin-notice-editor')}
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.addText}>작성</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadNotices(true)}
            colors={[COLORS.navy]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={COLORS.navy} />
          </View>
        ) : notices.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.emptyTitle}>등록된 공지가 없습니다.</Text>
            <Text style={styles.emptyText}>상단의 작성 버튼을 눌러 주세요.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notices.map((notice) => (
              <View key={notice.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.statusBadge,
                      !notice.is_published && styles.draftBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        !notice.is_published && styles.draftText,
                      ]}
                    >
                      {notice.is_published ? '게시 중' : '임시 저장'}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>
                    {formatDate(notice.updated_at)}
                  </Text>
                </View>
                <Text style={styles.title} numberOfLines={2}>
                  {notice.title}
                </Text>
                <Text style={styles.preview} numberOfLines={2}>
                  {notice.content}
                </Text>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => handleDelete(notice)}
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.deleteText}>삭제</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/admin-notice-editor',
                        params: { id: notice.id },
                      })
                    }
                    style={({ pressed }) => [
                      styles.editButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.editText}>수정</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  addButton: {
    minWidth: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: COLORS.navy,
  },
  addText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.7 },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  stateBox: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  emptyText: { marginTop: 8, color: COLORS.subText, fontSize: 13 },
  list: { gap: 14 },
  card: {
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, backgroundColor: '#EAF8F0' },
  draftBadge: { backgroundColor: '#F1F2F6' },
  statusText: { color: COLORS.success, fontSize: 11, fontWeight: '800' },
  draftText: { color: COLORS.subText },
  dateText: { color: COLORS.placeholder, fontSize: 11 },
  title: { marginTop: 14, color: COLORS.text, fontSize: 17, lineHeight: 24, fontWeight: '800' },
  preview: { marginTop: 8, color: COLORS.subText, fontSize: 13, lineHeight: 20 },
  actions: { marginTop: 16, flexDirection: 'row', gap: 9 },
  deleteButton: { flex: 1, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 11 },
  deleteText: { color: COLORS.error, fontSize: 13, fontWeight: '800' },
  editButton: { flex: 2, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: COLORS.navy },
  editText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
});
