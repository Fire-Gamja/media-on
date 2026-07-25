import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthButton from '../components/auth/AuthButton';
import {
  AUTH_COLORS,
  AUTH_FONTS,
} from '../constants/auth-theme';

export default function StartScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.content}>
        <View style={styles.logoFrame}>
          <Image
            source={require('../../assets/images/media-on-logo.png')}
            resizeMode="contain"
            style={styles.logo}
          />
        </View>

        <Text style={styles.appName}>MEDIA ON</Text>
        <Text style={styles.department}>
          서원대학교 미디어콘텐츠학부
        </Text>
      </View>

      <View style={styles.bottomArea}>
        <AuthButton
          title="시작하기"
          onPress={() => router.push('/onboarding')}
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFrame: {
    width: 270,
    height: 154,
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: AUTH_COLORS.primary,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    marginTop: 32,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 36,
    letterSpacing: 1.2,
  },
  department: {
    marginTop: 10,
    color: AUTH_COLORS.subText,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 16,
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
