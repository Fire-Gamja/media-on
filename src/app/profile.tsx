import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FormField from '../components/common/FormField';
import PrimaryButton from '../components/common/PrimaryButton';
import { COLORS } from '../constants/colors';
import {
  changeCurrentPassword,
  getAuthErrorMessage,
  getCurrentProfile,
  type StudentProfile,
  updateCurrentProfile,
} from '../services/auth';

const GRADES = [1, 2, 3, 4] as const;
const MAJORS = [
  '영상미디어전공',
  '멀티미디어전공',
  '전공 미정',
] as const;
const ENROLLMENT_STATUSES = ['재학', '휴학', '졸업', '제적·자퇴'] as const;

export default function ProfileScreen() {
  const { mustChangePassword } = useLocalSearchParams<{
    mustChangePassword?: string;
  }>();
  const isPasswordChangeRequired = mustChangePassword === '1';
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

  const applyProfile = useCallback((nextProfile: StudentProfile) => {
    setProfile(nextProfile);
    setName(nextProfile.name);
    setGrade(nextProfile.grade);
    setMajor(nextProfile.major);
    setEnrollmentStatus(nextProfile.enrollment_status);
    setPhoneNumber(formatPhoneNumber(nextProfile.phone_number));
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      applyProfile(await getCurrentProfile());
    } catch (error) {
      setLoadError(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [applyProfile]);

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

  const handleGradeSelect = (nextGrade: number) => {
    setGrade(nextGrade);

    if (nextGrade === 1) {
      setMajor('전공 미정');
    } else if (major === '전공 미정') {
      setMajor('영상미디어전공');
    }
  };

  const handleBack = () => {
    if (isPasswordChangeRequired) {
      Alert.alert(
        '비밀번호 변경 필요',
        '임시 비밀번호를 새 비밀번호로 변경한 뒤 서비스를 이용할 수 있습니다.',
      );
      return;
    }

    router.back();
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
            hitSlop={10}
            onPress={handleBack}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {isPasswordChangeRequired ? '새 비밀번호 설정' : '내 정보'}
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
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile.name.slice(0, 1)}
                </Text>
              </View>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileNumber}>
                {profile.student_number}
              </Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {profile.role === 'admin' ? '관리자 계정' : '학생 계정'}
                </Text>
              </View>
            </View>

            {isPasswordChangeRequired ? (
              <View style={styles.requiredBanner}>
                <Text style={styles.requiredBannerTitle}>
                  임시 비밀번호로 로그인했습니다
                </Text>
                <Text style={styles.requiredBannerText}>
                  아래에서 새 비밀번호를 설정하면 홈 화면으로 이동합니다.
                </Text>
              </View>
            ) : null}

            {!isPasswordChangeRequired ? (
              <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>기본 정보</Text>
              <Text style={styles.sectionDescription}>
                학번과 계정 권한은 관리자 확인 항목으로 직접 변경할 수
                없습니다.
              </Text>

              <FormField
                label="이름"
                value={name}
                onChangeText={setName}
                maxLength={30}
                placeholder="이름을 입력해 주세요"
              />

              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyLabel}>학번</Text>
                <Text style={styles.readOnlyValue}>
                  {profile.student_number}
                </Text>
              </View>

              <SelectionGroup
                label="학년"
                options={GRADES.map((value) => ({
                  label: `${value}학년`,
                  value,
                }))}
                selectedValue={grade}
                onSelect={handleGradeSelect}
              />

              <SelectionGroup
                label="전공"
                options={MAJORS.map((value) => ({ label: value, value }))}
                selectedValue={major}
                onSelect={setMajor}
              />

              <SelectionGroup
                label="학적 상태"
                options={ENROLLMENT_STATUSES.map((value) => ({
                  label: value,
                  value,
                }))}
                selectedValue={enrollmentStatus}
                onSelect={setEnrollmentStatus}
              />

              <FormField
                label="휴대전화번호"
                value={phoneNumber}
                onChangeText={(value) =>
                  setPhoneNumber(formatPhoneNumber(value))
                }
                keyboardType="phone-pad"
                maxLength={13}
                placeholder="010-0000-0000"
              />

              <PrimaryButton
                title="내 정보 저장"
                loading={isSaving}
                onPress={() => void handleSave()}
              />
              </View>
            ) : null}

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>비밀번호 변경</Text>
              <Text style={styles.sectionDescription}>
                {isPasswordChangeRequired
                  ? '관리자에게 안내받은 임시 비밀번호를 입력해 주세요.'
                  : '본인 확인을 위해 현재 비밀번호를 먼저 입력해 주세요.'}
              </Text>

              <FormField
                label={
                  isPasswordChangeRequired
                    ? '임시 비밀번호'
                    : '현재 비밀번호'
                }
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
                title="비밀번호 변경"
                loading={isChangingPassword}
                onPress={() => void handleChangePassword()}
              />
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    fontSize: 18,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 56,
  },
  profileCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.navy,
  },
  avatar: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.42)',
    borderRadius: 38,
    backgroundColor: '#303D82',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '800',
  },
  profileName: {
    marginTop: 14,
    color: COLORS.white,
    fontSize: 23,
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
    fontSize: 20,
    fontWeight: '800',
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
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    minHeight: 42,
    paddingHorizontal: 14,
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
});
