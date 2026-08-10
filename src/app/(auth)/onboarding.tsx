import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
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
  const { initialPage } = useLocalSearchParams<{ initialPage?: string }>();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const entranceProgress = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(
    new Animated.Value(initialPage === "login" ? width : 0),
  ).current;
  const swipeHintProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entranceProgress, {
      toValue: 1,
      duration: 900,
      delay: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entranceProgress]);

  useEffect(() => {
    if (initialPage === "login") {
      scrollX.setValue(width);
      scrollRef.current?.scrollTo({ x: width, animated: false });
    }
  }, [initialPage, scrollX, width]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(swipeHintProgress, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(swipeHintProgress, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [swipeHintProgress]);

  const showLoginPage = () => {
    scrollRef.current?.scrollTo({ x: width, animated: true });
  };

  const onboardingContentStyle = {
    opacity: scrollX.interpolate({
      inputRange: [0, width * 0.72, width],
      outputRange: [1, 0.38, 0],
      extrapolate: "clamp" as const,
    }),
    transform: [
      {
        translateX: scrollX.interpolate({
          inputRange: [0, width],
          outputRange: [0, -width * 0.1],
          extrapolate: "clamp" as const,
        }),
      },
      {
        scale: scrollX.interpolate({
          inputRange: [0, width],
          outputRange: [1, 0.96],
          extrapolate: "clamp" as const,
        }),
      },
    ],
  };

  const loginContentStyle = {
    opacity: scrollX.interpolate({
      inputRange: [0, width * 0.38, width],
      outputRange: [0, 0.18, 1],
      extrapolate: "clamp" as const,
    }),
    transform: [
      {
        translateX: scrollX.interpolate({
          inputRange: [0, width],
          outputRange: [width * 0.12, 0],
          extrapolate: "clamp" as const,
        }),
      },
      {
        translateY: scrollX.interpolate({
          inputRange: [0, width],
          outputRange: [18, 0],
          extrapolate: "clamp" as const,
        }),
      },
      {
        scale: scrollX.interpolate({
          inputRange: [0, width],
          outputRange: [0.97, 1],
          extrapolate: "clamp" as const,
        }),
      },
    ],
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <SlidingAuthBackground height={height} scrollX={scrollX} width={width} />
      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.16)", "rgba(0,0,0,0)"]}
        locations={[0, 0.5, 1]}
        pointerEvents="none"
        style={styles.titleScrim}
      />
      <View
        pointerEvents="none"
        style={[styles.statusBarScrim, { height: insets.top }]}
      />

      <Animated.ScrollView
        ref={scrollRef}
        accessibilityRole="adjustable"
        bounces={false}
        contentOffset={
          initialPage === "login" ? { x: width, y: 0 } : { x: 0, y: 0 }
        }
        decelerationRate="fast"
        horizontal
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        pagingEnabled
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={styles.pager}
      >
        <View style={[styles.page, { height, width }]}>
          <Animated.Text
            style={[
              styles.welcomeTitle,
              onboardingContentStyle,
              {
                top: height * 0.469,
                transform: [
                  ...onboardingContentStyle.transform,
                  {
                    translateY: entranceProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [28, 0],
                    }),
                  },
                ],
                opacity: Animated.multiply(
                  entranceProgress,
                  onboardingContentStyle.opacity,
                ),
              },
            ]}
          >
            서원대학교 미디어콘텐츠학부에{`\n`}오신 것을 환영합니다
          </Animated.Text>

          <Animated.View
            style={[
              styles.swipeHintContainer,
              { bottom: Math.max(insets.bottom + 4, 20) },
              onboardingContentStyle,
            ]}
          >
            <Pressable
              accessibilityHint="로그인과 회원가입 화면으로 이동합니다."
              accessibilityRole="button"
              onPress={showLoginPage}
              style={({ pressed }) => [
                styles.swipeHint,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.swipeText}>
                시작하려면 옆으로 슬라이드 해주세요
              </Text>
              <Animated.Image
                accessibilityIgnoresInvertColors
                resizeMode="contain"
                source={swipeArrow}
                style={[
                  styles.swipeArrow,
                  {
                    opacity: swipeHintProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.55, 1],
                    }),
                    transform: [
                      { scaleX: -1 },
                      {
                        translateX: swipeHintProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [3, 11],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </Pressable>
          </Animated.View>
        </View>

        <View style={[styles.page, { height, width }]}>
          <Animated.View
            style={[styles.loginContent, loginContentStyle]}
          >
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
          </Animated.View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

type AuthBackgroundProps = {
  height: number;
  scrollX: Animated.Value;
  width: number;
};

function SlidingAuthBackground({
  height,
  scrollX,
  width,
}: AuthBackgroundProps) {
  const trackWidth = width * 2;
  const imageWidth = Math.max(trackWidth, height * BACKGROUND_IMAGE_ASPECT_RATIO);
  const imageLeft = -(imageWidth - trackWidth) * BACKGROUND_CROP_POSITION;

  return (
    <View
      pointerEvents="none"
      style={[styles.slidingBackground, { height, width }]}
    >
      <Animated.Image
        accessibilityIgnoresInvertColors
        resizeMode="cover"
        source={backgroundImage}
        style={[
          styles.backgroundImage,
          {
            height,
            width: imageWidth,
            transform: [
              {
                translateX: scrollX.interpolate({
                  inputRange: [0, width],
                  outputRange: [imageLeft, imageLeft - width * 0.72],
                  extrapolate: "clamp",
                }),
              },
            ],
          },
        ]}
      />
      <View style={styles.backgroundOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: AUTH_COLORS.background,
  },
  pager: {
    flex: 1,
  },
  page: {
    overflow: "hidden",
  },
  slidingBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
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
    flex: 1,
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  swipeHintContainer: {
    position: "absolute",
    right: 0,
    left: 0,
    minHeight: 64,
  },
  swipeText: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 15,
    lineHeight: 18,
    textShadowColor: "rgba(0, 0, 0, 0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  swipeArrow: {
    width: 116,
    height: 9,
  },
  loginContent: {
    flex: 1,
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
