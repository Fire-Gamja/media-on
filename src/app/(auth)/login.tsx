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
import {
  getAuthErrorMessage,
  signInStudent,
} from '../../services/auth';

type LoginStep = 'welcome' | 'identifier' | 'password';

export default function LoginScreen() {
  const [step, setStep] = useState<LoginStep>('welcome');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      Alert.alert('입력 확인', '학번 또는 사번을 입력해 주세요.');
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
        `학번/사번 ${identifier}의 입력이 확인되었습니다.`,
      );
      router.replace('/home');
      return;
    }

    Alert.alert(
      '로그인 테스트',
      `학번/사번 ${identifier}의 입력이 확인되었습니다.`,
      [
        {
          text: '학생 홈으로 이동',
          onPress: () => router.replace('/home'),
        },
      ],
    );
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
            accessibilityLabel="이전 화면으로 이동"
            hitSlop={12}
            onPress={handleBack}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <Text style={styles.topBrand}>MEDIA ON</Text>
          <View style={styles.topSpacer} />
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
          {step === 'welcome' ? (
            <View style={styles.welcomeContent}>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>M</Text>
              </View>

              <Text style={styles.welcomeTitle}>
                미디어콘텐츠학부에{'\n'}오신 것을 환영합니다
              </Text>
              <Text style={styles.description}>
                MEDIA ON에서 학부 소식과 신청 내역을{'\n'}
                편리하게 확인해 보세요.
              </Text>

              <AuthButton
                title="로그인"
                onPress={() => setStep('identifier')}
                style={styles.mainButton}
              />

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/signup')}
                style={({ pressed }) => [
                  styles.textLinkButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.textLink}>
                  처음 이용하시나요?{' '}
                  <Text style={styles.textLinkAccent}>회원가입</Text>
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.formContent}>
              <View style={styles.stepIndicator}>
                <View style={styles.activeStepDot} />
                <View
                  style={[
                    styles.stepDot,
                    step === 'password' && styles.activeStepDot,
                  ]}
                />
              </View>

              {step === 'identifier' ? (
                <>
                  <Text style={styles.formTitle}>
                    학번 또는 사번을{'\n'}입력해 주세요
                  </Text>
                  <Text style={styles.description}>
                    가입할 때 등록한 번호를 입력해 주세요.
                  </Text>

                  <View style={styles.fieldArea}>
                    <AuthField
                      value={identifier}
                      onChangeText={(value) =>
                        setIdentifier(value.replace(/\D/g, ''))
                      }
                      placeholder="학번 또는 사번"
                      keyboardType="number-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={20}
                      returnKeyType="next"
                      onSubmitEditing={handleIdentifierNext}
                    />
                  </View>

                  <AuthButton
                    title="다음"
                    disabled={!identifier.trim()}
                    onPress={handleIdentifierNext}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.formTitle}>
                    비밀번호를{'\n'}입력해 주세요
                  </Text>
                  <Text style={styles.description}>
                    {identifier} 계정으로 로그인합니다.
                  </Text>

                  <View style={styles.fieldArea}>
                    <AuthField
                      value={password}
                      onChangeText={setPassword}
                      placeholder="비밀번호"
                      secureTextEntry={!isPasswordVisible}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      rightActionLabel={
                        isPasswordVisible ? '숨기기' : '보기'
                      }
                      onRightActionPress={() =>
                        setIsPasswordVisible((previous) => !previous)
                      }
                      onSubmitEditing={() => void handleLogin()}
                    />
                  </View>

                  <AuthButton
                    title="로그인"
                    disabled={!password}
                    loading={isSubmitting}
                    onPress={() => void handleLogin()}
                  />

                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      router.push('/password-reset-request')
                    }
                    style={({ pressed }) => [
                      styles.findPasswordButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.findPasswordText}>
                      비밀번호를 잊으셨나요?
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  topBrand: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 14,
    letterSpacing: 1,
  },
  topSpacer: {
    width: 34,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  welcomeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMark: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: AUTH_COLORS.primary,
  },
  brandMarkText: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 44,
  },
  welcomeTitle: {
    marginTop: 34,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 30,
    lineHeight: 40,
    textAlign: 'center',
  },
  formContent: {
    flex: 1,
    paddingTop: 54,
  },
  stepIndicator: {
    marginBottom: 42,
    flexDirection: 'row',
    gap: 7,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AUTH_COLORS.inputBorder,
  },
  activeStepDot: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: AUTH_COLORS.text,
  },
  formTitle: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 31,
    lineHeight: 41,
  },
  description: {
    marginTop: 14,
    color: AUTH_COLORS.subText,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  fieldArea: {
    marginTop: 44,
    marginBottom: 20,
  },
  mainButton: {
    width: '100%',
    marginTop: 48,
  },
  textLinkButton: {
    marginTop: 20,
    padding: 8,
  },
  textLink: {
    color: AUTH_COLORS.subText,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 14,
  },
  textLinkAccent: {
    color: AUTH_COLORS.link,
    fontFamily: AUTH_FONTS.semiBold,
  },
  findPasswordButton: {
    alignSelf: 'center',
    marginTop: 22,
    padding: 8,
  },
  findPasswordText: {
    color: AUTH_COLORS.link,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.65,
  },
});
