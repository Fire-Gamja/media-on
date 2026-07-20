import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const COLORS = {
  navy: '#182366',
  white: '#FFFFFF',
  softWhite: '#D9DDEF',
  inactive: '#7079A8',
};

type OnboardingItem = {
  id: string;
  step: string;
  title: string;
  description: string;
};

const ONBOARDING_DATA: OnboardingItem[] = [
  {
    id: '1',
    step: '01',
    title: '학부 소식을\n한눈에 확인',
    description:
      '학부 공지와 학사일정을 빠르게 확인하고\n중요한 알림을 놓치지 마세요.',
  },
  {
    id: '2',
    step: '02',
    title: '문의와 고장 신고를\n더 간편하게',
    description:
      '행정·실습 문의부터 강의실 고장 신고까지\n앱에서 간편하게 접수할 수 있습니다.',
  },
  {
    id: '3',
    step: '03',
    title: '실습 관련 신청도\n한곳에서 관리',
    description:
      '기자재 대여와 실습실 승인 요청의\n처리 상태를 한눈에 확인하세요.',
  },
];

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList<OnboardingItem>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLastPage = currentIndex === ONBOARDING_DATA.length - 1;

  const handleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const newIndex = Math.round(
      event.nativeEvent.contentOffset.x / width,
    );

    setCurrentIndex(newIndex);
  };

  const handleNext = () => {
    if (isLastPage) {
      router.replace('/login');
      return;
    }

    const nextIndex = currentIndex + 1;

    flatListRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });

    setCurrentIndex(nextIndex);
  };

  const handleSkip = () => {
    router.replace('/login');
  };

  const renderItem = ({ item }: { item: OnboardingItem }) => {
    return (
      <View style={styles.page}>
        <View style={styles.visualArea}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepText}>{item.step}</Text>
          </View>
        </View>

        <View style={styles.textArea}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>
            {item.description}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        {!isLastPage ? (
          <TouchableOpacity
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>건너뛰기</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleScrollEnd}
      />

      <View style={styles.bottomArea}>
        <View style={styles.indicatorContainer}>
          {ONBOARDING_DATA.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.indicator,
                index === currentIndex &&
                  styles.activeIndicator,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>
            {isLastPage ? '시작하기' : '다음'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  topBar: {
    minHeight: 56,
    paddingHorizontal: 24,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipText: {
    color: COLORS.softWhite,
    fontSize: 15,
    fontWeight: '600',
  },
  page: {
    width,
    paddingHorizontal: 28,
  },
  visualArea: {
    flex: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: COLORS.white,
    fontSize: 58,
    fontWeight: '800',
  },
  textArea: {
    flex: 0.9,
    alignItems: 'center',
  },
  title: {
    color: COLORS.white,
    fontSize: 30,
    lineHeight: 42,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    marginTop: 20,
    color: COLORS.softWhite,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.inactive,
  },
  activeIndicator: {
    width: 24,
    backgroundColor: COLORS.white,
  },
  nextButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: '700',
  },
});