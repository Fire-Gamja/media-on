import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants/colors';
import { AssistantChatRoom } from '../../../components/assistant/AssistantChatRoom';
import { getAuthErrorMessage } from '../../../services/auth';
import { getAssistantCategoryLabel, getAssistantStatusLabel, getMyAssistantInquiry, type AssistantInquiry, type AssistantInquiryStatus } from '../../../services/assistant-inquiries';

export default function AssistantInquiryDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const inquiryId = Array.isArray(id) ? id[0] : id;
  const [inquiry, setInquiry] = useState<AssistantInquiry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!inquiryId) { router.back(); return; }
    void getMyAssistantInquiry(inquiryId).then(setInquiry).catch((error) => Alert.alert('조회 실패', getAuthErrorMessage(error), [{ text: '확인', onPress: () => router.back() }])).finally(() => setIsLoading(false));
  }, [inquiryId]);

  return <SafeAreaView style={styles.safeArea} edges={['top']}><StatusBar style="dark" /><View style={styles.header}><Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.headerTitle}>조교 문의 상세</Text><View style={styles.headerSide} /></View>
    {isLoading ? <View style={styles.loadingBox}><ActivityIndicator size="large" color={COLORS.navy} /></View> : inquiry ? <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <View style={styles.statusCard}><Text style={styles.statusLabel}>{getAssistantCategoryLabel(inquiry.category)}</Text><Text style={styles.statusValue}>{getAssistantStatusLabel(inquiry.status)}</Text><Text style={styles.statusDescription}>{getStatusDescription(inquiry.status)}</Text></View>
      <View style={styles.card}><Text style={styles.title}>{inquiry.title}</Text><Text style={styles.date}>{formatDate(inquiry.created_at)} 문의</Text><View style={styles.contentSection}><Text style={styles.sectionLabel}>문의 내용</Text><Text style={styles.bodyText}>{inquiry.content}</Text></View></View>
      <View style={styles.answerCard}><Text style={styles.answerTitle}>실시간 상담</Text><AssistantChatRoom inquiryId={inquiry.id} status={inquiry.status} onStatusChange={(status: AssistantInquiryStatus) => setInquiry((current) => current ? { ...current, status } : current)} /></View>
    </ScrollView> : null}
  </SafeAreaView>;
}

function getStatusDescription(status: AssistantInquiry['status']) { if (status === 'submitted') return '문의가 완료되어 조교의 채팅 시작을 기다리고 있습니다.'; if (status === 'in_progress') return '조교와 실시간 상담이 진행 중입니다.'; return '상담이 완료되었습니다.'; }
function formatDate(value: string) { return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface }, header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border }, backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 }, headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' }, headerSide: { width: 40 }, loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }, scrollView: { flex: 1, backgroundColor: COLORS.background }, content: { padding: 20, paddingBottom: 40 }, statusCard: { padding: 20, borderRadius: 18, backgroundColor: COLORS.navy }, statusLabel: { color: '#D9DDEF', fontSize: 12, fontWeight: '700' }, statusValue: { marginTop: 8, color: COLORS.white, fontSize: 23, fontWeight: '900' }, statusDescription: { marginTop: 10, color: '#D9DDEF', fontSize: 12, lineHeight: 19 }, card: { marginTop: 16, padding: 19, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, backgroundColor: COLORS.surface }, title: { color: COLORS.text, fontSize: 18, lineHeight: 26, fontWeight: '800' }, date: { marginTop: 8, color: COLORS.placeholder, fontSize: 11 }, contentSection: { marginTop: 18, paddingTop: 17, borderTopWidth: 1, borderTopColor: COLORS.border }, sectionLabel: { color: COLORS.subText, fontSize: 12, fontWeight: '800' }, bodyText: { marginTop: 10, color: COLORS.text, fontSize: 14, lineHeight: 23 }, answerCard: { marginTop: 16, padding: 19, borderRadius: 18, backgroundColor: '#EAF8F0' }, pendingCard: { backgroundColor: COLORS.softNavy }, answerTitle: { color: COLORS.navy, fontSize: 14, fontWeight: '800' }, answerText: { marginTop: 10, color: COLORS.text, fontSize: 14, lineHeight: 23 }, answerDate: { marginTop: 13, color: COLORS.subText, fontSize: 11 },
});
