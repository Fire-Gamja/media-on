import { router } from 'expo-router';
import { useState } from 'react';
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
};

export default function LoginScreen() {
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isLoginEnabled =
    studentNumber.trim().length > 0 &&
    password.trim().length > 0;

  const handleLogin = () => {
    if (!isLoginEnabled) {
      Alert.alert('입력 확인', '학번과 비밀번호를 입력해 주세요.');
      return;
    }

    // 다음 단계에서 Supabase 로그인 기능을 연결합니다.
    Alert.alert(
      '로그인 테스트',
      `학번 ${studentNumber}의 로그인 화면 입력이 확인되었습니다.`,
    );
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  const handleFindPassword = () => {
    router.push('/password-reset');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.brand}>MEDIA ON</Text>

            <Text style={styles.title}>
              미디어콘텐츠학부에{'\n'}오신 것을 환영합니다
            </Text>

            <Text style={styles.description}>
              학번과 비밀번호를 입력해 주세요.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>학번</Text>

              <TextInput
                value={studentNumber}
                onChangeText={setStudentNumber}
                style={styles.input}
                placeholder="학번을 입력해 주세요"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>비밀번호</Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  style={styles.passwordInput}
                  placeholder="비밀번호를 입력해 주세요"
                  placeholderTextColor={COLORS.placeholder}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />

                <Pressable
                  onPress={() =>
                    setIsPasswordVisible((previous) => !previous)
                  }
                  hitSlop={12}
                >
                  <Text style={styles.passwordToggle}>
                    {isPasswordVisible ? '숨기기' : '보기'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                !isLoginEnabled && styles.loginButtonDisabled,
                pressed &&
                  isLoginEnabled &&
                  styles.loginButtonPressed,
              ]}
              onPress={handleLogin}
              disabled={!isLoginEnabled}
            >
              <Text style={styles.loginButtonText}>로그인</Text>
            </Pressable>

            <View style={styles.accountLinks}>
              <Pressable onPress={handleFindPassword}>
                <Text style={styles.linkText}>비밀번호 찾기</Text>
              </Pressable>

              <View style={styles.divider} />

              <Pressable onPress={handleSignUp}>
                <Text style={styles.linkText}>회원가입</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>로그인 안내</Text>

            <Text style={styles.helpText}>
              회원가입 후 관리자 승인이 완료되어야 로그인할 수
              있습니다.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 44,
  },
  brand: {
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 18,
    color: COLORS.text,
    fontSize: 30,
    lineHeight: 42,
    fontWeight: '800',
  },
  description: {
    marginTop: 12,
    color: COLORS.subText,
    fontSize: 15,
    lineHeight: 23,
  },
  form: {
    width: '100%',
  },
  field: {
    marginBottom: 20,
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
  loginButton: {
    height: 56,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.navy,
  },
  loginButtonDisabled: {
    opacity: 0.4,
  },
  loginButtonPressed: {
    opacity: 0.82,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },
  accountLinks: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    color: COLORS.subText,
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 14,
    marginHorizontal: 16,
    backgroundColor: COLORS.border,
  },
  helpBox: {
    marginTop: 42,
    padding: 18,
    borderRadius: 14,
    backgroundColor: '#E9ECF8',
  },
  helpTitle: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '800',
  },
  helpText: {
    marginTop: 7,
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 20,
  },
});