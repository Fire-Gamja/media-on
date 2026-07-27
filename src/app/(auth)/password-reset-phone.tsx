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

const eyeIcon = require('../../../assets/figma/auth/eye.png');
const completeIcon = require('../../../assets/figma/auth/complete.png');
const backIcon = require('../../../assets/figma/auth/back.png');

type PhoneResetStep =
  | 'identifier'
  | 'verification'
  | 'confirmation'
  | 'password'
  | 'passwordAgain'
  | 'complete';

const STEP_ORDER: PhoneResetStep[] = [
  'identifier',
  'verification',
  'confirmation',
  'password',
  'passwordAgain',
  'complete',
];

export default function PasswordResetPhoneScreen() {
  const [step, setStep] = useState<PhoneResetStep>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const moveTo = (nextStep: PhoneResetStep) => setStep(nextStep);

  const handleBack = () => {
    const currentIndex = STEP_ORDER.indexOf(step);

    if (currentIndex <= 0) {
      router.back();
      return;
    }

    moveTo(STEP_ORDER[currentIndex - 1]);
  };

  if (step === 'complete') {
    return <PasswordResetComplete />;
  }

  if (step === 'identifier') {
    return (
      <AuthFlowScreen
        buttonDisabled={!identifier.trim()}
        buttonTitle="인증번호 받기"
        onBack={handleBack}
        onButtonPress={() => moveTo('verification')}
        title="학번 또는 사번을 입력해 주세요"
      >
        <AuthField
          value={identifier}
          onChangeText={(value) =>
            setIdentifier(value.replace(/\D/g, ''))
          }
          placeholder="학번 또는 사번"
          keyboardType="number-pad"
          maxLength={20}
          returnKeyType="next"
          onSubmitEditing={() => moveTo('verification')}
        />
      </AuthFlowScreen>
    );
  }

  if (step === 'verification') {
    return (
      <AuthFlowScreen
        buttonDisabled={verificationCode.length !== 5}
        buttonTitle="다음"
        onBack={handleBack}
        onButtonPress={() => moveTo('confirmation')}
        title="인증번호를 입력해 주세요"
      >
        <AuthField
          value={verificationCode}
          onChangeText={(value) =>
            setVerificationCode(value.replace(/\D/g, '').slice(0, 5))
          }
          placeholder="5자리 인증번호"
          keyboardType="number-pad"
          maxLength={5}
          returnKeyType="next"
          onSubmitEditing={() => {
            if (verificationCode.length === 5) {
              moveTo('confirmation');
            }
          }}
        />
      </AuthFlowScreen>
    );
  }

  if (step === 'confirmation') {
    return (
      <AuthFlowScreen
        buttonTitle="비밀번호 초기화"
        onBack={handleBack}
        onButtonPress={() => moveTo('password')}
        title="비밀번호를 초기화하시겠습니까?"
      >
        <View style={styles.confirmationBox}>
          <Text style={styles.confirmationText}>
            본인 인증이 완료되었습니다.{'\n'}
            계속하면 새로운 비밀번호를 설정합니다.
          </Text>
        </View>
      </AuthFlowScreen>
    );
  }

  if (step === 'password') {
    return (
      <AuthFlowScreen
        buttonDisabled={password.length < 8}
        buttonTitle="다음"
        onBack={handleBack}
        onButtonPress={() => {
          if (password.length < 8) {
            Alert.alert(
              '입력 확인',
              '비밀번호를 8자 이상 입력해 주세요.',
            );
            return;
          }

          moveTo('passwordAgain');
        }}
        title="새로운 비밀번호를 입력해 주세요."
      >
        <AuthField
          value={password}
          onChangeText={setPassword}
          placeholder="새로운 비밀번호"
          secureTextEntry={!isPasswordVisible}
          autoCapitalize="none"
          autoCorrect={false}
          rightActionLabel={
            isPasswordVisible
              ? '비밀번호 숨기기'
              : '비밀번호 보기'
          }
          rightActionIcon={eyeIcon}
          onRightActionPress={() =>
            setIsPasswordVisible((previous) => !previous)
          }
        />
      </AuthFlowScreen>
    );
  }

  return (
    <AuthFlowScreen
      buttonDisabled={!passwordAgain}
      buttonTitle="완료"
      onBack={handleBack}
      onButtonPress={() => {
        if (password !== passwordAgain) {
          Alert.alert(
            '입력 확인',
            '새로운 비밀번호가 서로 일치하지 않습니다.',
          );
          return;
        }

        moveTo('complete');
      }}
      title="비밀번호를 한 번 더 입력해 주세요."
    >
      <AuthField
        value={passwordAgain}
        onChangeText={setPasswordAgain}
        placeholder="새로운 비밀번호 확인"
        secureTextEntry={!isPasswordVisible}
        autoCapitalize="none"
        autoCorrect={false}
        rightActionLabel={
          isPasswordVisible
            ? '비밀번호 숨기기'
            : '비밀번호 보기'
        }
        rightActionIcon={eyeIcon}
        onRightActionPress={() =>
          setIsPasswordVisible((previous) => !previous)
        }
      />
    </AuthFlowScreen>
  );
}

function PasswordResetComplete() {
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
        accessibilityLabel="비밀번호 변경 완료"
        source={completeIcon}
        style={styles.completeIcon}
      />
      <Text style={styles.completeTitle}>
        비밀번호 변경이 완료 되었습니다.
      </Text>
      <Text style={styles.completeDescription}>
        로그인 화면으로 돌아가 로그인 해주시기 바랍니다.
      </Text>
      <AuthButton
        title="완료"
        onPress={() => router.replace('/login')}
        style={styles.completeButton}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  confirmationBox: {
    minHeight: 60,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AUTH_COLORS.inputBorder,
    borderRadius: 4,
    backgroundColor: AUTH_COLORS.input,
  },
  confirmationText: {
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
    top: 362,
    right: 20,
    left: 20,
  },
  pressed: {
    opacity: 0.65,
  },
});
