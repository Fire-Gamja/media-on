import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
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
import { getAuthErrorMessage } from '../../services/auth';
import {
  createFacilityReport,
  FACILITY_CATEGORY_OPTIONS,
  type FacilityIssueCategory,
} from '../../services/facility-reports';

export default function FacilityReportScreen() {
  const [location, setLocation] = useState<
    (typeof FACILITY_LOCATION_OPTIONS)[number] | null
  >(null);
  const [category, setCategory] = useState<FacilityIssueCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!location || !category || !title.trim() || !description.trim()) {
      Alert.alert('입력 확인', '장소, 제목, 상세 내용을 모두 입력해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createFacilityReport({ location, category, title, description });
      Alert.alert('신청 완료', '시설 신고 신청이 정상적으로 완료되었습니다.', [
        {
          text: '내 신고 확인',
          onPress: () => router.replace('/facility-reports'),
        },
      ]);
    } catch (error) {
      Alert.alert('접수 실패', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <PlatformHeaderIcon name="back" />
        </Pressable>
        <Text style={styles.headerTitle}>시설 신고</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/facility-reports')}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Text style={styles.historyText}>내 신고</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={24}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.guideBox}>
          <Text style={styles.guideTitle}>시설 불편 사항을 알려 주세요.</Text>
          <Text style={styles.guideText}>
            접수 후 관리자 처리 상태와 답변을 내 신고에서 확인할 수 있습니다.
          </Text>
        </View>

        <Text style={styles.label}>장소</Text>
        <View style={styles.locationGrid}>
          {FACILITY_LOCATION_OPTIONS.map((option) => {
            const isSelected = location === option;

            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  setLocation(option);
                  setCategory(null);
                }}
                style={({ pressed }) => [
                  styles.locationButton,
                  isSelected && styles.locationButtonSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.locationText,
                    isSelected && styles.locationTextSelected,
                  ]}
                >
                  {option.replace('제 1자연관 ', '')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {location ? (
          <>
            <Text style={[styles.label, styles.spacedLabel]}>신고 유형</Text>
            <View style={styles.categoryGrid}>
              {FACILITY_CATEGORY_OPTIONS.map((option) => {
                const isSelected = category === option.value;

                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setCategory(option.value)}
                    style={({ pressed }) => [
                      styles.categoryButton,
                      isSelected && styles.categoryButtonSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        isSelected && styles.categoryTextSelected,
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
            <Text style={[styles.label, styles.spacedLabel]}>제목</Text>
            <TextInput
              value={title}
              onChangeText={(value) => setTitle(maskProfanityInput(value))}
              maxLength={200}
              placeholder="불편 사항을 간단히 입력해 주세요"
              placeholderTextColor={COLORS.placeholder}
              style={styles.input}
            />

            <Text style={[styles.label, styles.spacedLabel]}>상세 내용</Text>
            <TextInput
              value={description}
              onChangeText={(value) =>
                setDescription(maskProfanityInput(value))
              }
              maxLength={5000}
              multiline
              textAlignVertical="top"
              placeholder="증상과 발생 상황을 자세히 입력해 주세요"
              placeholderTextColor={COLORS.placeholder}
              style={styles.descriptionInput}
            />

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => void handleSubmit()}
              style={({ pressed }) => [
                styles.submitButton,
                isSubmitting && styles.disabled,
                pressed && !isSubmitting && styles.pressed,
              ]}
            >
              <Text style={styles.submitText}>
                {isSubmitting ? '신청 중...' : '시설 신고 신청'}
              </Text>
            </Pressable>
          </>
        ) : null}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const FACILITY_LOCATION_OPTIONS = [
  '제 1자연관 101호',
  '제 1자연관 301호',
  '제 1자연관 303호',
  '제 1자연관 304호',
  '제 1자연관 501호',
  '제 1자연관 504호',
  '제 1자연관 공용 공간',
] as const;

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
  historyText: {
    width: 40,
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  pressed: { opacity: 0.7 },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 22, paddingBottom: 32 },
  guideBox: {
    marginBottom: 26,
    padding: 18,
    borderRadius: 16,
    backgroundColor: COLORS.softNavy,
  },
  guideTitle: { color: COLORS.navy, fontSize: 16, fontWeight: '800' },
  guideText: {
    marginTop: 7,
    color: COLORS.subText,
    fontSize: 12,
    lineHeight: 19,
  },
  label: {
    marginBottom: 9,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  spacedLabel: { marginTop: 24 },
  input: {
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: 15,
  },
  locationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  locationButton: {
    minWidth: '30%',
    minHeight: 46,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  locationButtonSelected: {
    borderColor: COLORS.navy,
    backgroundColor: COLORS.softNavy,
  },
  locationText: { color: COLORS.subText, fontSize: 13, fontWeight: '700' },
  locationTextSelected: { color: COLORS.navy, fontWeight: '900' },
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
  categoryButtonSelected: {
    borderColor: COLORS.navy,
    backgroundColor: COLORS.softNavy,
  },
  categoryText: { color: COLORS.subText, fontSize: 12, fontWeight: '700' },
  categoryTextSelected: { color: COLORS.navy, fontWeight: '800' },
  descriptionInput: {
    minHeight: 180,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 23,
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
  disabled: { opacity: 0.55 },
});
