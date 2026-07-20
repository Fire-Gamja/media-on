import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
  softNavy: '#E9ECF8',
  error: '#DC2626',
};

type Step = 'identity' | 'verification' | 'new-password';

export default function PasswordResetPhoneScreen() {
  const [step, setStep] = useState<Step>('identity');

  const [studentNumber, setStudentNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] =
    useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [remainingSeconds, setRemainingSeconds] =
    useState(180);

  useEffect(() => {
    if (step !== 'verification' || remainingSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((previous) =>
        Math.max(previous - 1, 0),
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [step, remainingSeconds]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [remainingSeconds]);

  const passwordIsValid = useMemo(() => {
    const hasLetter = /[A-Za-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);

    return (
      newPassword.length >= 8 &&
      hasLetter &&
      hasNumber
    );
  }, [newPassword]);

  const passwordMatches =
    newPassword.length > 0 &&
    newPassword === newPasswordConfirm;

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);

    if (numbers.length <= 3) {
      return numbers;
    }

    if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }

    return `${numbers.slice(0, 3)}-${numbers.slice(
      3,
      7,
    )}-${numbers.slice(7)}`;
  };

  const handleSendCode = () => {
    const phoneNumbersOnly = phoneNumber.replace(/\D/g, '');

    if (!studentNumber.trim()) {
      Alert.alert('입력 확인', '학번을 입력해 주세요.');
      return;
    }

    if (phoneNumbersOnly.length !== 11) {
      Alert.alert(
        '입력 확인',
        '휴대전화번호 11자리를 입력해 주세요.',
      );
      return;
    }

    // 추후 Supabase 및 문자 인증 API와 연결합니다.
    setVerificationCode('');
    setRemainingSeconds(180);
    setStep('verification');

    Alert.alert(
      '인증번호 발송',
      '등록된 휴대전화번호로 인증번호를 발송했습니다.',
    );
  };

  const handleVerifyCode = () => {
    if (remainingSeconds <= 0) {
      Alert.alert(
        '인증시간 만료',
        '인증번호를 다시 요청해 주세요.',
      );
      return;
    }

    if (verificationCode.length !== 6) {
      Alert.alert(
        '입력 확인',
        '인증번호 6자리를 입력해 주세요.',
      );
      return;
    }

    // 현재는 화면 테스트용 인증입니다.
    setStep('new-password');
  };

  const handleResendCode = () => {
    setVerificationCode('');
    setRemainingSeconds(180);

    Alert.alert(
      '인증번호 재발송',
      '새 인증번호를 발송했습니다.',
    );
  };

  const handleChangePassword = () => {
    if (!passwordIsValid) {
      Alert.alert(
        '비밀번호 확인',
        '영문과 숫자를 포함해 8자 이상 입력해 주세요.',
      );
      return;
    }

    if (!passwordMatches) {
      Alert.alert(
        '비밀번호 확인',
        '새 비밀번호가 일치하지 않습니다.',
      );
      return;
    }

    Alert.alert(
      '변경 완료',
      '비밀번호가 변경되었습니다.',
      [
        {
          text: '로그인하기',
          onPress: () => router.replace('/login'),
        },
      ],
    );
  };

  const handleBack = () => {
    if (step === 'new-password') {
      setStep('verification');
      return;
    }

    if (step === 'verification') {
      setStep('identity');
      return;
    }

    router.back();
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="이전 화면으로 이동"
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            휴대전화번호 인증
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'identity' && (
            <>
              <ScreenTitle
                title="가입 정보를 입력해 주세요"
                description="가입할 때 등록한 학번과 휴대전화번호를 확인합니다."
              />

              <FormField label="학번">
                <TextInput
                  value={studentNumber}
                  onChangeText={(value) =>
                    setStudentNumber(
                      value.replace(/\D/g, ''),
                    )
                  }
                  style={styles.input}
                  placeholder="학번을 입력해 주세요"
                  placeholderTextColor={COLORS.placeholder}
                  keyboardType="number-pad"
                  maxLength={20}
                />
              </FormField>

              <FormField label="휴대전화번호">
                <TextInput
                  value={phoneNumber}
                  onChangeText={(value) =>
                    setPhoneNumber(formatPhoneNumber(value))
                  }
                  style={styles.input}
                  placeholder="010-0000-0000"
                  placeholderTextColor={COLORS.placeholder}
                  keyboardType="phone-pad"
                  maxLength={13}
                />
              </FormField>

              <PrimaryButton
                label="인증번호 받기"
                onPress={handleSendCode}
              />
            </>
          )}

          {step === 'verification' && (
            <>
              <ScreenTitle
                title="인증번호를 입력해 주세요"
                description={`${phoneNumber}로 전송된 인증번호 6자리를 입력해 주세요.`}
              />

              <FormField label="인증번호">
                <View style={styles.codeInputContainer}>
                  <TextInput
                    value={verificationCode}
                    onChangeText={(value) =>
                      setVerificationCode(
                        value.replace(/\D/g, '').slice(0, 6),
                      )
                    }
                    style={styles.codeInput}
                    placeholder="인증번호 6자리"
                    placeholderTextColor={COLORS.placeholder}
                    keyboardType="number-pad"
                    maxLength={6}
                  />

                  <Text
                    style={[
                      styles.timerText,
                      remainingSeconds === 0 &&
                        styles.timerExpired,
                    ]}
                  >
                    {formattedTime}
                  </Text>
                </View>
              </FormField>

              <PrimaryButton
                label="인증 확인"
                onPress={handleVerifyCode}
              />

              <Pressable
                style={styles.secondaryButton}
                onPress={handleResendCode}
              >
                <Text style={styles.secondaryButtonText}>
                  인증번호 다시 받기
                </Text>
              </Pressable>

              {remainingSeconds === 0 && (
                <Text style={styles.expiredText}>
                  인증시간이 만료되었습니다. 인증번호를 다시
                  요청해 주세요.
                </Text>
              )}
            </>
          )}

          {step === 'new-password' && (
            <>
              <ScreenTitle
                title="새 비밀번호를 설정해 주세요"
                description="영문과 숫자를 포함해 8자 이상 입력해 주세요."
              />

              <FormField label="새 비밀번호">
                <View style={styles.passwordContainer}>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    style={styles.passwordInput}
                    placeholder="영문·숫자 포함 8자 이상"
                    placeholderTextColor={COLORS.placeholder}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <Pressable
                    onPress={() =>
                      setShowPassword((previous) => !previous)
                    }
                    hitSlop={10}
                  >
                    <Text style={styles.passwordToggle}>
                      {showPassword ? '숨기기' : '보기'}
                    </Text>
                  </Pressable>
                </View>

                {newPassword.length > 0 &&
                  !passwordIsValid && (
                    <Text style={styles.errorText}>
                      영문과 숫자를 포함해 8자 이상 입력해
                      주세요.
                    </Text>
                  )}
              </FormField>

              <FormField label="새 비밀번호 확인">
                <TextInput
                  value={newPasswordConfirm}
                  onChangeText={setNewPasswordConfirm}
                  style={styles.input}
                  placeholder="새 비밀번호를 다시 입력해 주세요"
                  placeholderTextColor={COLORS.placeholder}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {newPasswordConfirm.length > 0 &&
                  !passwordMatches && (
                    <Text style={styles.errorText}>
                      비밀번호가 일치하지 않습니다.
                    </Text>
                  )}
              </FormField>

              <PrimaryButton
                label="비밀번호 변경"
                onPress={handleChangePassword}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ScreenTitleProps = {
  title: string;
  description: string;
};

function ScreenTitle({
  title,
  description,
}: ScreenTitleProps) {
  return (
    <View style={styles.titleArea}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
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

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
};

function PrimaryButton({
  label,
  onPress,
}: PrimaryButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  backText: {
    width: 32,
    color: COLORS.navy,
    fontSize: 38,
    lineHeight: 40,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
  },
  titleArea: {
    marginBottom: 34,
  },
  title: {
    color: COLORS.text,
    fontSize: 27,
    lineHeight: 38,
    fontWeight: '800',
  },
  description: {
    marginTop: 11,
    color: COLORS.subText,
    fontSize: 14,
    lineHeight: 22,
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
  codeInputContainer: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.white,
  },
  codeInput: {
    flex: 1,
    height: '100%',
    color: COLORS.text,
    fontSize: 17,
    letterSpacing: 3,
  },
  timerText: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '800',
  },
  timerExpired: {
    color: COLORS.error,
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
  primaryButton: {
    height: 56,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.navy,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryButton: {
    height: 52,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.navy,
    borderRadius: 14,
    backgroundColor: COLORS.white,
  },
  secondaryButtonText: {
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  errorText: {
    marginTop: 8,
    color: COLORS.error,
    fontSize: 12,
    lineHeight: 18,
  },
  expiredText: {
    marginTop: 16,
    color: COLORS.error,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});