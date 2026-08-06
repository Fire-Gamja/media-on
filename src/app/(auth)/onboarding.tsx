import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AuthButton from "../../components/auth/AuthButton";
import { AUTH_COLORS, AUTH_FONTS } from "../../constants/auth-theme";

const backgroundImage = require("../../../assets/figma/auth/main-1.jpg");
const swipeArrow = require("../../../assets/figma/auth/swipe-arrow.png");
const BACKGROUND_IMAGE_ASPECT_RATIO = 16 / 9;
const BACKGROUND_CROP_POSITION = 0.656;

export default function OnboardingScreen() {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const entranceProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entranceProgress, {
      toValue: 1,
      duration: 900,
      delay: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entranceProgress]);

  const showLoginPage = () => {
    scrollRef.current?.scrollTo({ x: width, animated: true });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View
        pointerEvents="none"
        style={[styles.statusBarScrim, { height: insets.top }]}
      />

      <ScrollView
        ref={scrollRef}
        accessibilityRole="adjustable"
        bounces={false}
        decelerationRate="fast"
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      >
        <View style={[styles.page, { height, width }]}>
          <AuthBackground height={height} width={width} />
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.16)", "rgba(0,0,0,0)"]}
            locations={[0, 0.5, 1]}
            pointerEvents="none"
            style={styles.titleScrim}
          />

          <Animated.Text
            style={[
              styles.welcomeTitle,
              {
                top: height * 0.469,
                opacity: entranceProgress,
                transform: [
                  {
                    translateY: entranceProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [28, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            서원대학교 미디어콘텐츠학부에{`\n`}오신 것을 환영합니다
          </Animated.Text>

          <Pressable
            accessibilityHint="로그인과 회원가입 화면으로 이동합니다."
            accessibilityRole="button"
            onPress={showLoginPage}
            style={({ pressed }) => [
              styles.swipeHint,
              { bottom: Math.max(insets.bottom + 4, 20) },
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.swipeText}>
              시작하려면 옆으로 슬라이드 해주세요
            </Text>
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={swipeArrow}
              style={styles.swipeArrow}
            />
          </Pressable>
        </View>

        <View style={[styles.page, { height, width }]}>
          <AuthBackground height={height} width={width} />
          <View style={[styles.brand, { top: height * 0.574 }]}>
            <Text style={styles.department}>서원대학교</Text>
            <Text style={styles.department}>미디어콘텐츠학부</Text>
            <Text style={styles.departmentEnglish}>
              Division of Media Contents
            </Text>
          </View>

          <View
            style={[
              styles.accountArea,
              { bottom: Math.max(insets.bottom + 4, 24) },
            ]}
          >
            <View style={styles.loginArea}>
              <AuthButton
                title="로그인 하기"
                onPress={() => router.push("/login")}
              />
              <Text style={styles.loginGuide}>
                로그인 안내{`\n`}
                회원가입 후 관리자 승인이 완료되어야 로그인할 수 있습니다.
              </Text>
            </View>

            <View style={styles.divider} />

            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => router.push("/signup")}
              style={({ pressed }) => [
                styles.signupButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.signupText}>회원가입 하기</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

type AuthBackgroundProps = {
  height: number;
  width: number;
};

function AuthBackground({ height, width }: AuthBackgroundProps) {
  const imageWidth = Math.max(width, height * BACKGROUND_IMAGE_ASPECT_RATIO);

  return (
    <>
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="cover"
        source={backgroundImage}
        style={[
          styles.backgroundImage,
          {
            height,
            left: -(imageWidth - width) * BACKGROUND_CROP_POSITION,
            width: imageWidth,
          },
        ]}
      />
      <View style={styles.backgroundOverlay} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: AUTH_COLORS.background,
  },
  page: {
    overflow: "hidden",
    backgroundColor: AUTH_COLORS.background,
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
  },
  backgroundOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(26, 28, 41, 0.50)",
  },
  statusBarScrim: {
    position: "absolute",
    zIndex: 2,
    top: 0,
    right: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.49)",
  },
  titleScrim: {
    position: "absolute",
    top: "30%",
    right: 0,
    left: 0,
    height: "40%",
  },
  welcomeTitle: {
    position: "absolute",
    right: 24,
    left: 24,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: 1,
    textAlign: "center",
  },
  swipeHint: {
    position: "absolute",
    right: 0,
    left: 0,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  swipeText: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 12,
    lineHeight: 14,
  },
  swipeArrow: {
    width: 87,
    height: 6,
  },
  brand: {
    position: "absolute",
    left: 36,
  },
  department: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 25,
    lineHeight: 28,
  },
  departmentEnglish: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 13,
    lineHeight: 15,
  },
  accountArea: {
    position: "absolute",
    right: 0,
    left: 0,
    gap: 20,
  },
  loginArea: {
    marginHorizontal: 24,
    gap: 8,
  },
  loginGuide: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.28)",
  },
  signupButton: {
    minHeight: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  signupText: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 14,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.7,
  },
});
