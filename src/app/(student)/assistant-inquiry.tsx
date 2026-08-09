import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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

const chevronDown = require('../../../assets/figma/student-v2/chervron-down.svg');

const ADMIN_NOTICE_TEXT =
  '휴학·자퇴, 공결, 수강신청, 졸업요건, 취업계, 희망전공 변경, 복수전공은 자주 묻는 질문에 안내되어 있습니다. 이미 안내된 내용에 대한 문의는 답변이 지연되거나 별도 답변이 제공되지 않을 수 있습니다.';

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
  const [operatingHoursReady, setOperatingHoursReady] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [showAdminNoticeModal, setShowAdminNoticeModal] = useState(false);
  const [completedInquiryId, setCompletedInquiryId] = useState<string | null>(
    null,
  );
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requestId = useRef(createRequestId());

  const categoryOptions = useMemo(
    () =>
      categoryGroup === 'practice'
        ? getAssistantCategoryOptionsForGroup(categoryGroup)
        : [],
    [categoryGroup],
  );
  const isOutsideOperatingHours =
    operatingHoursReady && !isWithinOperatingHours(operatingHours);

  useEffect(() => {
    void getOperatingHoursSettings()
      .catch(() => DEFAULT_OPERATING_HOURS)
      .then((settings) => {
        setOperatingHours(settings);
        setOperatingHoursReady(true);
        setShowClosedModal(!isWithinOperatingHours(settings));
      });
  }, []);

  const selectCategoryGroup = (group: AssistantInquiryGroup) => {
    setCategoryGroup(group);
    setIsCategoryOpen(false);

    if (group === 'administration') {
      setCategory('academic');
      setShowAdminNoticeModal(true);
      return;
    }

    setCategory(null);
    setShowAdminNoticeModal(false);
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
      const suggestedGroup = getAssistantCategoryGroup(suggestion.category);

      setCategoryGroup(suggestedGroup);
      setCategory(suggestion.category);
      setTitle(suggestion.title);
      setIsCategoryOpen(false);

      if (suggestedGroup === 'administration') {
        setShowAdminNoticeModal(true);
      }
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

    try {
      setIsSubmitting(true);
      const inquiryId = await createAssistantInquiry(
        { category, title, content },
        requestId.current,
      );
      setCompletedInquiryId(inquiryId);
    } catch (error) {
      Alert.alert('접수 실패', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCompletedChat = () => {
    if (!completedInquiryId) {
      return;
    }

    const inquiryId = completedInquiryId;
    setCompletedInquiryId(null);
    router.replace(`/assistant-inquiries/${inquiryId}`);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.headerSide}
        >
          <PlatformHeaderIcon color="#1A2035" name="back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>조교문의</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/assistant-inquiries')}
          style={styles.headerSide}
        >
          <Text style={styles.historyText}>내 문의</Text>
        </Pressable>
      </View>

      {isOutsideOperatingHours ? <ClosedNoticeBanner /> : null}

      <KeyboardAwareScrollView
        bottomOffset={84}
        contentContainerStyle={styles.content}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
      >
        <View style={styles.section}>
          <Text style={styles.label}>담당 조교</Text>
          <View style={styles.groupGrid}>
            {ASSISTANT_CATEGORY_GROUPS.map((group) => {
              const selected = categoryGroup === group.value;
              const emphasized =
                selected &&
                group.value === 'administration' &&
                showAdminNoticeModal;

              return (
                <Pressable
                  key={group.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => selectCategoryGroup(group.value)}
                  style={({ pressed }) => [
                    styles.groupButton,
                    selected && styles.groupSelected,
                    emphasized && styles.groupSelectedEmphasized,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.groupText,
                      selected && styles.groupTextSelected,
                      emphasized && styles.groupTextEmphasized,
                    ]}
                  >
                    {group.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {categoryGroup === 'practice' ? (
          <CategoryDropdown
            isOpen={isCategoryOpen}
            onSelect={(value) => {
              setCategory(value);
              setIsCategoryOpen(false);
            }}
            onToggle={() => setIsCategoryOpen((current) => !current)}
            options={categoryOptions}
            selectedValue={category}
          />
        ) : null}

        {category ? (
          <View style={styles.formSections}>
            <View style={styles.section}>
              <Text style={styles.label}>문의 내용</Text>
              <TextInput
                maxLength={5000}
                multiline
                onChangeText={(value) => setContent(maskProfanityInput(value))}
                placeholder="조교에게 문의할 내용을 자세히 입력해 주세요"
                placeholderTextColor="#8B95A1"
                style={styles.contentInput}
                textAlignVertical="top"
                value={content}
              />
              <Pressable
                disabled={isSuggesting || isSubmitting || !content.trim()}
                onPress={handleSuggestion}
                style={({ pressed }) => [
                  styles.aiButton,
                  categoryGroup === 'administration' &&
                    styles.aiButtonRounded,
                  (isSuggesting || isSubmitting || !content.trim()) &&
                    styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                {isSuggesting ? (
                  <ActivityIndicator color="#1B2256" size="small" />
                ) : (
                  <Text style={styles.aiButtonText}>
                    AI로 분류·제목 정리하기
                  </Text>
                )}
              </Pressable>
              <View style={styles.aiNoticeRow}>
                <Text numberOfLines={1} style={styles.aiNoticeText}>
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
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>제목</Text>
              <TextInput
                maxLength={30}
                onChangeText={(value) => setTitle(maskProfanityInput(value))}
                placeholder="문의 제목을 직접 입력하거나 AI로 정리해 주세요."
                placeholderTextColor="#8B95A1"
                style={styles.titleInput}
                value={title}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                isSubmitting && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitText}>문의 접수</Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </KeyboardAwareScrollView>

      <ClosedHoursModal
        onConfirm={() => setShowClosedModal(false)}
        visible={showClosedModal}
      />
      <AdminNoticeModal
        onConfirm={() => setShowAdminNoticeModal(false)}
        onOpenFaq={() => {
          setShowAdminNoticeModal(false);
          router.push('/frequently-asked-questions');
        }}
        visible={showAdminNoticeModal}
      />
      <CompletionModal
        onOpenChat={openCompletedChat}
        visible={completedInquiryId !== null}
      />
    </SafeAreaView>
  );
}

function ClosedNoticeBanner() {
  return (
    <View accessibilityRole="alert" style={styles.closedBanner}>
      <View style={styles.infoBadge}>
        <Text style={styles.infoBadgeText}>i</Text>
      </View>
      <View style={styles.closedBannerCopy}>
        <Text style={styles.closedBannerTitle}>
          현재 운영시간이 아닙니다.
        </Text>
        <Text style={styles.closedBannerText}>
          접수한 문의는 운영시간에 조교님이 확인 후 조치합니다.
        </Text>
      </View>
    </View>
  );
}

function CategoryDropdown({
  isOpen,
  onSelect,
  onToggle,
  options,
  selectedValue,
}: {
  isOpen: boolean;
  onSelect: (value: AssistantInquiryCategory) => void;
  onToggle: () => void;
  options: ReturnType<typeof getAssistantCategoryOptionsForGroup>;
  selectedValue: AssistantInquiryCategory | null;
}) {
  const selectedOption = options.find(
    (option) => option.value === selectedValue,
  );

  return (
    <View style={styles.dropdownSection}>
      <Text style={styles.dropdownLabel}>세부 분류</Text>
      <Pressable
        accessibilityLabel="세부 분류 선택"
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.dropdownTrigger,
          isOpen && styles.dropdownTriggerOpen,
          pressed && styles.pressed,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.dropdownValue,
            !selectedOption && styles.dropdownPlaceholder,
          ]}
        >
          {selectedOption?.label ?? '세부 분류를 선택해 주세요'}
        </Text>
        <ExpoImage
          accessible={false}
          contentFit="contain"
          source={chevronDown}
          style={[
            styles.dropdownChevron,
            isOpen && styles.dropdownChevronOpen,
          ]}
        />
      </Pressable>

      {isOpen ? (
        <View style={styles.dropdownOptions}>
          {options.map((option, index) => {
            const selected = option.value === selectedValue;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => onSelect(option.value)}
                style={({ pressed }) => [
                  styles.dropdownOption,
                  index === 0 && styles.dropdownFirstOption,
                  selected && styles.dropdownSelectedOption,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    selected && styles.dropdownSelectedText,
                  ]}
                >
                  {option.label.replace('시설·환경', '시설ㆍ환경')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function ClosedHoursModal({
  onConfirm,
  visible,
}: {
  onConfirm: () => void;
  visible: boolean;
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onConfirm}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
    >
      <View style={styles.modalOverlay}>
        <View accessibilityRole="alert" style={styles.modalCard}>
          <View style={styles.modalCopy}>
            <Text style={styles.modalTitle}>현재 운영시간이 아닙니다.</Text>
            <Text style={styles.modalText}>
              지금은 업무가 종료되었습니다. 접수한 문의는 운영시간에 조교님이
              확인 후 조치합니다.
            </Text>
          </View>
          <PrimaryModalButton label="확인했습니다" onPress={onConfirm} />
        </View>
      </View>
    </Modal>
  );
}

function AdminNoticeModal({
  onConfirm,
  onOpenFaq,
  visible,
}: {
  onConfirm: () => void;
  onOpenFaq: () => void;
  visible: boolean;
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onConfirm}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
    >
      <View style={styles.modalOverlay}>
        <View accessibilityRole="alert" style={styles.adminModalCard}>
          <View style={styles.warningTitleRow}>
            <View style={styles.warningBadge}>
              <Text style={styles.warningBadgeText}>!</Text>
            </View>
            <Text style={styles.warningTitle}>
              행정조교 문의 전 확인해 주세요
            </Text>
          </View>
          <Text style={styles.adminModalText}>{ADMIN_NOTICE_TEXT}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onOpenFaq}
            style={({ pressed }) => [
              styles.faqButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.faqButtonText}>자주 묻는 질문 확인하기</Text>
            <Text style={styles.faqButtonArrow}>›</Text>
          </Pressable>
          <PrimaryModalButton label="확인했습니다" onPress={onConfirm} />
        </View>
      </View>
    </Modal>
  );
}

function CompletionModal({
  onOpenChat,
  visible,
}: {
  onOpenChat: () => void;
  visible: boolean;
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={() => undefined}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
    >
      <View style={styles.modalOverlay}>
        <View accessibilityRole="alert" style={styles.modalCard}>
          <View style={styles.modalCopy}>
            <Text style={styles.modalTitle}>문의 완료</Text>
            <Text style={styles.modalText}>
              조교 문의가 정상적으로 등록되었습니다.
            </Text>
          </View>
          <PrimaryModalButton label="채팅방 열기" onPress={onOpenChat} />
        </View>
      </View>
    </Modal>
  );
}

function PrimaryModalButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryModalButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.primaryModalButtonText}>{label}</Text>
    </Pressable>
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
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
    backgroundColor: COLORS.surface,
  },
  headerSide: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#1A2035',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
    textAlign: 'center',
  },
  historyText: {
    width: 40,
    color: '#1B2256',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
    textAlign: 'right',
  },
  scrollView: { flex: 1, backgroundColor: COLORS.surface },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  section: { gap: 10 },
  label: {
    color: '#1F2937',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 14,
  },
  groupGrid: { flexDirection: 'row', gap: 10 },
  groupButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
  groupSelected: {
    borderColor: '#3550FF',
    backgroundColor: '#F2F6FF',
  },
  groupSelectedEmphasized: { backgroundColor: '#3550FF' },
  groupText: {
    color: '#4E5968',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 15,
  },
  groupTextSelected: {
    color: '#111111',
    fontFamily: 'FreesentationExtraBold',
  },
  groupTextEmphasized: { color: COLORS.white },
  closedBanner: {
    minHeight: 50,
    paddingHorizontal: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EEF2FF',
  },
  infoBadge: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#3550FF',
  },
  infoBadgeText: {
    color: COLORS.white,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 11,
    lineHeight: 14,
  },
  closedBannerCopy: { flex: 1, gap: 2 },
  closedBannerTitle: {
    color: '#3550FF',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 11,
  },
  closedBannerText: {
    color: '#333D4B',
    fontFamily: 'FreesentationRegular',
    fontSize: 11,
  },
  dropdownSection: { marginTop: 24 },
  dropdownLabel: {
    marginBottom: 12,
    color: '#1B2A4A',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 15,
  },
  dropdownTrigger: {
    height: 40,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E4E9F0',
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
  dropdownTriggerOpen: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  dropdownValue: {
    flex: 1,
    color: '#333D4B',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  dropdownPlaceholder: { color: '#8B95A1' },
  dropdownChevron: { width: 14, height: 14, marginLeft: 12 },
  dropdownChevronOpen: { transform: [{ rotate: '180deg' }] },
  dropdownOptions: {
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E4E9F0',
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
  dropdownOption: {
    minHeight: 35,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
  },
  dropdownFirstOption: { borderTopWidth: 0 },
  dropdownSelectedOption: { backgroundColor: '#F2F2F2' },
  dropdownOptionText: {
    color: '#6C6C6C',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 15,
    lineHeight: 20,
  },
  dropdownSelectedText: {
    color: '#111111',
    fontFamily: 'FreesentationExtraBold',
  },
  formSections: { marginTop: 24, gap: 24 },
  contentInput: {
    height: 160,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    color: '#1F2937',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
    lineHeight: 21,
  },
  aiButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#1B2256',
    borderRadius: 8,
    backgroundColor: '#FFF8ED',
  },
  aiButtonRounded: { borderRadius: 22 },
  aiButtonText: {
    color: '#333333',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 14,
  },
  aiNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiNoticeText: {
    flex: 1,
    color: '#8B95A1',
    fontFamily: 'FreesentationRegular',
    fontSize: 11,
  },
  aiNoticeLink: {
    width: 70,
    color: '#1B2256',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 11,
    textAlign: 'right',
    textDecorationLine: 'underline',
  },
  titleInput: {
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    color: '#1F2937',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
  },
  submitButton: {
    height: 52,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#3550FF',
  },
  submitText: {
    color: COLORS.white,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 343,
    paddingHorizontal: 20,
    paddingVertical: 40,
    gap: 24,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  modalCopy: { gap: 8 },
  modalTitle: {
    color: '#000000',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 20,
  },
  modalText: {
    color: '#000000',
    fontFamily: 'FreesentationRegular',
    fontSize: 16,
    lineHeight: 24,
  },
  primaryModalButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#3550FF',
  },
  primaryModalButtonText: {
    color: COLORS.white,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 16,
  },
  adminModalCard: {
    width: '100%',
    maxWidth: 343,
    paddingHorizontal: 20,
    paddingVertical: 40,
    gap: 24,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  warningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningBadge: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#E03636',
  },
  warningBadgeText: {
    color: '#FFF9E6',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 12,
    lineHeight: 16,
  },
  warningTitle: {
    flex: 1,
    color: '#000000',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 14,
  },
  adminModalText: {
    color: '#000000',
    fontFamily: 'FreesentationRegular',
    fontSize: 16,
    lineHeight: 24,
  },
  faqButton: {
    height: 44,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#676767',
    borderRadius: 26,
    backgroundColor: COLORS.surface,
  },
  faqButtonText: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 13,
  },
  faqButtonArrow: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 22,
    lineHeight: 22,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.55 },
});
