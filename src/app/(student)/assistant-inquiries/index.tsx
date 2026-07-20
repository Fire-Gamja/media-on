import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants/colors';
import { getAuthErrorMessage } from '../../../services/auth';
import { getAssistantCategoryLabel, getAssistantStatusLabel, getMyAssistantInquiries, type AssistantInquiry, type AssistantInquiryStatus } from '../../../services/assistant-inquiries';

export default function AssistantInquiriesScreen() {
  const [inquiries, setInquiries] = useState<AssistantInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loadInquiries = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);
    try { setErrorMessage(null); setInquiries(await getMyAssistantInquiries()); }
    catch (error) { setErrorMessage(getAuthErrorMessage(error)); }
    finally { setIsLoading(false); setIsRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { void loadInquiries(); }, [loadInquiries]));

  return <SafeAreaView style={styles.safeArea} edges={['top']}><StatusBar style="dark" />
    <View style={styles.header}><Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.headerTitle}>내 조교 문의</Text><Pressable onPress={() => router.push('/assistant-inquiry')} style={styles.addButton}><Text style={styles.addText}>문의</Text></Pressable></View>
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadInquiries(true)} colors={[COLORS.navy]} />}>
      {isLoading ? <View style={styles.stateBox}><ActivityIndicator size="large" color={COLORS.navy} /></View>
        : errorMessage ? <View style={styles.stateBox}><Text style={styles.errorTitle}>문의 내역을 불러오지 못했습니다.</Text><Text style={styles.stateText}>{errorMessage}</Text><Pressable onPress={() => void loadInquiries()} style={styles.retryButton}><Text style={styles.retryText}>다시 시도</Text></Pressable></View>
        : inquiries.length === 0 ? <View style={styles.stateBox}><Text style={styles.emptyTitle}>접수한 문의가 없습니다.</Text><Pressable onPress={() => router.push('/assistant-inquiry')} style={styles.retryButton}><Text style={styles.retryText}>조교에게 문의하기</Text></Pressable></View>
        : <View style={styles.list}>{inquiries.map((inquiry) => { const statusStyle = getStatusStyle(inquiry.status); return <Pressable key={inquiry.id} onPress={() => router.push(`/assistant-inquiries/${inquiry.id}`)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View style={styles.cardTop}><Text style={styles.category}>{getAssistantCategoryLabel(inquiry.category)}</Text><View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}><Text style={[styles.statusText, { color: statusStyle.color }]}>{getAssistantStatusLabel(inquiry.status)}</Text></View></View><Text style={styles.title} numberOfLines={2}>{inquiry.title}</Text><Text style={styles.date}>{formatDate(inquiry.created_at)}</Text><Text style={styles.chevron}>›</Text>
        </Pressable>; })}</View>}
    </ScrollView>
  </SafeAreaView>;
}

function getStatusStyle(status: AssistantInquiryStatus) {
  if (status === 'in_progress') return { backgroundColor: '#FFF3DB', color: '#9A5B00' };
  if (status === 'answered') return { backgroundColor: '#EAF8F0', color: COLORS.success };
  return { backgroundColor: COLORS.softNavy, color: COLORS.navy };
}
function formatDate(value: string) { return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value)); }

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface }, header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border }, backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 }, headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' }, addButton: { minWidth: 44, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: COLORS.navy }, addText: { color: COLORS.white, fontSize: 13, fontWeight: '800' }, scrollView: { flex: 1, backgroundColor: COLORS.background }, content: { padding: 20, paddingBottom: 40 }, stateBox: { minHeight: 270, padding: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: COLORS.surface }, errorTitle: { color: COLORS.error, fontSize: 15, fontWeight: '800', textAlign: 'center' }, emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' }, stateText: { marginTop: 10, color: COLORS.subText, fontSize: 13, textAlign: 'center' }, retryButton: { marginTop: 18, minHeight: 42, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: COLORS.navy }, retryText: { color: COLORS.white, fontSize: 13, fontWeight: '800' }, list: { gap: 12 }, card: { padding: 18, borderWidth: 1, borderColor: COLORS.border, borderRadius: 17, backgroundColor: COLORS.surface }, cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, category: { color: COLORS.subText, fontSize: 11, fontWeight: '700' }, statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 }, statusText: { fontSize: 11, fontWeight: '800' }, title: { marginTop: 14, paddingRight: 28, color: COLORS.text, fontSize: 16, lineHeight: 23, fontWeight: '800' }, date: { marginTop: 9, color: COLORS.placeholder, fontSize: 11 }, chevron: { position: 'absolute', right: 17, bottom: 13, color: COLORS.subText, fontSize: 23 }, pressed: { opacity: 0.7 },
});
