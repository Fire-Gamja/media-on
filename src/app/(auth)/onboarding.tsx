import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthButton from '../../components/auth/AuthButton';
import {
  AUTH_COLORS,
  AUTH_FONTS,
} from '../../constants/auth-theme';

type OnboardingItem = {
  id: string;
  image: ImageSourcePropType;
  imageLabel: string;
  imageWidth: number;
  imageHeight: number;
  title: string;
  description: string;
};

const ONBOARDING_DATA: OnboardingItem[] = [
  {
    id: 'notice',
    image: require('../../../assets/figma/auth/onboarding-notice.png'),
    imageLabel: '학부 소식 알림',
    imageWidth: 90,
    imageHeight: 90,
    title: '학부 소식을 한눈에 확인',
    description:
      '학부 공지와 학사일정을 빠르게 확인하고\n중요한 알림을 놓치지 마세요.',
  },
  {
    id: 'inquiry',
    image: require('../../../assets/figma/auth/onboarding-inquiry.png'),
    imageLabel: '문의와 고장 신고',
    imageWidth: 90,
    imageHeight: 90,
    title: '문의와 고장 신고를 더 간편하게',
    description:
      '행정ㆍ실습 문의부터 강의실 고장 신고까지\n앱에서 간편하게 접수할 수 있습니다.',
  },
  {
    id: 'assistant',
    image: require('../../../assets/figma/auth/onboarding-assistant.png'),
    imageLabel: '조교 문의 관리',
    imageWidth: 154,
    imageHeight: 138,
    title: '조교님 문의도 한곳에서 관리',
    description:
      '조교님 문의 요청의 처리 상태를\n한눈에 확인하세요.',
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<OnboardingItem>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isLastPage = currentIndex === ONBOARDING_DATA.length - 1;

  const handleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    setCurrentIndex(
      Math.round(event.nativeEvent.contentOffset.x / width),
    );
  };

  const finishOnboarding = () => router.replace('/login');

  const handleNext = () => {
    if (isLastPage) {
      finishOnboarding();
      return;
    }

    const nextIndex = currentIndex + 1;
    listRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });
    setCurrentIndex(nextIndex);
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={styles.safeArea}
    >
      <StatusBar style="light" />

      {!isLastPage ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={finishOnboarding}
          style={({ pressed }) => [
            styles.skipButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.skipText}>건너뛰기</Text>
        </Pressable>
      ) : null}

      <FlatList
        ref={listRef}
        data={ONBOARDING_DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.page, { width }]}>
            <View style={styles.illustrationArea}>
              <Image
                accessibilityLabel={item.imageLabel}
                resizeMode="contain"
                source={item.image}
                style={{
                  width: item.imageWidth,
                  height: item.imageHeight,
                }}
              />
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>
              {item.description}
            </Text>
          </View>
        )}
        horizontal
        pagingEnabled
        bounces={false}
        onMomentumScrollEnd={handleScrollEnd}
        showsHorizontalScrollIndicator={false}
      />

      <View style={styles.bottomArea}>
        <View style={styles.indicators}>
          {ONBOARDING_DATA.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.indicator,
                index === currentIndex && styles.activeIndicator,
              ]}
            />
          ))}
        </View>

        <AuthButton
          title={isLastPage ? '시작하기' : '다음'}
          onPress={handleNext}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  skipButton: {
    position: 'absolute',
    zIndex: 2,
    top: 44,
    right: 20,
    minHeight: 44,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 14,
    lineHeight: 18,
  },
  page: {
    alignItems: 'center',
    paddingTop: 147,
  },
  illustrationArea: {
    width: '100%',
    height: 138,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    width: 250,
    marginTop: 71,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 24,
    lineHeight: 35,
    textAlign: 'center',
  },
  description: {
    width: 300,
    marginTop: 35,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  bottomArea: {
    position: 'absolute',
    right: 16,
    bottom: 56,
    left: 16,
  },
  indicators: {
    height: 8,
    marginBottom: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
  },
  indicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: AUTH_COLORS.text,
  },
  activeIndicator: {
    width: 20,
    borderRadius: 4,
  },
  pressed: {
    opacity: 0.65,
  },
});
