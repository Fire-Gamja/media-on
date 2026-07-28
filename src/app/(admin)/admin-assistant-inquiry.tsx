import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssistantChatRoom } from '../../components/assistant/AssistantChatRoom';
import { COLORS } from '../../constants/colors';
import {
  getAdminAssistantInquiry,
  getAssistantCategoryLabel,
  getAssistantStatusLabel,
  type AdminAssistantInquiry,
  type AssistantInquiryStatus,
} from '../../services/assistant-inquiries';
import { getAuthErrorMessage } from '../../services/auth';

export default function AdminAssistantInquiryScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const inquiryId = Array.isArray(id) ? id[0] : id;
  const [inquiry, setInquiry] = useState<AdminAssistantInquiry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!inquiryId) {
      router.back();
      return;
    }

    void getAdminAssistantInquiry(inquiryId)
      .then(setInquiry)
      .catch((error) =>
        Alert.alert('조회 실패', getAuthErrorMessage(error), [
          { text: '확인', onPress: () => router.back() },
        ]),
      )
      .finally(() => setIsLoading(false));
  }, [inquiryId]);

  const handleStatusChange = (status: AssistantInquiryStatus) => {
    setInquiry((current) => (current ? { ...current, status } : current));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>조교 문의 상담</Text>
        <View style={styles.headerSide} />
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.navy} />
        </View>
      ) : inquiry ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.studentCard}>
            <View style={styles.studentArea}>
              <Text style={styles.studentName}>
                {inquiry.requester?.name ?? '학생'}
              </Text>
              <Text style={styles.studentNumber}>
                {inquiry.requester?.student_number ?? '학번 미확인'}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {getAssistantStatusLabel(inquiry.status)}
              </Text>
            </View>
          </View>

          <View style={styles.inquiryCard}>
            <Text style={styles.category}>
              {getAssistantCategoryLabel(inquiry.category)}
            </Text>
            <Text style={styles.title}>{inquiry.title}</Text>
            <Text style={styles.date}>
              {formatDate(inquiry.created_at)} 문의
            </Text>
            <View style={styles.contentSection}>
              <Text style={styles.sectionLabel}>문의 내용</Text>
              <Text style={styles.bodyText}>{inquiry.content}</Text>
            </View>
          </View>

          <View style={styles.chatCard}>
            <Text style={styles.chatTitle}>실시간 상담</Text>
            <Text style={styles.chatDescription}>
              채팅 시작 후 학생과 실시간으로 대화할 수 있습니다.
            </Text>
            <AssistantChatRoom
              canStartChat
              inquiryId={inquiry.id}
              onStatusChange={handleStatusChange}
              status={inquiry.status}
            />
          </View>
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
    hour: '2-digit',
    minute: '2-digit',
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
  backText: {
    width: 40,
    color: COLORS.navy,
    fontSize: 38,
    lineHeight: 40,
  },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  headerSide: { width: 40 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 80 },
  studentCard: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: COLORS.navy,
  },
  studentArea: { flex: 1 },
  studentName: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  studentNumber: { marginTop: 6, color: '#D9DDEF', fontSize: 11 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  statusText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  inquiryCard: {
    marginTop: 15,
    padding: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
  },
  category: { color: COLORS.subText, fontSize: 11, fontWeight: '700' },
  title: {
    marginTop: 7,
    color: COLORS.text,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '800',
  },
  date: { marginTop: 8, color: COLORS.placeholder, fontSize: 11 },
  contentSection: {
    marginTop: 18,
    paddingTop: 17,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionLabel: { color: COLORS.subText, fontSize: 12, fontWeight: '800' },
  bodyText: {
    marginTop: 10,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 23,
  },
  chatCard: {
    marginTop: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
  },
  chatTitle: {
    paddingTop: 18,
    paddingHorizontal: 18,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  chatDescription: {
    marginTop: 7,
    paddingHorizontal: 18,
    color: COLORS.subText,
    fontSize: 12,
    lineHeight: 19,
  },
});
