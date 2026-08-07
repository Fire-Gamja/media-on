import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import { COLORS } from '../../constants/colors';
import { maskProfanityInput } from '../../lib/content-filter';
import {
  ASSISTANT_CATEGORY_GROUPS,
  createAssistantInquiry,
  getAssistantCategoryGroup,
  getAssistantCategoryOptionsForGroup,
  suggestAssistantInquiry,
  type AssistantInquiryCategory,
  type AssistantInquiryGroup,
} from '../../services/assistant-inquiries';
import { getAuthErrorMessage } from '../../services/auth';
import { acceptAiTransfer } from '../../services/legal';
import {
  DEFAULT_OPERATING_HOURS,
  getOperatingHoursSettings,
  isWithinOperatingHours,
  type OperatingHoursSettings,
} from '../../services/operating-hours';

export default function AssistantInquiryScreen() {
  const [categoryGroup, setCategoryGroup] =
    useState<AssistantInquiryGroup | null>(null);
  const [category, setCategory] = useState<AssistantInquiryCategory | null>(
    null,
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [operatingHours, setOperatingHours] = useState<OperatingHoursSettings>(
    DEFAULT_OPERATING_HOURS,
  );
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requestId = useRef(createRequestId());

  const categoryOptions = useMemo(
    () =>
      categoryGroup ? getAssistantCategoryOptionsForGroup(categoryGroup) : [],
    [categoryGroup],
  );
  const isOutsideOperatingHours = !isWithinOperatingHours(operatingHours);

  useEffect(() => {
    void getOperatingHoursSettings()
      .then(setOperatingHours)
      .catch(() => setOperatingHours(DEFAULT_OPERATING_HOURS));
  }, []);

  const selectCategoryGroup = (group: AssistantInquiryGroup) => {
    setCategoryGroup(group);
    setCategory(null);
  };

  const handleSuggestion = () => {
    if (content.trim().length < 10) {
      Alert.alert('내용 확인', '문의 내용을 10자 이상 입력해 주세요.');
      return;
    }

    Alert.alert(
      'AI 기능 개인정보 처리 안내',
      '작성한 문의 내용이 제목·분류 추천을 위해 OpenAI API로 전송됩니다. 동의하지 않아도 제목과 분류를 직접 입력해 문의할 수 있습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '동의하고 사용',
          onPress: () => void runSuggestion(),
        },
      ],
    );
  };

  const runSuggestion = async () => {
    try {
      setIsSuggesting(true);
      await acceptAiTransfer();
      const suggestion = await suggestAssistantInquiry(content);
      setCategoryGroup(getAssistantCategoryGroup(suggestion.category));
      setCategory(suggestion.category);
      setTitle(suggestion.title);
    } catch (error) {
      Alert.alert('AI 정리 실패', getAuthErrorMessage(error));
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmit = async () => {
    if (!category || !title.trim() || !content.trim()) {
      Alert.alert(
        '입력 확인',
        '세부 분류와 문의 제목, 내용을 모두 입력해 주세요.',
      );
      return;
    }

    if (categoryGroup === 'administration') {
      Alert.alert(
        '행정조교 문의 전 확인',
        '휴학·자퇴, 공결, 수강신청, 졸업요건, 취업계, 희망전공 변경, 복수전공은 자주 묻는 질문에 안내되어 있습니다. 이미 안내된 내용에 대한 문의는 답변이 지연되거나 별도 답변이 제공되지 않을 수 있습니다.',
        [
          {
            text: 'FAQ 확인',
            onPress: () => router.push('/frequently-asked-questions'),
          },
          {
            text: '그래도 문의하기',
            onPress: () => void submitInquiry(),
          },
        ],
      );
      return;
    }

    await submitInquiry();
  };

  const submitInquiry = async () => {
    if (!category) {
      return;
    }

    try {
      setIsSubmitting(true);
      const inquiryId = await createAssistantInquiry(
        { category, title, content },
        requestId.current,
      );
      Alert.alert('문의 완료', '조교 문의가 정상적으로 등록되었습니다.', [
        {
          text: '채팅방 열기',
          onPress: () => router.replace(`/assistant-inquiries/${inquiryId}`),
        },
      ]);
    } catch (error) {
      Alert.alert('접수 실패', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable hitSlop={10} onPress={() => router.back()}>
          <PlatformHeaderIcon name="back" />
        </Pressable>
        <Text style={styles.headerTitle}>조교 문의</Text>
        <Pressable onPress={() => router.push('/assistant-inquiries')}>
          <Text style={styles.historyText}>내 문의</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={styles.content}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
      >
        {isOutsideOperatingHours ? (
          <View accessibilityRole="alert" style={styles.closedNotice}>
            <Text style={styles.closedNoticeTitle}>
              현재 운영시간이 아닙니다.
            </Text>
            <Text style={styles.closedNoticeText}>
              지금은 업무가 종료되었습니다. 접수한 문의는 운영시간에 조교님이
              확인 후 조치합니다.
            </Text>
          </View>
        ) : null}

        <Text style={styles.label}>담당 조교</Text>
        <View style={styles.groupGrid}>
          {ASSISTANT_CATEGORY_GROUPS.map((group) => {
            const selected = categoryGroup === group.value;
            return (
              <Pressable
                key={group.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => selectCategoryGroup(group.value)}
                style={[styles.groupButton, selected && styles.groupSelected]}
              >
                <Text
                  style={[
                    styles.groupText,
                    selected && styles.groupTextSelected,
                  ]}
                >
                  {group.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {categoryGroup === 'administration' ? (
          <View accessibilityRole="alert" style={styles.adminNoticeCard}>
            <View style={styles.adminNoticeTitleRow}>
              <Text style={styles.adminNoticeMark}>!</Text>
              <Text style={styles.adminNoticeTitle}>
                행정조교 문의 전 확인해 주세요
              </Text>
            </View>
            <Text style={styles.adminNoticeText}>
              휴학·자퇴, 공결, 수강신청, 졸업요건, 취업계, 희망전공 변경,
              복수전공은 자주 묻는 질문에 안내되어 있습니다. 이미 안내된 내용에
              대한 문의는 답변이 지연되거나 별도 답변이 제공되지 않을 수
              있습니다.
            </Text>
            <Pressable
              onPress={() => router.push('/frequently-asked-questions')}
              style={({ pressed }) => [
                styles.faqButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.faqButtonText}>자주 묻는 질문 확인하기</Text>
              <Text style={styles.faqButtonArrow}>›</Text>
            </Pressable>
          </View>
        ) : null}

        {categoryGroup ? (
          <>
            <Text style={[styles.label, styles.spacedLabel]}>세부 분류</Text>
            <View style={styles.categoryGrid}>
              {categoryOptions.map((option) => {
                const selected = category === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setCategory(option.value)}
                    style={[
                      styles.categoryButton,
                      selected && styles.categorySelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        selected && styles.categoryTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {category ? (
          <>
            <Text style={[styles.label, styles.spacedLabel]}>문의 내용</Text>
            <TextInput
              maxLength={5000}
              multiline
              onChangeText={(value) => setContent(maskProfanityInput(value))}
              placeholder="조교에게 문의할 내용을 자세히 입력해 주세요"
              placeholderTextColor={COLORS.placeholder}
              style={styles.contentInput}
              textAlignVertical="top"
              value={content}
            />
            <Pressable
              disabled={isSuggesting || isSubmitting || !content.trim()}
              onPress={() => void handleSuggestion()}
              style={[
                styles.aiButton,
                (isSuggesting || isSubmitting || !content.trim()) &&
                  styles.disabled,
              ]}
            >
              {isSuggesting ? (
                <ActivityIndicator color={COLORS.navy} />
              ) : (
                <Text style={styles.aiButtonText}>AI로 분류·제목 정리하기</Text>
              )}
            </Pressable>
            <View style={styles.aiNoticeRow}>
              <Text style={styles.aiNoticeText}>
                AI를 사용하지 않아도 아래에서 제목을 직접 입력할 수 있습니다.
              </Text>
              <Pressable
                accessibilityRole="link"
                hitSlop={8}
                onPress={() =>
                  router.push({
                    pathname: '/legal-document',
                    params: { type: 'ai-transfer' },
                  })
                }
              >
                <Text style={styles.aiNoticeLink}>AI 전송 안내</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>제목</Text>
            <TextInput
              maxLength={30}
              onChangeText={(value) => setTitle(maskProfanityInput(value))}
              placeholder="문의 제목을 직접 입력하거나 AI로 정리해 주세요"
              placeholderTextColor={COLORS.placeholder}
              style={styles.input}
              value={title}
            />

            <Pressable
              disabled={isSubmitting}
              onPress={() => void handleSubmit()}
              style={[styles.submitButton, isSubmitting && styles.disabled]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitText}>문의 접수</Text>
              )}
            </Pressable>
          </>
        ) : null}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function createRequestId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (value) => {
    const random = Math.floor(Math.random() * 16);
    return (value === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
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
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  historyText: {
    width: 48,
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 22, paddingBottom: 32 },
  closedNotice: {
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#F2CC79',
    borderRadius: 14,
    backgroundColor: '#FFF9E9',
  },
  closedNoticeTitle: { color: '#704600', fontSize: 14, fontWeight: '900' },
  closedNoticeText: {
    marginTop: 6,
    color: '#805B19',
    fontSize: 12,
    lineHeight: 19,
  },
  label: {
    marginBottom: 9,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  spacedLabel: { marginTop: 24 },
  aiButton: {
    height: 48,
    marginTop: 10,
    marginBottom: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.navy,
    borderRadius: 13,
    backgroundColor: COLORS.softNavy,
  },
  aiButtonText: { color: COLORS.navy, fontSize: 14, fontWeight: '800' },
  aiNoticeRow: {
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  aiNoticeText: {
    flex: 1,
    color: COLORS.subText,
    fontSize: 10,
    lineHeight: 16,
  },
  aiNoticeLink: {
    color: COLORS.navy,
    fontSize: 11,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  groupGrid: { flexDirection: 'row', gap: 10 },
  groupButton: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
  },
  groupSelected: { borderColor: COLORS.navy, backgroundColor: COLORS.navy },
  groupText: { color: COLORS.subText, fontSize: 15, fontWeight: '800' },
  groupTextSelected: { color: COLORS.white },
  adminNoticeCard: {
    marginTop: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F2CC79',
    borderRadius: 15,
    backgroundColor: '#FFF9E9',
  },
  adminNoticeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  adminNoticeMark: {
    width: 24,
    height: 24,
    color: '#8A5700',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '900',
    textAlign: 'center',
    borderRadius: 12,
    backgroundColor: '#FFE5A8',
  },
  adminNoticeTitle: {
    flex: 1,
    color: '#704600',
    fontSize: 14,
    fontWeight: '900',
  },
  adminNoticeText: {
    marginTop: 10,
    color: '#805B19',
    fontSize: 12,
    lineHeight: 19,
  },
  faqButton: {
    minHeight: 44,
    marginTop: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  faqButtonText: { color: COLORS.navy, fontSize: 13, fontWeight: '800' },
  faqButtonArrow: { color: COLORS.navy, fontSize: 22, fontWeight: '700' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  categoryButton: {
    minHeight: 42,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  categorySelected: {
    borderColor: COLORS.navy,
    backgroundColor: COLORS.softNavy,
  },
  categoryText: { color: COLORS.subText, fontSize: 12, fontWeight: '700' },
  categoryTextSelected: { color: COLORS.navy, fontWeight: '800' },
  input: {
    height: 56,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: 15,
  },
  contentInput: {
    minHeight: 190,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
  },
  submitButton: {
    height: 56,
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.navy,
  },
  submitText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.55 },
});
