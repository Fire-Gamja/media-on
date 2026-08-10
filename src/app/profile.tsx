import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FormField from '../components/common/FormField';
import { BottomSheetModal } from '../components/common/BottomSheetModal';
import { PlatformHeaderIcon } from '../components/common/PlatformHeaderIcon';
import PrimaryButton from '../components/common/PrimaryButton';
import { StudentBottomNavigation } from '../components/student/StudentBottomNavigation';
import { COLORS } from '../constants/colors';
import { useAppSettings } from '../context/app-settings-context';
import { translate } from '../i18n/translations';
import {
  getProfileAvatarPresetValue,
  getProfileAvatarSource,
  getSelectedProfileAvatarPreset,
  isProfileAvatarPreset,
  PROFILE_AVATAR_OPTIONS,
  type ProfileAvatarPreset,
} from '../lib/profile-avatar';
import { supabase } from '../lib/supabase';
import {
  changeCurrentPassword,
  getAuthErrorMessage,
  getCurrentProfile,
  signOutUser,
  type StudentProfile,
  updateCurrentAvatarUrl,
  updateCurrentProfile,
} from '../services/auth';

const MAJORS = [
  '영상미디어전공',
  '멀티미디어전공',
  '전공 미정',
] as const;
const GRADES = [1, 2, 3, 4] as const;
const ENROLLMENT_STATUSES = ['재학', '휴학', '졸업', '제적·자퇴'] as const;
type EditableProfileField = 'grade' | 'major' | 'status' | 'phone';

const AVATAR_MODAL_DISMISS_FALLBACK_MS = 400;

export default function ProfileScreen() {
  const { language } = useAppSettings();
  const { fromTab, mustChangePassword } = useLocalSearchParams<{
    fromTab?: string;
    mustChangePassword?: string;
  }>();
  const isPasswordChangeRequired = mustChangePassword === '1';
  const isMyTab = fromTab === '1' && !isPasswordChangeRequired;
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<number>(1);
  const [major, setMajor] = useState('전공 미정');
  const [enrollmentStatus, setEnrollmentStatus] = useState('재학');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAvatarPickerVisible, setIsAvatarPickerVisible] = useState(false);
  const pendingPhotoLibraryRef = useRef(false);
  const photoLibraryFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [editingField, setEditingField] =
    useState<EditableProfileField | null>(null);
  const lastEditingFieldRef = useRef<EditableProfileField>('grade');
  const [showPasswordEditor, setShowPasswordEditor] = useState(false);
  const renderedEditingField =
    editingField ?? lastEditingFieldRef.current;

  const applyProfile = useCallback((nextProfile: StudentProfile) => {
    setProfile(nextProfile);
    setName(nextProfile.name);
    setGrade(nextProfile.grade);
    setMajor(nextProfile.major);
    setEnrollmentStatus(nextProfile.enrollment_status);
    setPhoneNumber(formatPhoneNumber(nextProfile.phone_number));
    setAvatarUrl(nextProfile.avatar_url);
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const nextProfile = await getCurrentProfile();
      applyProfile(nextProfile);
    } catch (error) {
      setLoadError(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [applyProfile]);

  const launchAvatarPhotoLibrary = useCallback(async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          '사진 접근 권한 필요',
          '내 사진을 등록하려면 기기 설정에서 사진 접근을 허용해 주세요.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      });

      if (result.canceled) return;

      if (!supabase || !profile) {
        throw new Error('프로필 정보를 확인하지 못했습니다.');
      }

      setIsSaving(true);
      const selectedPhoto = result.assets[0];
      const bytes = await (await fetch(selectedPhoto.uri)).arrayBuffer();
      const path = `${profile.id}/avatar.jpg`;
      const { error } = await supabase.storage
        .from('profile-images')
        .upload(path, bytes, {
          contentType: selectedPhoto.mimeType ?? 'image/jpeg',
          upsert: true,
        });
      if (error) throw error;
      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;
      const updatedProfile = await updateCurrentAvatarUrl(url);
      applyProfile(updatedProfile);
    } catch {
      Alert.alert('변경 실패', '프로필 사진을 변경하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [applyProfile, profile]);

  const openPendingPhotoLibrary = useCallback(() => {
    if (!pendingPhotoLibraryRef.current) return;

    pendingPhotoLibraryRef.current = false;
    if (photoLibraryFallbackRef.current) {
      clearTimeout(photoLibraryFallbackRef.current);
      photoLibraryFallbackRef.current = null;
    }

    void launchAvatarPhotoLibrary();
  }, [launchAvatarPhotoLibrary]);

  const handleAvatarPhotoUpload = () => {
    setIsAvatarPickerVisible(false);

    if (Platform.OS === 'web') {
      void launchAvatarPhotoLibrary();
      return;
    }

    pendingPhotoLibraryRef.current = true;
    photoLibraryFallbackRef.current = setTimeout(
      openPendingPhotoLibrary,
      AVATAR_MODAL_DISMISS_FALLBACK_MS,
    );
  };

  useEffect(() => {
    return () => {
      if (photoLibraryFallbackRef.current) {
        clearTimeout(photoLibraryFallbackRef.current);
      }
    };
  }, []);

  const handleAvatarPresetChange = async (preset: ProfileAvatarPreset) => {
    if (!profile || !supabase) return;

    const nextAvatarValue = getProfileAvatarPresetValue(preset);
    if (avatarUrl === nextAvatarValue || (!avatarUrl && preset === 'male')) {
      setIsAvatarPickerVisible(false);
      return;
    }

    const previousAvatarUrl = avatarUrl;

    try {
      setIsSaving(true);
      const updatedProfile = await updateCurrentAvatarUrl(nextAvatarValue);
      applyProfile(updatedProfile);
      setIsAvatarPickerVisible(false);

      if (previousAvatarUrl && !isProfileAvatarPreset(previousAvatarUrl)) {
        const { error } = await supabase.storage
          .from('profile-images')
          .remove([`${profile.id}/avatar.jpg`]);

        if (error) {
          console.warn('기존 프로필 사진 파일을 삭제하지 못했습니다.', error);
        }
      }
    } catch {
      Alert.alert('변경 실패', '기본 프로필을 변경하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const newPasswordIsValid = useMemo(() => {
    return (
      newPassword.length >= 8 &&
      /[A-Za-z]/.test(newPassword) &&
      /\d/.test(newPassword)
    );
  }, [newPassword]);

  const handleBack = () => {
    if (showPasswordEditor) {
      setShowPasswordEditor(false);
      return;
    }

    if (isPasswordChangeRequired) {
      Alert.alert(
        '비밀번호 변경 필요',
        '임시 비밀번호를 새 비밀번호로 변경한 뒤 서비스를 이용할 수 있습니다.',
      );
      return;
    }

    router.back();
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await signOutUser();
          router.replace({ pathname: '/login', params: { fromLogout: '1' } });
        },
      },
    ]);
  };

  const closeProfileEditor = () => {
    if (profile) {
      applyProfile(profile);
    }
    setEditingField(null);
  };

  const openProfileEditor = (field: EditableProfileField) => {
    lastEditingFieldRef.current = field;
    setEditingField(field);
  };

  const handleSave = async () => {
    if (!profile) {
      return;
    }

    if (!name.trim()) {
      Alert.alert('입력 확인', '이름을 입력해 주세요.');
      return;
    }

    if (grade === 1 && major !== '전공 미정') {
      Alert.alert('전공 확인', '1학년 계정은 전공 미정을 선택해 주세요.');
      return;
    }

    if (grade > 1 && major === '전공 미정') {
      Alert.alert('전공 확인', '2~4학년 계정은 소속 전공을 선택해 주세요.');
      return;
    }

    const phoneNumbersOnly = phoneNumber.replace(/\D/g, '');
    if (!/^01[0-9]{8,9}$/.test(phoneNumbersOnly)) {
      Alert.alert('연락처 확인', '올바른 휴대전화번호를 입력해 주세요.');
      return;
    }

    try {
      setIsSaving(true);
      const updatedProfile = await updateCurrentProfile({
        name,
        grade,
        major,
        enrollmentStatus,
        phoneNumber,
      });
      applyProfile(updatedProfile);
      setEditingField(null);
      Alert.alert('저장 완료', '내 정보가 변경되었습니다.');
    } catch (error) {
      Alert.alert('저장 실패', getAuthErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!profile) {
      return;
    }

    if (!currentPassword) {
      Alert.alert('입력 확인', '현재 비밀번호를 입력해 주세요.');
      return;
    }

    if (!newPasswordIsValid) {
      Alert.alert(
        '비밀번호 확인',
        '새 비밀번호는 영문과 숫자를 포함해 8자 이상으로 입력해 주세요.',
      );
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      Alert.alert('비밀번호 확인', '새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert(
        '비밀번호 확인',
        '현재 비밀번호와 다른 새 비밀번호를 입력해 주세요.',
      );
      return;
    }

    try {
      setIsChangingPassword(true);
      await changeCurrentPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      Alert.alert('변경 완료', '비밀번호가 변경되었습니다.');

      if (isPasswordChangeRequired) {
        router.replace(
          profile.role === 'admin' ? '/admin-home' : '/home',
        );
      } else {
        setShowPasswordEditor(false);
      }
    } catch (error) {
      Alert.alert('변경 실패', getAuthErrorMessage(error));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          {isMyTab && !showPasswordEditor ? (
            <View style={styles.headerSpacer} />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="뒤로 가기"
              hitSlop={10}
              onPress={handleBack}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <PlatformHeaderIcon name="back" />
            </Pressable>
          )}
          <Text style={styles.headerTitle}>
            {isPasswordChangeRequired
              ? '새 비밀번호 설정'
              : showPasswordEditor
                ? '비밀번호 변경'
                : translate(language, 'profile.title')}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={COLORS.navy} />
            <Text style={styles.stateText}>내 정보를 불러오는 중입니다.</Text>
          </View>
        ) : loadError || !profile ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorTitle}>내 정보를 불러오지 못했습니다.</Text>
            <Text style={styles.stateText}>{loadError}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void loadProfile()}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === 'ios' ? 'interactive' : 'on-drag'
            }
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            showsVerticalScrollIndicator={false}
          >
            {isPasswordChangeRequired || showPasswordEditor ? (
              <View style={styles.passwordContent}>
                {isPasswordChangeRequired ? (
                  <View style={styles.requiredBanner}>
                    <Text style={styles.requiredBannerTitle}>
                      임시 비밀번호로 로그인했습니다
                    </Text>
                    <Text style={styles.requiredBannerText}>
                      새 비밀번호를 설정하면 홈 화면으로 이동합니다.
                    </Text>
                  </View>
                ) : null}
                <Text style={styles.passwordGuide}>
                  안전한 서비스를 이용하기 위해 비밀번호를 변경해 주세요.
                </Text>
                <FormField
                  label={isPasswordChangeRequired ? '임시 비밀번호' : '현재 비밀번호'}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="현재 비밀번호"
                />
                <FormField
                  label="새 비밀번호"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="영문·숫자 포함 8자 이상"
                  errorMessage={
                    newPassword.length > 0 && !newPasswordIsValid
                      ? '영문과 숫자를 포함해 8자 이상 입력해 주세요.'
                      : undefined
                  }
                />
                <FormField
                  label="새 비밀번호 확인"
                  value={newPasswordConfirm}
                  onChangeText={setNewPasswordConfirm}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="새 비밀번호를 다시 입력해 주세요"
                  errorMessage={
                    newPasswordConfirm.length > 0 &&
                    newPassword !== newPasswordConfirm
                      ? '새 비밀번호가 일치하지 않습니다.'
                      : undefined
                  }
                />
                <PrimaryButton
                  title="변경하기"
                  loading={isChangingPassword}
                  onPress={() => void handleChangePassword()}
                />
              </View>
            ) : (
              <>
                <View style={styles.profileCard}>
                  <Image
                    source={getProfileAvatarSource(avatarUrl)}
                    style={styles.avatarImage}
                  />
                  <Pressable
                    disabled={isSaving}
                    onPress={() => setIsAvatarPickerVisible(true)}
                    style={({ pressed }) => [
                      styles.avatarChangeButton,
                      isSaving && styles.disabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.avatarChange}>{translate(language, 'profile.photoChange')}</Text>
                  </Pressable>
                  <Text style={styles.profileName}>{profile.name}</Text>
                </View>

                <View style={styles.profileDivider} />
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>{translate(language, 'profile.basicInfo')}</Text>
                  <ProfileInfoRow label={translate(language, 'profile.name')} value={profile.name} />
                  <ProfileInfoRow label={translate(language, 'profile.studentNumber')} value={profile.student_number} />
                  <ProfileInfoRow
                    editable
                    label={translate(language, 'profile.grade')}
                    onEdit={() => openProfileEditor('grade')}
                    value={`${profile.grade}${language === 'ko' ? '학년' : ''}`}
                  />
                  <ProfileInfoRow
                    editable
                    label={translate(language, 'profile.major')}
                    onEdit={() => openProfileEditor('major')}
                    value={major}
                  />
                  <ProfileInfoRow
                    editable
                    label={translate(language, 'profile.status')}
                    onEdit={() => openProfileEditor('status')}
                    value={enrollmentStatus}
                  />
                  <ProfileInfoRow
                    editable
                    label={translate(language, 'profile.phone')}
                    onEdit={() => openProfileEditor('phone')}
                    value={phoneNumber}
                  />
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowPasswordEditor(true)}
                  style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
                >
                  <Text style={styles.menuText}>{translate(language, 'profile.password')}</Text>
                  <Text style={styles.menuChevron}>›</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/account-deletion')}
                  style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
                >
                  <Text style={styles.deleteMenuText}>{translate(language, 'profile.delete')}</Text>
                  <Text style={styles.menuChevron}>›</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleLogout}
                  style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
                >
                  <Text style={styles.logoutText}>{translate(language, 'profile.logout')}</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
      {isMyTab && !showPasswordEditor ? (
        <StudentBottomNavigation activeTab="my" />
      ) : null}

      <BottomSheetModal
        accessibilityLabel="정보 수정 닫기"
        backdropColor="rgba(0,0,0,0.3)"
        onRequestClose={closeProfileEditor}
        visible={editingField !== null}
      >
        <View style={styles.editSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.editSheetTitle}>
            {renderedEditingField === 'grade'
              ? '학년'
              : renderedEditingField === 'major'
                ? '전공'
                : renderedEditingField === 'status'
                  ? '학적 상태'
                  : '휴대폰번호'}
          </Text>
          {renderedEditingField === 'grade' ? (
            <>
              <SelectionGroup
                label=""
                options={GRADES.map((value) => ({
                  label: `${value}학년`,
                  value,
                }))}
                selectedValue={grade}
                onSelect={(value) => {
                  setGrade(value);
                  if (value === 1) {
                    setMajor('전공 미정');
                  }
                }}
              />
              {grade > 1 && major === '전공 미정' ? (
                <SelectionGroup
                  label="전공을 선택해 주세요"
                  options={MAJORS.filter(
                    (value) => value !== '전공 미정',
                  ).map((value) => ({ label: value, value }))}
                  selectedValue={major}
                  onSelect={setMajor}
                />
              ) : null}
            </>
          ) : renderedEditingField === 'major' ? (
            <SelectionGroup
              label=""
              options={MAJORS.map((value) => ({ label: value, value }))}
              selectedValue={major}
              onSelect={setMajor}
            />
          ) : renderedEditingField === 'status' ? (
            <SelectionGroup
              label=""
              options={ENROLLMENT_STATUSES.map((value) => ({
                label: value,
                value,
              }))}
              selectedValue={enrollmentStatus}
              onSelect={setEnrollmentStatus}
            />
          ) : (
            <FormField
              label="휴대폰번호"
              value={phoneNumber}
              onChangeText={(value) => setPhoneNumber(formatPhoneNumber(value))}
              keyboardType="phone-pad"
              maxLength={13}
              placeholder="010-0000-0000"
            />
          )}
          <PrimaryButton
            title="선택 완료"
            loading={isSaving}
            onPress={() => void handleSave()}
            style={isSaving ? undefined : styles.editSaveButton}
          />
        </View>
      </BottomSheetModal>

      <Modal
        animationType="fade"
        onDismiss={openPendingPhotoLibrary}
        onRequestClose={() => setIsAvatarPickerVisible(false)}
        transparent
        visible={isAvatarPickerVisible}
      >
        <View style={styles.avatarModalBackdrop}>
          <Pressable
            accessibilityLabel="프로필 선택 닫기"
            onPress={() => setIsAvatarPickerVisible(false)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.avatarModalCard}>
            <Text style={styles.avatarModalTitle}>프로필 사진 선택</Text>
            <Text style={styles.avatarModalDescription}>
              기본 프로필을 고르거나 내 사진을 사용할 수 있습니다.
            </Text>
            <View style={styles.avatarPresetRow}>
              {PROFILE_AVATAR_OPTIONS.map((option) => {
                const selected =
                  getSelectedProfileAvatarPreset(avatarUrl) === option.preset;

                return (
                  <Pressable
                    key={option.preset}
                    accessibilityLabel={`${option.label} 기본 프로필`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    disabled={isSaving}
                    onPress={() =>
                      void handleAvatarPresetChange(option.preset)
                    }
                    style={({ pressed }) => [
                      styles.avatarPresetOption,
                      selected && styles.avatarPresetOptionSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Image
                      source={option.source}
                      style={styles.avatarPresetImage}
                    />
                    <Text
                      style={[
                        styles.avatarPresetLabel,
                        selected && styles.avatarPresetLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={styles.avatarPresetState}>
                      {selected ? '선택됨' : '선택하기'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              disabled={isSaving}
              onPress={() => void handleAvatarPhotoUpload()}
              style={({ pressed }) => [
                styles.avatarUploadButton,
                isSaving && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.avatarUploadButtonText}>내 사진 업로드</Text>
            </Pressable>
            <Pressable
              onPress={() => setIsAvatarPickerVisible(false)}
              style={({ pressed }) => [
                styles.avatarModalCloseButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.avatarModalCloseText}>취소</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ProfileInfoRow({
  editable = false,
  label,
  onEdit,
  value,
}: {
  editable?: boolean;
  label: string;
  onEdit?: () => void;
  value: string;
}) {
  const { language } = useAppSettings();
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.infoValue}>
        {value}
      </Text>
      {editable ? (
        <Pressable
          accessibilityLabel={`${label} 수정`}
          accessibilityRole="button"
          onPress={onEdit}
          style={styles.editChip}
        >
          <Text style={styles.editChipText}>{translate(language, 'profile.edit')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type SelectionOption<T extends string | number> = {
  label: string;
  value: T;
};

type SelectionGroupProps<T extends string | number> = {
  label: string;
  options: SelectionOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
};

function SelectionGroup<T extends string | number>({
  label,
  options,
  selectedValue,
  onSelect,
}: SelectionGroupProps<T>) {
  return (
    <View style={styles.selectionGroup}>
      <Text style={styles.selectionLabel}>{label}</Text>
      <View style={styles.optionWrap}>
        {options.map((option) => {
          const isSelected = selectedValue === option.value;

          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(option.value)}
              style={({ pressed }) => [
                styles.optionButton,
                isSelected && styles.optionButtonSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                numberOfLines={1}
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function formatPhoneNumber(value: string) {
  const numbers = value.replace(/\D/g, '').slice(0, 11);

  if (numbers.length <= 3) {
    return numbers;
  }

  if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  }

  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    height: 58,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backText: {
    width: 36,
    color: COLORS.text,
    fontSize: 36,
    lineHeight: 38,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    paddingBottom: 56,
  },
  profileCard: {
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  avatarImage: { width: 100, height: 100, alignSelf: 'center', borderRadius: 50 },
  avatarChangeButton: {
    minHeight: 36,
    marginTop: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D5D5D5',
    borderRadius: 18,
    backgroundColor: '#EFEFEF',
  },
  avatarChange: {
    color: '#2D2D2D',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  avatarModalBackdrop: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14, 20, 54, 0.58)',
  },
  avatarModalCard: {
    width: '100%',
    maxWidth: 380,
    padding: 22,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
  },
  avatarModalTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  avatarModalDescription: {
    marginTop: 7,
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  avatarPresetRow: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
  },
  avatarPresetOption: {
    flex: 1,
    minHeight: 166,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 17,
    backgroundColor: COLORS.background,
  },
  avatarPresetOptionSelected: {
    borderColor: COLORS.navy,
    backgroundColor: COLORS.softNavy,
  },
  avatarPresetImage: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  avatarPresetLabel: {
    marginTop: 9,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  avatarPresetLabelSelected: {
    color: COLORS.navy,
  },
  avatarPresetState: {
    marginTop: 3,
    color: COLORS.subText,
    fontSize: 11,
    fontWeight: '700',
  },
  avatarUploadButton: {
    minHeight: 48,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.navy,
  },
  avatarUploadButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  avatarModalCloseButton: {
    minHeight: 44,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarModalCloseText: {
    color: COLORS.subText,
    fontSize: 14,
    fontWeight: '700',
  },
  profileName: {
    marginTop: 14,
    color: '#171717',
    fontSize: 24,
    fontWeight: '800',
  },
  profileNumber: {
    marginTop: 5,
    color: '#D9DDEF',
    fontSize: 14,
  },
  roleBadge: {
    minHeight: 28,
    marginTop: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  roleText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    marginTop: 18,
    padding: 20,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  requiredBanner: {
    marginTop: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F5C264',
    borderRadius: 16,
    backgroundColor: '#FFF8E8',
  },
  requiredBannerTitle: {
    color: '#7C4A03',
    fontSize: 16,
    fontWeight: '800',
  },
  requiredBannerText: {
    marginTop: 7,
    color: '#8A5A12',
    fontSize: 13,
    lineHeight: 20,
  },
  sectionTitle: {
    color: COLORS.text,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 24,
  },
  sectionDescription: {
    marginTop: 7,
    marginBottom: 22,
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 20,
  },
  readOnlyField: {
    minHeight: 78,
    marginBottom: 22,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.background,
  },
  readOnlyLabel: {
    color: COLORS.subText,
    fontSize: 12,
    fontWeight: '700',
  },
  readOnlyValue: {
    marginTop: 7,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  selectionGroup: {
    marginBottom: 22,
  },
  selectionLabel: {
    marginBottom: 9,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  optionWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  optionButtonSelected: {
    borderColor: COLORS.navy,
    backgroundColor: COLORS.softNavy,
  },
  optionText: {
    color: COLORS.subText,
    fontSize: 13,
    fontWeight: '700',
  },
  optionTextSelected: {
    color: COLORS.navy,
  },
  stateBox: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  stateText: {
    marginTop: 14,
    color: COLORS.subText,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  errorTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  retryButton: {
    minHeight: 44,
    marginTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.navy,
  },
  retryText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  profileDivider: { height: 8, backgroundColor: '#FAFAFA' },
  infoSection: { paddingHorizontal: 20, paddingVertical: 24 },
  infoRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    width: 104,
    color: '#9D9D9D',
    fontFamily: 'FreesentationRegular',
    fontSize: 18,
  },
  infoValue: {
    flex: 1,
    color: '#171717',
    fontFamily: 'FreesentationRegular',
    fontSize: 18,
  },
  editChip: {
    marginLeft: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
  },
  editChipText: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationRegular',
    fontSize: 13,
  },
  menuRow: {
    minHeight: 58,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  menuText: { color: '#171717', fontSize: 18 },
  deleteMenuText: { color: '#C70000', fontSize: 18 },
  menuChevron: { color: '#171717', fontSize: 27 },
  logoutButton: {
    minHeight: 76,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { color: '#A3A3A3', fontSize: 14 },
  passwordContent: { padding: 20 },
  passwordGuide: {
    marginBottom: 26,
    color: '#666666',
    fontSize: 14,
    lineHeight: 21,
  },
  editSheet: {
    padding: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: COLORS.surface,
  },
  sheetHandle: {
    width: 30,
    height: 5,
    alignSelf: 'center',
    borderRadius: 3,
    backgroundColor: '#626262',
  },
  editSheetTitle: {
    marginVertical: 20,
    color: '#171717',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  editSaveButton: {
    backgroundColor: '#3550FF',
  },
});
