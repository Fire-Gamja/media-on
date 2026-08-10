import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
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

import AuthButton from '../../components/auth/AuthButton';
import AuthField from '../../components/auth/AuthField';
import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import {
  AUTH_COLORS,
  AUTH_FONTS,
} from '../../constants/auth-theme';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  getAuthErrorMessage,
  registerStudent,
} from '../../services/auth';

const eyeIcon = require('../../../assets/figma/auth/eye.png');

const GRADES = ['1학년', '2학년', '3학년', '4학년'] as const;

const MAJORS = [
  '영상미디어전공',
  '멀티미디어전공',
  '전공 미정',
] as const;

const ENROLLMENT_STATUSES = [
  '재학',
  '휴학',
  '졸업',
  '제적·자퇴',
] as const;

type Grade = (typeof GRADES)[number];
type Major = (typeof MAJORS)[number];
type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export default function SignUpScreen() {
  const [step, setStep] = useState(1);

  const [name, setName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [grade, setGrade] = useState<Grade | null>(null);
  const [major, setMajor] = useState<Major | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] =
    useState<EnrollmentStatus | null>(null);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordIsValid = useMemo(() => {
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);

    return password.length >= 8 && hasLetter && hasNumber;
  }, [password]);

  const passwordMatches =
    password.length > 0 && password === passwordConfirm;

  const formattedPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);

    if (numbers.length <= 3) {
      return numbers;
    }

    if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }

    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  };

  const validateStepOne = () => {
    if (!name.trim()) {
      Alert.alert('입력 확인', '이름을 입력해 주세요.');
      return false;
    }

    if (!studentNumber.trim()) {
      Alert.alert('입력 확인', '학번을 입력해 주세요.');
      return false;
    }

    if (!passwordIsValid) {
      Alert.alert(
        '비밀번호 확인',
        '비밀번호는 영문과 숫자를 포함해 8자 이상으로 입력해 주세요.',
      );
      return false;
    }

    if (!passwordMatches) {
      Alert.alert(
        '비밀번호 확인',
        '비밀번호 확인 값이 일치하지 않습니다.',
      );
      return false;
    }

    return true;
  };

  const validateStepTwo = () => {
    if (!grade || !major || !enrollmentStatus) {
      Alert.alert(
        '선택 확인',
        '학년, 전공, 재학 상태를 모두 선택해 주세요.',
      );
      return false;
    }

    if (grade === '1학년' && major !== '전공 미정') {
      Alert.alert(
        '전공 확인',
        '1학년 학생은 전공 미정을 선택해 주세요.',
      );
      return false;
    }

    if (grade !== '1학년' && major === '전공 미정') {
      Alert.alert(
        '전공 확인',
        '2~4학년 학생은 소속 전공을 선택해 주세요.',
      );
      return false;
    }

    return true;
  };

  const validateStepThree = () => {
    const phoneNumbersOnly = phoneNumber.replace(/\D/g, '');

    if (phoneNumbersOnly.length !== 11) {
      Alert.alert(
        '휴대전화번호 확인',
        '휴대전화번호 11자리를 입력해 주세요.',
      );
      return false;
    }

    if (!privacyAgreed || !termsAgreed) {
      Alert.alert(
        '약관 동의 확인',
        '필수 약관에 모두 동의해 주세요.',
      );
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStepOne()) {
      return;
    }

    if (step === 2 && !validateStepTwo()) {
      return;
    }

    setStep((previous) => Math.min(previous + 1, 3));
  };

  const handlePrevious = () => {
    if (step === 1) {
      router.back();
      return;
    }

    setStep((previous) => Math.max(previous - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStepThree()) {
      return;
    }

    if (!grade || !major || !enrollmentStatus) {
      setStep(2);
      Alert.alert('선택 확인', '학적정보를 다시 확인해 주세요.');
      return;
    }

    if (isSupabaseConfigured) {
      try {
        setIsSubmitting(true);
        await registerStudent({
          name,
          studentNumber,
          password,
          grade: Number(grade.slice(0, 1)),
          major,
          enrollmentStatus,
          phoneNumber,
          privacyAgreed,
          termsAgreed,
        });

        Alert.alert(
          '가입 신청 완료',
          '회원가입 신청이 저장되었습니다.\n관리자 승인 후 로그인할 수 있습니다.',
          [
            {
              text: '확인',
              onPress: () => router.replace('/login'),
            },
          ],
        );
      } catch (error) {
        Alert.alert('가입 신청 실패', getAuthErrorMessage(error));
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    Alert.alert(
      '가입 신청 완료',
      '회원가입 신청이 접수되었습니다.\n관리자 승인 후 로그인할 수 있습니다.',
      [
        {
          text: '확인',
          onPress: () => router.replace('/login'),
        },
      ],
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={styles.safeArea}
    >
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={handlePrevious}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="이전 화면으로 이동"
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <PlatformHeaderIcon
              color={AUTH_COLORS.text}
              name="back"
              size={30}
            />
          </Pressable>

          <Text
            accessibilityLabel={`회원가입 ${step}단계, 전체 3단계`}
            style={styles.stepText}
          >
            {step}/3
          </Text>

          <View style={styles.formContent}>
            {step === 1 ? (
              <StepOne
                name={name}
                studentNumber={studentNumber}
                password={password}
                passwordConfirm={passwordConfirm}
                showPassword={showPassword}
                passwordIsValid={passwordIsValid}
                passwordMatches={passwordMatches}
                onChangeName={setName}
                onChangeStudentNumber={setStudentNumber}
                onChangePassword={setPassword}
                onChangePasswordConfirm={setPasswordConfirm}
                onTogglePassword={() =>
                  setShowPassword((previous) => !previous)
                }
              />
            ) : null}

            {step === 2 ? (
              <StepTwo
                grade={grade}
                major={major}
                enrollmentStatus={enrollmentStatus}
                onChangeGrade={(selectedGrade) => {
                  setGrade(selectedGrade);

                  if (selectedGrade === '1학년') {
                    setMajor('전공 미정');
                  } else if (major === '전공 미정') {
                    setMajor(null);
                  }
                }}
                onChangeMajor={setMajor}
                onChangeEnrollmentStatus={setEnrollmentStatus}
              />
            ) : null}

            {step === 3 ? (
              <StepThree
                phoneNumber={phoneNumber}
                privacyAgreed={privacyAgreed}
                termsAgreed={termsAgreed}
                onChangePhoneNumber={(value) =>
                  setPhoneNumber(formattedPhoneNumber(value))
                }
                onChangePrivacyAgreed={setPrivacyAgreed}
                onChangeTermsAgreed={setTermsAgreed}
              />
            ) : null}

            <AuthButton
              title={step === 3 ? '가입 신청' : '다음'}
              loading={isSubmitting}
              onPress={
                step === 3 ? () => void handleSubmit() : handleNext
              }
              style={styles.nextButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type StepOneProps = {
  name: string;
  studentNumber: string;
  password: string;
  passwordConfirm: string;
  showPassword: boolean;
  passwordIsValid: boolean;
  passwordMatches: boolean;
  onChangeName: (value: string) => void;
  onChangeStudentNumber: (value: string) => void;
  onChangePassword: (value: string) => void;
  onChangePasswordConfirm: (value: string) => void;
  onTogglePassword: () => void;
};

function StepOne({
  name,
  studentNumber,
  password,
  passwordConfirm,
  showPassword,
  passwordIsValid,
  passwordMatches,
  onChangeName,
  onChangeStudentNumber,
  onChangePassword,
  onChangePasswordConfirm,
  onTogglePassword,
}: StepOneProps) {
  return (
    <>
      <SectionHeader
        title="기본정보를 입력해 주세요"
        description="가입 승인 확인을 위해 정확한 정보를 입력해 주세요."
      />

      <View style={styles.fieldList}>
        <AuthField
          label="이름"
          value={name}
          onChangeText={onChangeName}
          placeholder="이름을 입력해 주세요"
          autoCorrect={false}
          returnKeyType="next"
        />

        <AuthField
          label="학번"
          value={studentNumber}
          onChangeText={(value) =>
            onChangeStudentNumber(value.replace(/\D/g, ''))
          }
          placeholder="학번을 입력해 주세요"
          keyboardType="number-pad"
          maxLength={20}
          returnKeyType="next"
        />

        <AuthField
          label="비밀번호"
          value={password}
          onChangeText={onChangePassword}
          placeholder="영문·숫자 포함 8자 이상"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          errorMessage={
            password.length > 0 && !passwordIsValid
              ? '영문과 숫자를 포함해 8자 이상 입력해 주세요.'
              : undefined
          }
          rightActionLabel={
            showPassword ? '비밀번호 숨기기' : '비밀번호 보기'
          }
          rightActionIcon={eyeIcon}
          onRightActionPress={onTogglePassword}
        />

        <AuthField
          label="비밀번호 확인"
          value={passwordConfirm}
          onChangeText={onChangePasswordConfirm}
          placeholder="비밀번호를 다시 입력해 주세요"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          errorMessage={
            passwordConfirm.length > 0 && !passwordMatches
              ? '비밀번호가 일치하지 않습니다.'
              : undefined
          }
          rightActionLabel={
            showPassword ? '비밀번호 숨기기' : '비밀번호 보기'
          }
          rightActionIcon={eyeIcon}
          onRightActionPress={onTogglePassword}
          returnKeyType="done"
        />
      </View>
    </>
  );
}

type StepTwoProps = {
  grade: Grade | null;
  major: Major | null;
  enrollmentStatus: EnrollmentStatus | null;
  onChangeGrade: (value: Grade) => void;
  onChangeMajor: (value: Major) => void;
  onChangeEnrollmentStatus: (value: EnrollmentStatus) => void;
};

function StepTwo({
  grade,
  major,
  enrollmentStatus,
  onChangeGrade,
  onChangeMajor,
  onChangeEnrollmentStatus,
}: StepTwoProps) {
  return (
    <>
      <SectionHeader
        title="학적정보를 선택해 주세요"
        description="학년과 전공에 맞는 공지 제공에 사용됩니다."
      />

      <SelectionGroup
        label="학년"
        options={GRADES}
        selectedValue={grade}
        onSelect={onChangeGrade}
      />

      <SelectionGroup
        label="전공"
        options={MAJORS}
        selectedValue={major}
        onSelect={onChangeMajor}
      />

      <SelectionGroup
        label="재학 상태"
        options={ENROLLMENT_STATUSES}
        selectedValue={enrollmentStatus}
        onSelect={onChangeEnrollmentStatus}
      />
    </>
  );
}

type StepThreeProps = {
  phoneNumber: string;
  privacyAgreed: boolean;
  termsAgreed: boolean;
  onChangePhoneNumber: (value: string) => void;
  onChangePrivacyAgreed: (value: boolean) => void;
  onChangeTermsAgreed: (value: boolean) => void;
};

function StepThree({
  phoneNumber,
  privacyAgreed,
  termsAgreed,
  onChangePhoneNumber,
  onChangePrivacyAgreed,
  onChangeTermsAgreed,
}: StepThreeProps) {
  const allAgreed = privacyAgreed && termsAgreed;

  const handleAllAgreement = () => {
    const nextValue = !allAgreed;

    onChangePrivacyAgreed(nextValue);
    onChangeTermsAgreed(nextValue);
  };

  return (
    <>
      <SectionHeader
        title="연락처와 약관을 확인해 주세요"
        description="가입 승인 결과와 계정 복구에 사용됩니다."
      />

      <View style={styles.fieldList}>
        <AuthField
          label="휴대전화번호"
          value={phoneNumber}
          onChangeText={onChangePhoneNumber}
          placeholder="010-0000-0000"
          keyboardType="phone-pad"
          maxLength={13}
          returnKeyType="done"
        />
      </View>

      <View style={styles.agreementBox}>
        <AgreementRow
          label="전체 동의"
          checked={allAgreed}
          emphasized
          onPress={handleAllAgreement}
        />

        <View style={styles.agreementDivider} />

        <AgreementRow
          label="[필수] 개인정보처리방침 확인"
          checked={privacyAgreed}
          onPress={() => onChangePrivacyAgreed(!privacyAgreed)}
          onView={() =>
            router.push({
              pathname: '/legal-document',
              params: { type: 'privacy' },
            })
          }
        />

        <AgreementRow
          label="[필수] 서비스 이용약관 동의"
          checked={termsAgreed}
          onPress={() => onChangeTermsAgreed(!termsAgreed)}
          onView={() =>
            router.push({
              pathname: '/legal-document',
              params: { type: 'terms' },
            })
          }
        />
      </View>

      <View style={styles.approvalGuide}>
        <Text style={styles.approvalGuideTitle}>
          가입 승인 안내
        </Text>

        <Text style={styles.approvalGuideText}>
          가입 신청 후 실습조교·행정조교 또는 마스터 관리자가
          이름과 학번을 확인합니다. 승인 완료 후 로그인할 수
          있습니다.
        </Text>
      </View>
    </>
  );
}

type SectionHeaderProps = {
  title: string;
  description: string;
};

function SectionHeader({
  title,
  description,
}: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
    </View>
  );
}

type SelectionGroupProps<T extends string> = {
  label: string;
  options: readonly T[];
  selectedValue: T | null;
  onSelect: (value: T) => void;
};

function SelectionGroup<T extends string>({
  label,
  options,
  selectedValue,
  onSelect,
}: SelectionGroupProps<T>) {
  return (
    <View style={styles.selectionSection}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.optionContainer}>
        {options.map((option) => {
          const selected = option === selectedValue;

          return (
            <Pressable
              key={option}
              style={({ pressed }) => [
                styles.optionButton,
                selected && styles.optionButtonSelected,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => onSelect(option)}
            >
              <Text
                style={[
                  styles.optionText,
                  selected && styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type AgreementRowProps = {
  label: string;
  checked: boolean;
  emphasized?: boolean;
  onPress: () => void;
  onView?: () => void;
};

function AgreementRow({
  label,
  checked,
  emphasized = false,
  onPress,
  onView,
}: AgreementRowProps) {
  return (
    <View style={styles.agreementRow}>
      <Pressable
        style={styles.agreementMain}
        onPress={onPress}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
      >
        <View
          style={[
            styles.checkbox,
            checked && styles.checkboxSelected,
          ]}
        >
          <Text style={styles.checkboxMark}>
            {checked ? '✓' : ''}
          </Text>
        </View>

        <Text
          style={[
            styles.agreementText,
            emphasized && styles.agreementTextEmphasized,
          ]}
        >
          {label}
        </Text>
      </Pressable>
      {onView ? (
        <Pressable accessibilityRole="link" hitSlop={8} onPress={onView}>
          <Text style={styles.agreementView}>내용 보기</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 36,
  },
  backButton: {
    position: 'absolute',
    zIndex: 2,
    top: 15,
    left: 16,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    position: 'absolute',
    top: 18,
    right: 20,
    color: AUTH_COLORS.subText,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
  },
  formContent: {
    paddingTop: 126,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginBottom: 28,
  },
  sectionTitle: {
    maxWidth: 334,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 24,
    lineHeight: 28,
  },
  sectionDescription: {
    marginTop: 8,
    color: AUTH_COLORS.subText,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  fieldList: {
    gap: 18,
  },
  label: {
    marginBottom: 9,
    color: AUTH_COLORS.subText,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 14,
  },
  selectionSection: {
    marginBottom: 24,
  },
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    minHeight: 46,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AUTH_COLORS.inputBorder,
    borderRadius: 4,
    backgroundColor: AUTH_COLORS.input,
  },
  optionButtonSelected: {
    borderColor: AUTH_COLORS.primary,
    backgroundColor: AUTH_COLORS.primary,
  },
  optionText: {
    color: AUTH_COLORS.subText,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 14,
  },
  optionTextSelected: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
  },
  agreementBox: {
    marginTop: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: AUTH_COLORS.inputBorder,
    borderRadius: 4,
    backgroundColor: AUTH_COLORS.input,
  },
  agreementRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  agreementMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  agreementDivider: {
    height: 1,
    marginVertical: 5,
    backgroundColor: AUTH_COLORS.inputBorder,
  },
  checkbox: {
    width: 22,
    height: 22,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AUTH_COLORS.inputFocused,
    borderRadius: 4,
    backgroundColor: AUTH_COLORS.background,
  },
  checkboxSelected: {
    borderColor: AUTH_COLORS.primary,
    backgroundColor: AUTH_COLORS.primary,
  },
  checkboxMark: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 15,
  },
  agreementText: {
    flex: 1,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  agreementTextEmphasized: {
    fontFamily: AUTH_FONTS.extraBold,
  },
  agreementView: {
    color: AUTH_COLORS.link,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  approvalGuide: {
    marginTop: 20,
    padding: 16,
    borderRadius: 4,
    backgroundColor: AUTH_COLORS.overlay,
  },
  approvalGuideTitle: {
    color: AUTH_COLORS.link,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 14,
  },
  approvalGuideText: {
    marginTop: 8,
    color: AUTH_COLORS.subText,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  nextButton: {
    marginTop: 38,
    marginBottom: 12,
  },
  buttonPressed: {
    opacity: 0.65,
  },
});
