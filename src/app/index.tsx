import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthButton from '../components/auth/AuthButton';
import {
  AUTH_COLORS,
  AUTH_FONTS,
} from '../constants/auth-theme';
import { supabase } from '../lib/supabase';

const logoMark = require('../../assets/figma/auth/logo-mark.png');

export default function StartScreen() {
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false);
      return;
    }
    void supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) {
        setCheckingSession(false);
        return;
      }
      const { data: profile } = await supabase!
        .from('profiles')
        .select('role, approval_status')
        .eq('id', user.id)
        .single();
      if (profile?.approval_status === 'approved') {
        router.replace(profile.role === 'admin' ? '/admin-home' : '/home');
      } else {
        await supabase!.auth.signOut();
        setCheckingSession(false);
      }
    });
  }, []);

  if (checkingSession) {
    return <SafeAreaView style={styles.safeArea}><ActivityIndicator style={styles.loader} color={AUTH_COLORS.text} /></SafeAreaView>;
  }
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={styles.safeArea}
    >
      <StatusBar style="light" />

      <View style={styles.logoArea}>
        <View style={styles.logoTextArea}>
          <Text style={styles.department}>서원대학교</Text>
          <Text style={styles.department}>미디어콘텐츠학부</Text>
          <Text style={styles.departmentEnglish}>
            Division of Media Contents
          </Text>
        </View>
        <Image
          accessibilityLabel="미디어콘텐츠학부 로고"
          source={logoMark}
          style={styles.logoMark}
        />
      </View>

      <AuthButton
        title="시작하기"
        onPress={() => router.push('/onboarding')}
        style={styles.startButton}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  logoArea: {
    position: 'absolute',
    top: '42%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    transform: [{ translateY: -38 }],
  },
  logoTextArea: {
    alignItems: 'flex-end',
  },
  department: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 25,
    lineHeight: 28,
  },
  departmentEnglish: {
    marginTop: 1,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 13,
    lineHeight: 15,
  },
  logoMark: {
    width: 76,
    height: 76,
  },
  startButton: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 15,
  },
  loader: { flex: 1 },
});
