import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/colors';
import { getAuthErrorMessage } from '../../services/auth';
import { getAdminAssistantInquiry, getAssistantCategoryLabel, getAssistantStatusLabel, transitionAssistantInquiry, type AdminAssistantInquiry } from '../../services/assistant-inquiries';

export default function AdminAssistantInquiryScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const inquiryId = Array.isArray(id) ? id[0] : id;
  const [inquiry, setInquiry] = useState<AdminAssistantInquiry | null>(null);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (!inquiryId) { router.back(); return; }
    void getAdminAssistantInquiry(inquiryId).then((data) => { setInquiry(data); setAnswer(data.answer ?? ''); }).catch((error) => Alert.alert('조회 실패', getAuthErrorMessage(error), [{ text: '확인', onPress: () => router.back() }])).finally(() => setIsLoading(false));
  }, [inquiryId]);

  const handleConfirm = () => Alert.alert('문의 확인', '문의 내용을 확인하고 답변 준비를 시작하시겠습니까?', [{ text: '취소', style: 'cancel' }, { text: '확인하기', onPress: () => void changeToInProgress() }]);
  const changeToInProgress = async () => {
    if (!inquiryId || !inquiry) return;
    try { setIsSaving(true); await transitionAssistantInquiry(inquiryId, 'in_progress'); setInquiry({ ...inquiry, status: 'in_progress' }); Alert.alert('확인 완료', '문의 상태를 답변 준비 중으로 변경했습니다.'); }
    catch (error) { Alert.alert('처리 실패', getAuthErrorMessage(error)); }
    finally { setIsSaving(false); }
  };
  const handleAnswer = async () => {
    if (!inquiryId || !inquiry) return;
    if (!answer.trim()) { Alert.alert('답변 확인', '학생에게 전송할 답변을 입력해 주세요.'); return; }
    try { setIsSaving(true); await transitionAssistantInquiry(inquiryId, 'answered', answer); Alert.alert('답변 완료', '답변을 학생에게 전송했습니다.', [{ text: '확인', onPress: () => router.back() }]); }
    catch (error) { Alert.alert('답변 실패', getAuthErrorMessage(error)); }
    finally { setIsSaving(false); }
  };

  return <SafeAreaView style={styles.safeArea} edges={['top']}><StatusBar style="dark" /><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.header}><Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.headerTitle}>조교 문의 답변</Text><View style={styles.headerSide} /></View>
    {isLoading ? <View style={styles.loadingBox}><ActivityIndicator size="large" color={COLORS.navy} /></View> : inquiry ? <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.studentCard}><View style={styles.studentArea}><Text style={styles.studentName}>{inquiry.requester?.name ?? '학생'}</Text><Text style={styles.studentNumber}>{inquiry.requester?.student_number ?? '학번 미확인'}</Text></View><View style={styles.statusBadge}><Text style={styles.statusText}>{getAssistantStatusLabel(inquiry.status)}</Text></View></View>
      <View style={styles.inquiryCard}><Text style={styles.category}>{getAssistantCategoryLabel(inquiry.category)}</Text><Text style={styles.title}>{inquiry.title}</Text><Text style={styles.date}>{formatDate(inquiry.created_at)} 문의</Text><View style={styles.contentSection}><Text style={styles.sectionLabel}>문의 내용</Text><Text style={styles.bodyText}>{inquiry.content}</Text></View></View>
      <View style={styles.actionCard}><Text style={styles.actionTitle}>답변 처리</Text><Text style={styles.actionDescription}>{getActionDescription(inquiry.status)}</Text>
        {inquiry.status === 'submitted' ? <Pressable disabled={isSaving} onPress={handleConfirm} style={[styles.primaryButton, isSaving && styles.disabled]}><Text style={styles.primaryText}>문의 확인하기</Text></Pressable> : null}
        {inquiry.status === 'in_progress' ? <><Text style={styles.answerLabel}>답변 내용</Text><TextInput value={answer} onChangeText={setAnswer} maxLength={5000} multiline textAlignVertical="top" placeholder="학생에게 전송할 답변을 입력해 주세요" placeholderTextColor={COLORS.placeholder} style={styles.answerInput} /><Pressable disabled={isSaving} onPress={() => void handleAnswer()} style={[styles.primaryButton, isSaving && styles.disabled]}>{isSaving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryText}>답변 전송</Text>}</Pressable></> : null}
        {inquiry.status === 'answered' ? <View style={styles.completedBox}><Text style={styles.completedTitle}>전송된 답변</Text><Text style={styles.completedText}>{inquiry.answer}</Text></View> : null}
      </View>
    </ScrollView> : null}
  </KeyboardAvoidingView></SafeAreaView>;
}

function getActionDescription(status: AdminAssistantInquiry['status']) { if (status === 'submitted') return '문의 내용을 확인한 뒤 답변 준비를 시작해 주세요.'; if (status === 'in_progress') return '학생이 확인할 답변을 작성해 주세요.'; return '학생에게 답변이 전달되었습니다.'; }
function formatDate(value: string) { return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface }, flex: { flex: 1 }, header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border }, backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 }, headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' }, headerSide: { width: 40 }, loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' }, scrollView: { flex: 1, backgroundColor: COLORS.background }, content: { padding: 20, paddingBottom: 40 }, studentCard: { padding: 18, flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: COLORS.navy }, studentArea: { flex: 1 }, studentName: { color: COLORS.white, fontSize: 18, fontWeight: '800' }, studentNumber: { marginTop: 6, color: '#D9DDEF', fontSize: 11 }, statusBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)' }, statusText: { color: COLORS.white, fontSize: 11, fontWeight: '800' }, inquiryCard: { marginTop: 15, padding: 19, borderWidth: 1, borderColor: COLORS.border, borderRadius: 17, backgroundColor: COLORS.surface }, category: { color: COLORS.subText, fontSize: 11, fontWeight: '700' }, title: { marginTop: 7, color: COLORS.text, fontSize: 18, lineHeight: 26, fontWeight: '800' }, date: { marginTop: 8, color: COLORS.placeholder, fontSize: 11 }, contentSection: { marginTop: 18, paddingTop: 17, borderTopWidth: 1, borderTopColor: COLORS.border }, sectionLabel: { color: COLORS.subText, fontSize: 12, fontWeight: '800' }, bodyText: { marginTop: 10, color: COLORS.text, fontSize: 14, lineHeight: 23 }, actionCard: { marginTop: 15, padding: 18, borderWidth: 1, borderColor: COLORS.border, borderRadius: 17, backgroundColor: COLORS.surface }, actionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' }, actionDescription: { marginTop: 7, color: COLORS.subText, fontSize: 12, lineHeight: 19 }, answerLabel: { marginTop: 18, marginBottom: 9, color: COLORS.text, fontSize: 13, fontWeight: '800' }, answerInput: { minHeight: 170, padding: 14, borderWidth: 1, borderColor: COLORS.border, borderRadius: 13, backgroundColor: COLORS.background, color: COLORS.text, fontSize: 14, lineHeight: 22 }, primaryButton: { height: 52, marginTop: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: COLORS.navy }, primaryText: { color: COLORS.white, fontSize: 14, fontWeight: '800' }, completedBox: { marginTop: 18, padding: 15, borderRadius: 13, backgroundColor: '#EAF8F0' }, completedTitle: { color: COLORS.success, fontSize: 13, fontWeight: '800' }, completedText: { marginTop: 9, color: COLORS.text, fontSize: 13, lineHeight: 21 }, disabled: { opacity: 0.55 },
});
