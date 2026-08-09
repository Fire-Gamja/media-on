import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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

import { InlineDropdown } from '../../components/common/InlineDropdown';
import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
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
  const [openDropdown, setOpenDropdown] = useState<
    'location' | 'category' | null
  >(null);

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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
        <Text style={styles.headerTitle}>시설 신고</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/facility-reports')}
          style={({ pressed }) => [
            styles.headerSide,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.historyText}>내 신고</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={84}
        contentContainerStyle={styles.content}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
      >
        <InlineDropdown
          isOpen={openDropdown === 'location'}
          label="장소"
          onSelect={(value) => {
            setLocation(value as (typeof FACILITY_LOCATION_OPTIONS)[number]);
            setCategory(null);
            setOpenDropdown(null);
          }}
          onToggle={() =>
            setOpenDropdown((current) =>
              current === 'location' ? null : 'location',
            )
          }
          options={FACILITY_LOCATION_DROPDOWN_OPTIONS}
          placeholder="장소를 선택해 주세요"
          selectedValue={location}
        />

        {location ? (
          <InlineDropdown
            isOpen={openDropdown === 'category'}
            label="신고 유형"
            onSelect={(value) => {
              setCategory(value as FacilityIssueCategory);
              setOpenDropdown(null);
            }}
            onToggle={() =>
              setOpenDropdown((current) =>
                current === 'category' ? null : 'category',
              )
            }
            options={FACILITY_CATEGORY_OPTIONS}
            placeholder="신고 유형을 선택해 주세요"
            selectedValue={category}
          />
        ) : null}

        {category ? (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>제목</Text>
              <TextInput
                maxLength={200}
                onChangeText={(value) => setTitle(maskProfanityInput(value))}
                placeholder="불편 사항을 간단히 입력해 주세요"
                placeholderTextColor="#8A94A6"
                style={styles.titleInput}
                value={title}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>상세 내용</Text>
              <TextInput
                maxLength={5000}
                multiline
                onChangeText={(value) =>
                  setDescription(maskProfanityInput(value))
                }
                placeholder="증상과 발생 상황을 자세히 입력해 주세요"
                placeholderTextColor="#8A94A6"
                style={styles.descriptionInput}
                textAlignVertical="top"
                value={description}
              />
            </View>
          </>
        ) : null}
      </KeyboardAwareScrollView>

      {category ? (
        <View style={styles.bottomCta}>
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
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>시설 신고 신청</Text>
            )}
          </Pressable>
        </View>
      ) : null}
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

const FACILITY_LOCATION_DROPDOWN_OPTIONS = FACILITY_LOCATION_OPTIONS.map(
  (location) => ({ label: location, value: location }),
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  headerSide: {
    width: 48,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#1A2035',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 20,
  },
  historyText: {
    color: '#1B2256',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  pressed: { opacity: 0.7 },
  scrollView: { flex: 1, backgroundColor: '#FFFFFF' },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 24,
  },
  fieldGroup: { gap: 12 },
  fieldLabel: {
    color: '#1B2A4A',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
  },
  titleInput: {
    height: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E4E9F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    color: '#333D4B',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
  },
  descriptionInput: {
    height: 140,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E4E9F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    color: '#333D4B',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
    lineHeight: 21,
  },
  bottomCta: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#3550FF',
  },
  submitText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 16,
  },
  disabled: { opacity: 0.55 },
});
