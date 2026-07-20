import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/colors';
import { getAuthErrorMessage } from '../../services/auth';
import { ASSISTANT_CATEGORY_OPTIONS, createAssistantInquiry, type AssistantInquiryCategory } from '../../services/assistant-inquiries';

export default function AssistantInquiryScreen() {
  const [category, setCategory] = useState<AssistantInquiryCategory>('academic');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('입력 확인', '문의 제목과 내용을 모두 입력해 주세요.');
      return;
    }
    try {
      setIsSubmitting(true);
      await createAssistantInquiry({ category, title, content });
      Alert.alert('접수 완료', '조교 문의가 정상적으로 접수되었습니다.', [
        { text: '내 문의 확인', onPress: () => router.replace('/assistant-inquiries') },
      ]);
    } catch (error) {
      Alert.alert('접수 실패', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return <SafeAreaView style={styles.safeArea} edges={['top']}><StatusBar style="dark" /><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.header}><Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.headerTitle}>조교 문의</Text><Pressable onPress={() => router.push('/assistant-inquiries')}><Text style={styles.historyText}>내 문의</Text></Pressable></View>
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.guideCard}><Text style={styles.guideTitle}>궁금한 내용을 남겨 주세요.</Text><Text style={styles.guideText}>문의 내용을 확인한 뒤 조교가 앱에서 답변해 드립니다.</Text></View>
      <Text style={styles.label}>문의 유형</Text><View style={styles.categoryGrid}>{ASSISTANT_CATEGORY_OPTIONS.map((option) => { const selected = category === option.value; return <Pressable key={option.value} onPress={() => setCategory(option.value)} style={[styles.categoryButton, selected && styles.categorySelected]}><Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{option.label}</Text></Pressable>; })}</View>
      <Text style={[styles.label, styles.spacedLabel]}>제목</Text><TextInput value={title} onChangeText={setTitle} maxLength={200} placeholder="문의 제목을 입력해 주세요" placeholderTextColor={COLORS.placeholder} style={styles.input} />
      <Text style={[styles.label, styles.spacedLabel]}>문의 내용</Text><TextInput value={content} onChangeText={setContent} maxLength={5000} multiline textAlignVertical="top" placeholder="조교에게 문의할 내용을 자세히 입력해 주세요" placeholderTextColor={COLORS.placeholder} style={styles.contentInput} />
    </ScrollView>
    <View style={styles.footer}><Pressable disabled={isSubmitting} onPress={() => void handleSubmit()} style={[styles.submitButton, isSubmitting && styles.disabled]}>{isSubmitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>문의 접수</Text>}</Pressable></View>
  </KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface }, flex: { flex: 1 }, header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border }, backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 }, headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' }, historyText: { width: 48, color: COLORS.navy, fontSize: 12, fontWeight: '800', textAlign: 'right' }, scrollView: { flex: 1, backgroundColor: COLORS.background }, content: { padding: 22, paddingBottom: 38 },
  guideCard: { marginBottom: 25, padding: 18, borderRadius: 17, backgroundColor: COLORS.navy }, guideTitle: { color: COLORS.white, fontSize: 16, fontWeight: '800' }, guideText: { marginTop: 7, color: '#D9DDEF', fontSize: 12, lineHeight: 19 }, label: { marginBottom: 9, color: COLORS.text, fontSize: 14, fontWeight: '800' }, spacedLabel: { marginTop: 24 }, categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, categoryButton: { minHeight: 42, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, backgroundColor: COLORS.surface }, categorySelected: { borderColor: COLORS.navy, backgroundColor: COLORS.softNavy }, categoryText: { color: COLORS.subText, fontSize: 12, fontWeight: '700' }, categoryTextSelected: { color: COLORS.navy, fontWeight: '800' }, input: { height: 56, paddingHorizontal: 15, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, backgroundColor: COLORS.surface, color: COLORS.text, fontSize: 15 }, contentInput: { minHeight: 190, padding: 15, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, backgroundColor: COLORS.surface, color: COLORS.text, fontSize: 14, lineHeight: 22 }, footer: { padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface }, submitButton: { height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: COLORS.navy }, submitText: { color: COLORS.white, fontSize: 16, fontWeight: '800' }, disabled: { opacity: 0.55 },
});
