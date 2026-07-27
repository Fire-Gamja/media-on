import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthButton from '../../components/auth/AuthButton';
import AuthField from '../../components/auth/AuthField';
import AuthFlowScreen from '../../components/auth/AuthFlowScreen';
import {
  AUTH_COLORS,
  AUTH_FONTS,
} from '../../constants/auth-theme';
import { isSupabaseConfigured } from '../../lib/supabase';
import { getAuthErrorMessage } from '../../services/auth';
import { createPasswordResetRequest } from '../../services/password-reset-requests';

const completeIcon = require('../../../assets/figma/auth/complete.png');
const backIcon = require('../../../assets/figma/auth/back.png');

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

  if (isComplete) {
    return <RequestComplete />;
  }

  if (step === 1) {
    return (
      <AuthFlowScreen
        buttonDisabled={!name.trim()}
        buttonTitle="다음"
        onBack={handleBack}
        onButtonPress={handleNext}
        title="이름을 입력해 주세요"
      >
        <AuthField
          value={name}
          onChangeText={setName}
          placeholder="이름을 입력해 주세요"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={50}
          returnKeyType="next"
          onSubmitEditing={handleNext}
        />
      </AuthFlowScreen>
    );
  }

  if (step === 2) {
    return (
      <AuthFlowScreen
        buttonDisabled={!studentNumber.trim()}
        buttonTitle="다음"
        onBack={handleBack}
        onButtonPress={handleNext}
        title="학번 또는 사번을 입력해 주세요"
      >
        <AuthField
          value={studentNumber}
          onChangeText={(value) =>
            setStudentNumber(value.replace(/\D/g, ''))
          }
          placeholder="학번을 입력해 주세요"
          keyboardType="number-pad"
          maxLength={20}
          returnKeyType="next"
          onSubmitEditing={handleNext}
        />
      </AuthFlowScreen>
    );
  }

  if (step === 3) {
    return (
      <AuthFlowScreen
        buttonDisabled={
          phoneNumber.replace(/\D/g, '').length !== 11
        }
        buttonTitle="다음"
        onBack={handleBack}
        onButtonPress={handleNext}
        title="휴대전화번호를 입력해 주세요"
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
      </AuthFlowScreen>
    );
  }

  return (
    <AuthFlowScreen
      buttonLoading={isSubmitting}
      buttonTitle="다음"
      multiline
      onBack={handleBack}
      onButtonPress={() => void handleSubmit()}
      title="요청 사유를 작성해 주세요"
    >
      <View>
        <AuthField
          value={reason}
          onChangeText={setReason}
          placeholder={
            '휴대전화번호 변경 등 재설정이 필요한 사유를 입력해 주세요. 선택사항입니다.'
          }
          multiline
          maxLength={500}
        />
        <Text style={styles.characterCount}>
          {reason.length}/500
        </Text>
      </View>
    </AuthFlowScreen>
  );
}

function RequestComplete() {
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={styles.safeArea}
    >
      <StatusBar style="light" />

      <Pressable
        accessibilityLabel="로그인 화면으로 이동"
        accessibilityRole="button"
        hitSlop={12}
        onPress={() => router.replace('/login')}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.pressed,
        ]}
      >
        <Image source={backIcon} style={styles.backIcon} />
      </Pressable>

      <Image
        accessibilityLabel="재설정 요청 완료"
        source={completeIcon}
        style={styles.completeIcon}
      />
      <Text style={styles.completeTitle}>
        비밀번호 재설정 요청이 완료되었습니다.
      </Text>
      <Text style={styles.completeDescription}>
        관리자 확인 후 임시 비밀번호가 안내됩니다.{'\n'}
        임시 비밀번호로 로그인한 뒤 비밀번호를 변경해 주세요.
      </Text>
      <AuthButton
        title="완료"
        onPress={() => router.replace('/login')}
        style={styles.completeButton}
      />
    </SafeAreaView>
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
  safeArea: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  characterCount: {
    position: 'absolute',
    right: 15,
    bottom: 12,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 14,
    lineHeight: 19,
  },
  backButton: {
    position: 'absolute',
    top: 15,
    left: 16,
    width: 30,
    height: 30,
  },
  backIcon: {
    width: 30,
    height: 30,
  },
  completeIcon: {
    position: 'absolute',
    top: 126,
    left: '50%',
    width: 100,
    height: 100,
    marginLeft: -50,
  },
  completeTitle: {
    position: 'absolute',
    top: 243,
    right: 20,
    left: 20,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 24,
    lineHeight: 28,
  },
  completeDescription: {
    position: 'absolute',
    top: 287,
    right: 20,
    left: 20,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 14,
    lineHeight: 19,
  },
  completeButton: {
    position: 'absolute',
    top: 392,
    right: 20,
    left: 20,
  },
  pressed: {
    opacity: 0.65,
  },
});
