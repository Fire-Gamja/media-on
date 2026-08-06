import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PlatformHeaderIcon } from "../../components/common/PlatformHeaderIcon";
import AuthButton from "../../components/auth/AuthButton";
import AuthField from "../../components/auth/AuthField";
import { AUTH_COLORS, AUTH_FONTS } from "../../constants/auth-theme";
import {
  getAutoLoginEnabled,
  isSupabaseConfigured,
  setAutoLoginEnabled,
} from "../../lib/supabase";
import { getAuthErrorMessage, signInStudent } from "../../services/auth";

const eyeIcon = require("../../../assets/figma/auth/eye.png");

type LoginStep = "identifier" | "password";

export default function LoginScreen() {
  const [step, setStep] = useState<LoginStep>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  useEffect(() => {
    void getAutoLoginEnabled().then(setAutoLogin);
  }, []);

  const handleBack = () => {
    if (step === "password") {
      setPassword("");
      setStep("identifier");
      return;
    }

    router.back();
  };

  const handleIdentifierNext = () => {
    if (!identifier.trim()) {
      Alert.alert("입력 확인", "학번을 입력해 주세요.");
      return;
    }

    setStep("password");
  };

  const handleLogin = async () => {
    if (!password) {
      Alert.alert("입력 확인", "비밀번호를 입력해 주세요.");
      return;
    }

    if (isSupabaseConfigured) {
      try {
        setIsSubmitting(true);
        await setAutoLoginEnabled(autoLogin);
        const result = await signInStudent(identifier, password);

        if (result.status === "pending") {
          Alert.alert(
            "승인 대기 중",
            "관리자가 가입 정보를 확인하고 있습니다. 승인 완료 후 로그인해 주세요.",
          );
          return;
        }

        if (result.status === "rejected") {
          Alert.alert(
            "가입 승인 확인",
            "가입 신청이 승인되지 않았습니다. 학부 사무실에 문의해 주세요.",
          );
          return;
        }

        if (result.requiresPasswordChange) {
          router.replace({
            pathname: "/profile",
            params: { mustChangePassword: "1" },
          });
          return;
        }

        router.replace(
          result.profile.role === "admin" ? "/admin-home" : "/home",
        );
      } catch (error) {
        Alert.alert("로그인 실패", getAuthErrorMessage(error));
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    if (Platform.OS === "web") {
      Alert.alert(
        "로그인 테스트",
        `학번 ${identifier}의 입력이 확인되었습니다.`,
      );
      router.replace("/home");
      return;
    }

    Alert.alert(
      "로그인 테스트",
      `학번 ${identifier}의 입력이 확인되었습니다.`,
      [
        {
          text: "학생 홈으로 이동",
          onPress: () => router.replace("/home"),
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          contentContainerStyle={styles.formScrollContent}
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
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
            <PlatformHeaderIcon color="#FFFFFF" name="back" />
          </Pressable>

          <View style={styles.formContent}>
            <Text style={styles.formTitle}>
              {step === "identifier"
                ? "학번을 입력해 주세요"
                : "비밀번호를 입력해 주세요"}
            </Text>

            <View style={styles.fieldArea}>
              {step === "identifier" ? (
                <AuthField
                  value={identifier}
                  onChangeText={(value) =>
                    setIdentifier(value.replace(/\D/g, ""))
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
                    isPasswordVisible ? "비밀번호 숨기기" : "비밀번호 보기"
                  }
                  rightActionIcon={eyeIcon}
                  onRightActionPress={() =>
                    setIsPasswordVisible((previous) => !previous)
                  }
                  onSubmitEditing={() => void handleLogin()}
                />
              )}
            </View>

            {step === "password" ? (
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
                  {autoLogin ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={styles.autoLoginText}>자동 로그인</Text>
              </Pressable>
            ) : null}

            <AuthButton
              title={step === "identifier" ? "다음" : "로그인"}
              disabled={step === "identifier" ? !identifier.trim() : !password}
              loading={isSubmitting}
              onPress={
                step === "identifier"
                  ? handleIdentifierNext
                  : () => void handleLogin()
              }
              style={
                step === "password" ? styles.passwordButton : styles.formButton
              }
            />

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/password-reset-request")}
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
  formScrollContent: {
    flexGrow: 1,
  },
  backButton: {
    position: "absolute",
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
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 9,
  },
  checkbox: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#858585",
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
    justifyContent: "center",
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
