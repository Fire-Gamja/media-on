import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  navy: '#182366',
  white: '#FFFFFF',
  background: '#F7F8FC',
  border: '#D9DDEB',
  text: '#111827',
  subText: '#6B7280',
  placeholder: '#9CA3AF',
  selectedBackground: '#E9ECF8',
  error: '#DC2626',
};

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
  const [marketingAgreed, setMarketingAgreed] = useState(false);

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

  const handleSubmit = () => {
    if (!validateStepThree()) {
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={handlePrevious}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="이전 화면으로 이동"
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>회원가입</Text>

          <Text style={styles.stepText}>{step}/3</Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(step / 3) * 100}%` },
            ]}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && (
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
          )}

          {step === 2 && (
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
          )}

          {step === 3 && (
            <StepThree
              phoneNumber={phoneNumber}
              privacyAgreed={privacyAgreed}
              termsAgreed={termsAgreed}
              marketingAgreed={marketingAgreed}
              onChangePhoneNumber={(value) =>
                setPhoneNumber(formattedPhoneNumber(value))
              }
              onChangePrivacyAgreed={setPrivacyAgreed}
              onChangeTermsAgreed={setTermsAgreed}
              onChangeMarketingAgreed={setMarketingAgreed}
            />
          )}
        </ScrollView>

        <View style={styles.bottomArea}>
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={step === 3 ? handleSubmit : handleNext}
          >
            <Text style={styles.nextButtonText}>
              {step === 3 ? '가입 신청' : '다음'}
            </Text>
          </Pressable>
        </View>
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

      <FormField label="이름">
        <TextInput
          value={name}
          onChangeText={onChangeName}
          style={styles.input}
          placeholder="이름을 입력해 주세요"
          placeholderTextColor={COLORS.placeholder}
          autoCorrect={false}
          returnKeyType="next"
        />
      </FormField>

      <FormField label="학번">
        <TextInput
          value={studentNumber}
          onChangeText={(value) =>
            onChangeStudentNumber(value.replace(/\D/g, ''))
          }
          style={styles.input}
          placeholder="학번을 입력해 주세요"
          placeholderTextColor={COLORS.placeholder}
          keyboardType="number-pad"
          maxLength={20}
        />
      </FormField>

      <FormField label="비밀번호">
        <View style={styles.passwordContainer}>
          <TextInput
            value={password}
            onChangeText={onChangePassword}
            style={styles.passwordInput}
            placeholder="영문·숫자 포함 8자 이상"
            placeholderTextColor={COLORS.placeholder}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable onPress={onTogglePassword} hitSlop={10}>
            <Text style={styles.passwordToggle}>
              {showPassword ? '숨기기' : '보기'}
            </Text>
          </Pressable>
        </View>

        {password.length > 0 && !passwordIsValid && (
          <Text style={styles.errorText}>
            영문과 숫자를 포함해 8자 이상 입력해 주세요.
          </Text>
        )}
      </FormField>

      <FormField label="비밀번호 확인">
        <TextInput
          value={passwordConfirm}
          onChangeText={onChangePasswordConfirm}
          style={styles.input}
          placeholder="비밀번호를 다시 입력해 주세요"
          placeholderTextColor={COLORS.placeholder}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {passwordConfirm.length > 0 && !passwordMatches && (
          <Text style={styles.errorText}>
            비밀번호가 일치하지 않습니다.
          </Text>
        )}
      </FormField>
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
  marketingAgreed: boolean;
  onChangePhoneNumber: (value: string) => void;
  onChangePrivacyAgreed: (value: boolean) => void;
  onChangeTermsAgreed: (value: boolean) => void;
  onChangeMarketingAgreed: (value: boolean) => void;
};

function StepThree({
  phoneNumber,
  privacyAgreed,
  termsAgreed,
  marketingAgreed,
  onChangePhoneNumber,
  onChangePrivacyAgreed,
  onChangeTermsAgreed,
  onChangeMarketingAgreed,
}: StepThreeProps) {
  const allAgreed =
    privacyAgreed && termsAgreed && marketingAgreed;

  const handleAllAgreement = () => {
    const nextValue = !allAgreed;

    onChangePrivacyAgreed(nextValue);
    onChangeTermsAgreed(nextValue);
    onChangeMarketingAgreed(nextValue);
  };

  return (
    <>
      <SectionHeader
        title="연락처와 약관을 확인해 주세요"
        description="가입 승인 결과와 계정 복구에 사용됩니다."
      />

      <FormField label="휴대전화번호">
        <TextInput
          value={phoneNumber}
          onChangeText={onChangePhoneNumber}
          style={styles.input}
          placeholder="010-0000-0000"
          placeholderTextColor={COLORS.placeholder}
          keyboardType="phone-pad"
          maxLength={13}
        />
      </FormField>

      <View style={styles.agreementBox}>
        <AgreementRow
          label="전체 동의"
          checked={allAgreed}
          emphasized
          onPress={handleAllAgreement}
        />

        <View style={styles.agreementDivider} />

        <AgreementRow
          label="[필수] 개인정보 수집·이용 동의"
          checked={privacyAgreed}
          onPress={() => onChangePrivacyAgreed(!privacyAgreed)}
        />

        <AgreementRow
          label="[필수] 서비스 이용약관 동의"
          checked={termsAgreed}
          onPress={() => onChangeTermsAgreed(!termsAgreed)}
        />

        <AgreementRow
          label="[선택] 마케팅·홍보 알림 수신 동의"
          checked={marketingAgreed}
          onPress={() =>
            onChangeMarketingAgreed(!marketingAgreed)
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

type FormFieldProps = {
  label: string;
  children: React.ReactNode;
};

function FormField({ label, children }: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
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
};

function AgreementRow({
  label,
  checked,
  emphasized = false,
  onPress,
}: AgreementRowProps) {
  return (
    <Pressable
      style={styles.agreementRow}
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
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    height: 58,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
  },
  backText: {
    width: 30,
    color: COLORS.navy,
    fontSize: 38,
    lineHeight: 40,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  stepText: {
    width: 30,
    color: COLORS.subText,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.border,
  },
  progressFill: {
    height: 4,
    backgroundColor: COLORS.navy,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 25,
    lineHeight: 34,
    fontWeight: '800',
  },
  sectionDescription: {
    marginTop: 10,
    color: COLORS.subText,
    fontSize: 14,
    lineHeight: 21,
  },
  field: {
    marginBottom: 22,
  },
  label: {
    marginBottom: 9,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontSize: 16,
  },
  passwordContainer: {
    height: 56,
    paddingLeft: 16,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.white,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    color: COLORS.text,
    fontSize: 16,
  },
  passwordToggle: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 8,
    color: COLORS.error,
    fontSize: 12,
    lineHeight: 18,
  },
  selectionSection: {
    marginBottom: 28,
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
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  optionButtonSelected: {
    borderColor: COLORS.navy,
    backgroundColor: COLORS.selectedBackground,
  },
  optionText: {
    color: COLORS.subText,
    fontSize: 14,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: COLORS.navy,
    fontWeight: '800',
  },
  agreementBox: {
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.white,
  },
  agreementRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  agreementDivider: {
    height: 1,
    marginVertical: 5,
    backgroundColor: COLORS.border,
  },
  checkbox: {
    width: 23,
    height: 23,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: COLORS.white,
  },
  checkboxSelected: {
    borderColor: COLORS.navy,
    backgroundColor: COLORS.navy,
  },
  checkboxMark: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  agreementText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  agreementTextEmphasized: {
    fontWeight: '800',
  },
  approvalGuide: {
    marginTop: 24,
    padding: 18,
    borderRadius: 14,
    backgroundColor: COLORS.selectedBackground,
  },
  approvalGuideTitle: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '800',
  },
  approvalGuideText: {
    marginTop: 8,
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 20,
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  nextButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.navy,
  },
  nextButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});