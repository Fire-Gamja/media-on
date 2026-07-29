import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/colors';
import { AppIcon } from '../../components/common/AppIcon';
import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import { getAuthErrorMessage } from '../../services/auth';
import { adminDeleteAssistantInquiry, ASSISTANT_CATEGORY_OPTIONS, getAdminAssistantInquiries, getAssistantCategoryLabel, getAssistantStatusLabel, type AdminAssistantInquiry, type AssistantInquiryCategory, type AssistantInquiryStatus } from '../../services/assistant-inquiries';

export default function AdminAssistantInquiriesScreen() {
  const [inquiries, setInquiries] = useState<AdminAssistantInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<AssistantInquiryCategory | 'all'>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loadInquiries = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);
    try { setErrorMessage(null); setInquiries(await getAdminAssistantInquiries()); }
    catch (error) { setErrorMessage(getAuthErrorMessage(error)); }
    finally { setIsLoading(false); setIsRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { void loadInquiries(); }, [loadInquiries]));
  const confirmDelete = (inquiry: AdminAssistantInquiry) => {
    Alert.alert('조교 문의 삭제', `${inquiry.requester?.name ?? '학생'}의 조교 문의와 채팅 내용을 삭제하시겠습니까?\n삭제하면 복구할 수 없습니다.`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
        try {
          await adminDeleteAssistantInquiry(inquiry.id);
          setInquiries((current) => current.filter((item) => item.id !== inquiry.id));
        } catch (error) {
          Alert.alert('삭제 실패', getAuthErrorMessage(error));
        }
      } },
    ]);
  };

  return <SafeAreaView style={styles.safeArea} edges={['top']}><StatusBar style="dark" /><View style={styles.header}><Pressable onPress={() => router.back()} hitSlop={10}><PlatformHeaderIcon name="back" /></Pressable><Text style={styles.headerTitle}>조교 문의 관리</Text><View style={styles.headerSide} /></View>
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadInquiries(true)} colors={[COLORS.navy]} />}>
      <View style={styles.summaryCard}><View><Text style={styles.summaryTitle}>전체 조교 문의</Text><Text style={styles.summaryText}>학생 문의를 확인하고 실시간 상담을 시작해 주세요.</Text></View><Text style={styles.summaryCount}>{inquiries.length}건</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <CategoryFilter label="전체" selected={categoryFilter === 'all'} onPress={() => setCategoryFilter('all')} />
        {ASSISTANT_CATEGORY_OPTIONS.map((option) => <CategoryFilter key={option.value} label={option.label} selected={categoryFilter === option.value} onPress={() => setCategoryFilter(option.value)} />)}
      </ScrollView>
      {isLoading ? <View style={styles.stateBox}><ActivityIndicator size="large" color={COLORS.navy} /></View>
        : errorMessage ? <View style={styles.stateBox}><Text style={styles.errorTitle}>문의 목록을 불러오지 못했습니다.</Text><Text style={styles.stateText}>{errorMessage}</Text><Pressable onPress={() => void loadInquiries()} style={styles.retryButton}><Text style={styles.retryText}>다시 시도</Text></Pressable></View>
        : inquiries.length === 0 ? <View style={styles.stateBox}><Text style={styles.emptyTitle}>접수된 조교 문의가 없습니다.</Text></View>
        : inquiries.filter((inquiry) => categoryFilter === 'all' || inquiry.category === categoryFilter).length === 0 ? <View style={styles.stateBox}><Text style={styles.emptyTitle}>해당 유형의 문의가 없습니다.</Text></View>
        : <View style={styles.list}>{inquiries.filter((inquiry) => categoryFilter === 'all' || inquiry.category === categoryFilter).map((inquiry) => { const statusStyle = getStatusStyle(inquiry.status); return <Pressable key={inquiry.id} onPress={() => router.push({ pathname: '/admin-assistant-inquiry', params: { id: inquiry.id } })} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View style={styles.cardTop}><View style={styles.studentArea}><Text style={styles.studentName}>{inquiry.requester?.name ?? '학생'}</Text><Text style={styles.studentNumber}>{inquiry.requester?.student_number ?? '학번 미확인'}</Text></View><View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}><Text style={[styles.statusText, { color: statusStyle.color }]}>{getAssistantStatusLabel(inquiry.status)}</Text></View><Pressable accessibilityLabel="조교 문의 삭제" hitSlop={8} onPress={(event) => { event.stopPropagation(); confirmDelete(inquiry); }} style={styles.deleteButton}><AppIcon color={COLORS.error} name="trash" size={20} /></Pressable></View><Text style={styles.category}>{getAssistantCategoryLabel(inquiry.category)}</Text><Text style={styles.title} numberOfLines={2}>{inquiry.title}</Text><Text style={styles.date}>{formatDate(inquiry.created_at)}</Text><Text style={styles.chevron}>›</Text>
        </Pressable>; })}</View>}
    </ScrollView>
  </SafeAreaView>;
}

function CategoryFilter({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.filterButton, selected && styles.filterSelected]}><Text style={[styles.filterText, selected && styles.filterTextSelected]}>{label}</Text></Pressable>;
}

function getStatusStyle(status: AssistantInquiryStatus) { if (status === 'in_progress') return { backgroundColor: '#FFF3DB', color: '#9A5B00' }; if (status === 'answered') return { backgroundColor: '#EAF8F0', color: COLORS.success }; return { backgroundColor: COLORS.softNavy, color: COLORS.navy }; }
function formatDate(value: string) { return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value)); }

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface }, header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border }, backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 }, headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' }, headerSide: { width: 40 }, scrollView: { flex: 1, backgroundColor: COLORS.background }, content: { padding: 20, paddingBottom: 40 }, summaryCard: { marginBottom: 18, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 17, backgroundColor: COLORS.navy }, summaryTitle: { color: COLORS.white, fontSize: 16, fontWeight: '800' }, summaryText: { maxWidth: 245, marginTop: 6, color: '#D9DDEF', fontSize: 11, lineHeight: 17 }, summaryCount: { marginLeft: 12, color: COLORS.white, fontSize: 21, fontWeight: '900' }, filters: { gap: 8, paddingBottom: 18 }, filterButton: { minHeight: 38, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 19, backgroundColor: COLORS.surface }, filterSelected: { borderColor: COLORS.navy, backgroundColor: COLORS.navy }, filterText: { color: COLORS.subText, fontSize: 12, fontWeight: '700' }, filterTextSelected: { color: COLORS.white, fontWeight: '800' }, stateBox: { minHeight: 260, padding: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: COLORS.surface }, errorTitle: { color: COLORS.error, fontSize: 15, fontWeight: '800' }, emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' }, stateText: { marginTop: 10, color: COLORS.subText, fontSize: 13, textAlign: 'center' }, retryButton: { marginTop: 18, minHeight: 42, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: COLORS.navy }, retryText: { color: COLORS.white, fontSize: 13, fontWeight: '800' }, list: { gap: 12 }, card: { padding: 18, borderWidth: 1, borderColor: COLORS.border, borderRadius: 17, backgroundColor: COLORS.surface }, cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, studentArea: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 7 }, studentName: { color: COLORS.text, fontSize: 13, fontWeight: '800' }, studentNumber: { color: COLORS.subText, fontSize: 11 }, statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 }, statusText: { fontSize: 11, fontWeight: '800' }, deleteButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#FFF1F2' }, category: { marginTop: 13, color: COLORS.subText, fontSize: 11, fontWeight: '700' }, title: { marginTop: 5, paddingRight: 28, color: COLORS.text, fontSize: 16, lineHeight: 23, fontWeight: '800' }, date: { marginTop: 9, color: COLORS.placeholder, fontSize: 11 }, chevron: { position: 'absolute', right: 17, bottom: 13, color: COLORS.subText, fontSize: 23 }, pressed: { opacity: 0.7 },
});
