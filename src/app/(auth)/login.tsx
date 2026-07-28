import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
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
import {
  getAutoLoginEnabled,
  isSupabaseConfigured,
  setAutoLoginEnabled,
} from '../../lib/supabase';
import {
  getAuthErrorMessage,
  signInStudent,
} from '../../services/auth';

const loginHero = require('../../../assets/figma/auth/login-hero.png');
const logoMark = require('../../../assets/figma/auth/logo-mark.png');
const backIcon = require('../../../assets/figma/auth/back.png');
const eyeIcon = require('../../../assets/figma/auth/eye.png');

type LoginStep = 'welcome' | 'identifier' | 'password';

export default function LoginScreen() {
  const [step, setStep] = useState<LoginStep>('welcome');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  useEffect(() => {
    void getAutoLoginEnabled().then(setAutoLogin);
  }, []);

  const handleBack = () => {
    if (step === 'password') {
      setPassword('');
      setStep('identifier');
      return;
    }

    if (step === 'identifier') {
      setStep('welcome');
      return;
    }

    router.back();
  };

  const handleIdentifierNext = () => {
    if (!identifier.trim()) {
      Alert.alert('입력 확인', '학번을 입력해 주세요.');
      return;
    }

    setStep('password');
  };

  const handleLogin = async () => {
    if (!password) {
      Alert.alert('입력 확인', '비밀번호를 입력해 주세요.');
      return;
    }

    if (isSupabaseConfigured) {
      try {
        setIsSubmitting(true);
        await setAutoLoginEnabled(autoLogin);
        const result = await signInStudent(identifier, password);

        if (result.status === 'pending') {
          Alert.alert(
            '승인 대기 중',
            '관리자가 가입 정보를 확인하고 있습니다. 승인 완료 후 로그인해 주세요.',
          );
          return;
        }

        if (result.status === 'rejected') {
          Alert.alert(
            '가입 승인 확인',
            '가입 신청이 승인되지 않았습니다. 학부 사무실에 문의해 주세요.',
          );
          return;
        }

        if (result.requiresPasswordChange) {
          router.replace({
            pathname: '/profile',
            params: { mustChangePassword: '1' },
          });
          return;
        }

        router.replace(
          result.profile.role === 'admin' ? '/admin-home' : '/home',
        );
      } catch (error) {
        Alert.alert('로그인 실패', getAuthErrorMessage(error));
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    if (Platform.OS === 'web') {
      Alert.alert(
        '로그인 테스트',
        `학번 ${identifier}의 입력이 확인되었습니다.`,
      );
      router.replace('/home');
      return;
    }

    Alert.alert(
      '로그인 테스트',
      `학번 ${identifier}의 입력이 확인되었습니다.`,
      [
        {
          text: '학생 홈으로 이동',
          onPress: () => router.replace('/home'),
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

      {step === 'welcome' ? (
        <WelcomeStep onLogin={() => setStep('identifier')} />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            contentContainerStyle={styles.formScrollContent}
            keyboardDismissMode={
              Platform.OS === 'ios' ? 'interactive' : 'on-drag'
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              accessibilityLabel="이전 화면으로 이동"
              accessibilityRole="button"
              hitSlop={12}
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <Image source={backIcon} style={styles.backIcon} />
            </Pressable>

            <View style={styles.formContent}>
              <Text style={styles.formTitle}>
                {step === 'identifier'
                  ? '학번을 입력해 주세요'
                  : '비밀번호를 입력해 주세요'}
              </Text>

              <View style={styles.fieldArea}>
                {step === 'identifier' ? (
                  <AuthField
                    value={identifier}
                    onChangeText={(value) =>
                      setIdentifier(value.replace(/\D/g, ''))
                    }
                    placeholder="학번"
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={20}
                    returnKeyType="next"
                    onSubmitEditing={handleIdentifierNext}
                  />
                ) : (
                  <AuthField
                    value={password}
                    onChangeText={setPassword}
                    placeholder="비밀번호"
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    rightActionLabel={
                      isPasswordVisible
                        ? '비밀번호 숨기기'
                        : '비밀번호 보기'
                    }
                    rightActionIcon={eyeIcon}
                    onRightActionPress={() =>
                      setIsPasswordVisible((previous) => !previous)
                    }
                    onSubmitEditing={() => void handleLogin()}
                  />
                )}
              </View>

              {step === 'password' ? (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: autoLogin }}
                  hitSlop={8}
                  onPress={() => setAutoLogin((current) => !current)}
                  style={({ pressed }) => [
                    styles.autoLoginRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      autoLogin && styles.checkboxSelected,
                    ]}
                  >
                    {autoLogin ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : null}
                  </View>
                  <Text style={styles.autoLoginText}>자동 로그인</Text>
                </Pressable>
              ) : null}

              <AuthButton
                title={step === 'identifier' ? '다음' : '로그인'}
                disabled={
                  step === 'identifier' ? !identifier.trim() : !password
                }
                loading={isSubmitting}
                onPress={
                  step === 'identifier'
                    ? handleIdentifierNext
                    : () => void handleLogin()
                }
                style={
                  step === 'password'
                    ? styles.passwordButton
                    : styles.formButton
                }
              />

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/password-reset')}
                style={({ pressed }) => [
                  styles.findPasswordButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.findPasswordText}>
                  비밀번호를 잊으셨나요?
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

type WelcomeStepProps = {
  onLogin: () => void;
};

function WelcomeStep({ onLogin }: WelcomeStepProps) {
  return (
    <View style={styles.welcome}>
      <Image
        accessibilityLabel="미디어콘텐츠학부 소개"
        resizeMode="cover"
        source={loginHero}
        style={styles.hero}
      />
      <LinearGradient
        colors={['rgba(26,28,41,0)', AUTH_COLORS.background]}
        locations={[0, 0.88]}
        pointerEvents="none"
        style={styles.heroGradient}
      />

      <View style={styles.logoArea}>
        <View style={styles.logoTextArea}>
          <Text style={styles.logoDepartment}>서원대학교</Text>
          <Text style={styles.logoDepartment}>미디어콘텐츠학부</Text>
          <Text style={styles.logoEnglish}>
            Division of Media Contents
          </Text>
        </View>
        <Image source={logoMark} style={styles.logoMark} />
      </View>

      <Text style={styles.welcomeTitle}>
        서원대학교 미디어콘텐츠학부에{'\n'}오신 것을 환영합니다
      </Text>

      <View style={styles.accountArea}>
        <View style={styles.signupArea}>
          <AuthButton
            title="회원가입하기"
            onPress={() => router.push('/signup')}
          />
          <Text style={styles.signupGuide}>
            로그인 안내{'\n'}
            회원가입 후 관리자 승인이 완료되어야 로그인할 수 있습니다.
          </Text>
        </View>

        <View style={styles.divider} />

        <Pressable
          accessibilityRole="button"
          onPress={onLogin}
          style={({ pressed }) => [
            styles.loginLinkButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.loginLinkText}>로그인 하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  welcome: {
    flex: 1,
  },
  hero: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    width: '100%',
    height: 269,
  },
  heroGradient: {
    position: 'absolute',
    top: 103,
    right: 0,
    left: 0,
    height: 166,
  },
  logoArea: {
    position: 'absolute',
    top: 267,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  logoTextArea: {
    alignItems: 'flex-end',
  },
  logoDepartment: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 16,
    lineHeight: 20,
  },
  logoEnglish: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 10,
    lineHeight: 10,
    letterSpacing: 0.6,
  },
  logoMark: {
    width: 43,
    height: 43,
  },
  welcomeTitle: {
    position: 'absolute',
    top: 393,
    right: 20,
    left: 20,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: 1,
    textAlign: 'center',
  },
  accountArea: {
    position: 'absolute',
    right: 0,
    bottom: 24,
    left: 0,
    gap: 20,
  },
  signupArea: {
    marginHorizontal: 24,
    gap: 8,
  },
  signupGuide: {
    color: '#858585',
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#444650',
  },
  loginLinkButton: {
    minHeight: 44,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLinkText: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 14,
    lineHeight: 17,
  },
  formScrollContent: {
    flexGrow: 1,
  },
  backButton: {
    position: 'absolute',
    zIndex: 2,
    top: 15,
    left: 16,
    width: 30,
    height: 30,
  },
  backIcon: {
    width: 30,
    height: 30,
  },
  formContent: {
    paddingTop: 126,
    paddingHorizontal: 20,
  },
  formTitle: {
    width: 334,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 24,
    lineHeight: 28,
  },
  fieldArea: {
    marginTop: 16,
  },
  formButton: {
    marginTop: 60,
  },
  passwordButton: {
    marginTop: 24,
  },
  autoLoginRow: {
    minHeight: 44,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 9,
  },
  checkbox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#858585',
    borderRadius: 5,
  },
  checkboxSelected: {
    borderColor: AUTH_COLORS.text,
    backgroundColor: AUTH_COLORS.text,
  },
  checkmark: {
    color: AUTH_COLORS.background,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 13,
  },
  autoLoginText: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 14,
  },
  findPasswordButton: {
    minHeight: 24,
    marginTop: 16,
    justifyContent: 'center',
  },
  findPasswordText: {
    color: AUTH_COLORS.link,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 14,
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.65,
  },
});
