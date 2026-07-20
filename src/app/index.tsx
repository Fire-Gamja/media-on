import { router } from 'expo-router';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  navy: '#182366',
  white: '#FFFFFF',
  softWhite: '#E8EAF3',
};

export default function StartScreen() {
  const handleStart = () => {
    router.push('/onboarding');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/images/media-on-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.titleArea}>
          <Text style={styles.appName}>MEDIA ON</Text>

          <Text style={styles.description}>
            서원대학교 미디어콘텐츠학부
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.startButton}
        onPress={handleStart}
        activeOpacity={0.8}
      >
        <Text style={styles.startButtonText}>시작하기</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: '100%',
    height: 180,
  },

  titleArea: {
    marginTop: 24,
    alignItems: 'center',
  },

  appName: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 1.8,
  },

  description: {
    marginTop: 10,
    color: COLORS.softWhite,
    fontSize: 16,
    fontWeight: '400',
  },

  startButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  startButtonText: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: '700',
  },
});