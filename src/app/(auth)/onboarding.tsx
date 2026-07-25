import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  type ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
    image: require('../../../assets/images/onboarding/onboarding-notice.png'),
    imageLabel: '새로운 학부 소식을 알리는 종',
    imageWidth: 180,
    imageHeight: 180,
    title: '학부 소식을\n한눈에 확인해요',
    description:
      '학부 공지와 학사일정을 빠르게 확인하고\n중요한 알림을 놓치지 마세요.',
  },
  {
    id: 'inquiry',
    image: require('../../../assets/images/onboarding/onboarding-inquiry.png'),
    imageLabel: '문의에 답하는 상담원',
    imageWidth: 308,
    imageHeight: 276,
    title: '문의와 고장 신고를\n더 간편하게',
    description:
      '행정·실습 문의부터 강의실 고장 신고까지\n앱에서 간편하게 접수할 수 있어요.',
  },
  {
    id: 'equipment',
    image: require('../../../assets/images/onboarding/onboarding-equipment.png'),
    imageLabel: '신청서를 작성하는 문서와 연필',
    imageWidth: 180,
    imageHeight: 180,
    title: '실습 관련 신청도\n한곳에서 관리해요',
    description:
      '기자재 대여와 실습실 이용 신청의\n처리 상태를 한눈에 확인하세요.',
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

  const handleNext = () => {
    if (isLastPage) {
      router.replace('/login');
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Text style={styles.brand}>MEDIA ON</Text>

        {!isLastPage ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.skipText}>건너뛰기</Text>
          </Pressable>
        ) : (
          <View style={styles.topSpacer} />
        )}
      </View>

      <FlatList
        ref={listRef}
        data={ONBOARDING_DATA}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.page, { width }]}>
            <View style={styles.visualArea}>
              <Image
                accessibilityLabel={item.imageLabel}
                resizeMode="contain"
                source={item.image}
                style={[
                  styles.illustration,
                  {
                    aspectRatio: item.imageWidth / item.imageHeight,
                    width: item.imageWidth,
                  },
                ]}
              />
            </View>

            <View style={styles.textArea}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>
                {item.description}
              </Text>
            </View>
          </View>
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleScrollEnd}
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
  topBar: {
    height: 54,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 14,
    letterSpacing: 1,
  },
  skipText: {
    color: AUTH_COLORS.subText,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 14,
  },
  topSpacer: {
    width: 56,
  },
  page: {
    paddingHorizontal: 24,
  },
  visualArea: {
    flex: 1.15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    maxWidth: '100%',
  },
  textArea: {
    flex: 0.85,
    alignItems: 'center',
  },
  title: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 29,
    lineHeight: 39,
    textAlign: 'center',
  },
  description: {
    marginTop: 16,
    color: AUTH_COLORS.subText,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  indicators: {
    marginBottom: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
  },
  indicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: AUTH_COLORS.inputBorder,
  },
  activeIndicator: {
    width: 23,
    backgroundColor: AUTH_COLORS.text,
  },
});
