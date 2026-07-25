import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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
import {
  AUTH_COLORS,
  AUTH_FONTS,
} from '../../constants/auth-theme';
import { isSupabaseConfigured } from '../../lib/supabase';
import { getAuthErrorMessage } from '../../services/auth';
import { createPasswordResetRequest } from '../../services/password-reset-requests';

const TOTAL_STEPS = 4;

export default function PasswordResetRequestScreen() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isComplete = step > TOTAL_STEPS;

  const handleBack = () => {
    if (isComplete) {
      router.replace('/login');
      return;
    }

    if (step === 1) {
      router.back();
      return;
    }

    setStep((previous) => previous - 1);
  };

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      Alert.alert('입력 확인', '이름을 입력해 주세요.');
      return;
    }

    if (step === 2 && !studentNumber.trim()) {
      Alert.alert('입력 확인', '학번 또는 사번을 입력해 주세요.');
      return;
    }

    if (
      step === 3 &&
      phoneNumber.replace(/\D/g, '').length !== 11
    ) {
      Alert.alert(
        '입력 확인',
        '가입할 때 등록한 휴대전화번호 11자리를 입력해 주세요.',
      );
      return;
    }

    if (step < TOTAL_STEPS) {
      setStep((previous) => previous + 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (isSupabaseConfigured) {
        await createPasswordResetRequest({
          name,
          studentNumber,
          phoneNumber,
          reason,
        });
      }

      setStep(TOTAL_STEPS + 1);
    } catch (error) {
      Alert.alert('요청 실패', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isComplete ? '로그인 화면으로 이동' : '이전 단계로 이동'
            }
            hitSlop={12}
            onPress={handleBack}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <Text style={styles.topTitle}>비밀번호 찾기</Text>
          <View style={styles.topSpacer} />
        </View>

        {isComplete ? (
          <View style={styles.completeContent}>
            <View style={styles.completeMark}>
              <Text style={styles.completeMarkText}>✓</Text>
            </View>
            <Text style={styles.completeTitle}>
              재설정 요청이{'\n'}접수되었습니다
            </Text>
            <Text style={styles.completeDescription}>
              관리자가 가입 정보를 확인한 뒤{'\n'}
              등록된 연락처로 임시 비밀번호를 직접 안내합니다.
            </Text>

            <View style={styles.completeGuide}>
              <Text style={styles.completeGuideTitle}>
                임시 비밀번호를 받으셨나요?
              </Text>
              <Text style={styles.completeGuideText}>
                임시 비밀번호로 로그인하면 새 비밀번호 변경 화면으로
                자동 이동합니다.
              </Text>
            </View>

            <AuthButton
              title="로그인으로 돌아가기"
              onPress={() => router.replace('/login')}
              style={styles.completeButton}
            />
          </View>
        ) : (
          <>
            <View style={styles.progressArea}>
              <Text style={styles.progressText}>
                {step} / {TOTAL_STEPS}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(step / TOTAL_STEPS) * 100}%` },
                  ]}
                />
              </View>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === 'ios' ? 'interactive' : 'on-drag'
              }
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
              showsVerticalScrollIndicator={false}
            >
              {step === 1 ? (
                <ResetStep
                  title={'이름을\n입력해 주세요'}
                  description="가입할 때 등록한 이름을 입력해 주세요."
                >
                  <AuthField
                    value={name}
                    onChangeText={setName}
                    placeholder="이름"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={50}
                    returnKeyType="next"
                    onSubmitEditing={handleNext}
                  />
                </ResetStep>
              ) : null}

              {step === 2 ? (
                <ResetStep
                  title={'학번 또는 사번을\n입력해 주세요'}
                  description="가입할 때 등록한 번호를 입력해 주세요."
                >
                  <AuthField
                    value={studentNumber}
                    onChangeText={(value) =>
                      setStudentNumber(value.replace(/\D/g, ''))
                    }
                    placeholder="학번 또는 사번"
                    keyboardType="number-pad"
                    maxLength={20}
                    returnKeyType="next"
                    onSubmitEditing={handleNext}
                  />
                </ResetStep>
              ) : null}

              {step === 3 ? (
                <ResetStep
                  title={'휴대전화번호를\n입력해 주세요'}
                  description="가입할 때 등록한 연락처와 일치해야 합니다."
                >
                  <AuthField
                    value={phoneNumber}
                    onChangeText={(value) =>
                      setPhoneNumber(formatPhoneNumber(value))
                    }
                    placeholder="010-0000-0000"
                    keyboardType="phone-pad"
                    maxLength={13}
                    returnKeyType="next"
                    onSubmitEditing={handleNext}
                  />
                </ResetStep>
              ) : null}

              {step === 4 ? (
                <ResetStep
                  title={'관리자에게 전달할\n내용이 있나요?'}
                  description="재설정이 필요한 사유를 입력해 주세요. 선택사항입니다."
                >
                  <AuthField
                    value={reason}
                    onChangeText={setReason}
                    placeholder="예: 비밀번호를 분실했습니다."
                    multiline
                    maxLength={500}
                  />
                  <Text style={styles.characterCount}>
                    {reason.length}/500
                  </Text>
                </ResetStep>
              ) : null}
            </ScrollView>

            <View style={styles.bottomArea}>
              <AuthButton
                title={
                  step === TOTAL_STEPS
                    ? reason.trim()
                      ? '재설정 요청'
                      : '내용 없이 요청'
                    : '다음'
                }
                loading={isSubmitting}
                onPress={
                  step === TOTAL_STEPS
                    ? () => void handleSubmit()
                    : handleNext
                }
              />
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ResetStepProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

function ResetStep({
  title,
  description,
  children,
}: ResetStepProps) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
      <View style={styles.fieldArea}>{children}</View>
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
    backgroundColor: AUTH_COLORS.background,
  },
  topBar: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backText: {
    width: 34,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 38,
    lineHeight: 40,
  },
  topTitle: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 16,
  },
  topSpacer: {
    width: 34,
  },
  progressArea: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  progressText: {
    color: AUTH_COLORS.subText,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 13,
  },
  progressTrack: {
    height: 3,
    marginTop: 10,
    overflow: 'hidden',
    borderRadius: 2,
    backgroundColor: AUTH_COLORS.input,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: AUTH_COLORS.link,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 58,
    paddingBottom: 32,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 31,
    lineHeight: 41,
  },
  stepDescription: {
    marginTop: 14,
    color: AUTH_COLORS.subText,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 15,
    lineHeight: 23,
  },
  fieldArea: {
    marginTop: 46,
  },
  characterCount: {
    marginTop: 8,
    color: AUTH_COLORS.subText,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 12,
    textAlign: 'right',
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  completeContent: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeMark: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 39,
    backgroundColor: AUTH_COLORS.primary,
  },
  completeMarkText: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 34,
  },
  completeTitle: {
    marginTop: 30,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 30,
    lineHeight: 40,
    textAlign: 'center',
  },
  completeDescription: {
    marginTop: 15,
    color: AUTH_COLORS.subText,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  completeGuide: {
    width: '100%',
    marginTop: 34,
    padding: 18,
    borderWidth: 1,
    borderColor: AUTH_COLORS.inputBorder,
    borderRadius: 14,
    backgroundColor: AUTH_COLORS.input,
  },
  completeGuideTitle: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 15,
  },
  completeGuideText: {
    marginTop: 7,
    color: AUTH_COLORS.subText,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  completeButton: {
    width: '100%',
    marginTop: 24,
  },
});
