import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants/colors';
import { getAuthErrorMessage } from '../../../services/auth';
import {
  getPublishedNotice,
  type Notice,
} from '../../../services/notices';

export default function NoticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const noticeId = Array.isArray(id) ? id[0] : id;
  const [notice, setNotice] = useState<Notice | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!noticeId) {
      setErrorMessage('공지사항 주소가 올바르지 않습니다.');
      return;
    }

    void getPublishedNotice(noticeId)
      .then(setNotice)
      .catch((error) => setErrorMessage(getAuthErrorMessage(error)));
  }, [noticeId]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>공지사항</Text>
        <View style={styles.headerSide} />
      </View>

      {!notice && !errorMessage ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color={COLORS.navy} />
        </View>
      ) : errorMessage ? (
        <View style={styles.stateBox}>
          <Text style={styles.errorTitle}>{errorMessage}</Text>
        </View>
      ) : notice ? (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.title}>{notice.title}</Text>
          <Text style={styles.date}>
            {formatDate(notice.published_at ?? notice.created_at)}
          </Text>
          <View style={styles.divider} />
          <Text style={styles.body}>{notice.content}</Text>
        </ScrollView>
      ) : null}
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
  header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  headerSide: { width: 40 },
  stateBox: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  errorTitle: { color: COLORS.error, fontSize: 14, textAlign: 'center' },
  scrollView: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: 24, paddingBottom: 48 },
  title: { color: COLORS.text, fontSize: 23, lineHeight: 33, fontWeight: '800' },
  date: { marginTop: 14, color: COLORS.subText, fontSize: 12 },
  divider: { height: 1, marginVertical: 24, backgroundColor: COLORS.border },
  body: { color: COLORS.text, fontSize: 15, lineHeight: 26 },
});
