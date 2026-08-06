import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { AUTH_COLORS } from "../constants/auth-theme";
import { supabase } from "../lib/supabase";

const loadingImage = require("../../assets/figma/auth/main-2.jpg");

const MINIMUM_LOADING_TIME = 2500;
const IMAGE_ASPECT_RATIO = 16 / 9;
const PAN_DISTANCE = 56;
const LOADING_CROP_POSITION = 0.688;

type OpeningDestination = "/admin-home" | "/home" | "/onboarding";

export default function OpeningLoadingScreen() {
  const { height, width } = useWindowDimensions();
  const panProgress = useRef(new Animated.Value(0)).current;
  const imageWidth = Math.max(width, height * IMAGE_ASPECT_RATIO);

  useEffect(() => {
    let isActive = true;

    const panAnimation = Animated.timing(panProgress, {
      toValue: 1,
      duration: 2800,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });

    panAnimation.start();

    void Promise.all([
      resolveOpeningDestination(),
      wait(MINIMUM_LOADING_TIME),
    ]).then(([destination]) => {
      if (isActive) {
        router.replace(destination);
      }
    });

    return () => {
      isActive = false;
      panAnimation.stop();
    };
  }, [panProgress]);

  const translateX = panProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [PAN_DISTANCE, -PAN_DISTANCE],
  });

  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      <Animated.Image
        accessibilityIgnoresInvertColors
        resizeMode="cover"
        source={loadingImage}
        style={[
          styles.image,
          {
            height,
            left: -(imageWidth - width) * LOADING_CROP_POSITION,
            width: imageWidth,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

async function resolveOpeningDestination(): Promise<OpeningDestination> {
  if (!supabase) {
    return "/onboarding";
  }

  try {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;

    if (!user) {
      return "/onboarding";
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, approval_status")
      .eq("id", user.id)
      .single();

    if (profile?.approval_status === "approved") {
      return profile.role === "admin" ? "/admin-home" : "/home";
    }

    await supabase.auth.signOut();
  } catch (error) {
    console.warn("앱 시작 중 로그인 상태를 확인하지 못했습니다.", error);
  }

  return "/onboarding";
}

function wait(duration: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, duration);
  });
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: AUTH_COLORS.background,
  },
  image: {
    position: "absolute",
    top: 0,
  },
});
