import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import {
  AUTH_COLORS,
  AUTH_FONTS,
} from '../../constants/auth-theme';

const phoneIcon = require('../../../assets/figma/auth/phone.png');
const passwordAlertIcon = require('../../../assets/figma/auth/password-alert.png');
const managerIcon = require('../../../assets/figma/auth/manager.png');

export default function PasswordResetScreen() {
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={styles.safeArea}
    >
      <StatusBar style="light" />

      <Pressable
        accessibilityLabel="로그인 화면으로 돌아가기"
        accessibilityRole="button"
        hitSlop={12}
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.pressed,
        ]}
      >
        <PlatformHeaderIcon color="#FFFFFF" name="back" />
      </Pressable>

      <Text style={styles.title}>
        비밀번호 재설정 방법을{'\n'}선택해 주세요
      </Text>

      <View style={styles.methodRow}>
        <ResetMethod
          description={
            '가입할 때 등록한 휴대전화번호로\n본인 인증 후 비밀번호를 변경합니다.'
          }
          icon={
            <View style={styles.phoneIconArea}>
              <Image source={phoneIcon} style={styles.phoneIcon} />
              <Image
                source={passwordAlertIcon}
                style={styles.passwordAlertIcon}
              />
            </View>
          }
          onPress={() => router.push('/password-reset-phone')}
          title="휴대전화번호로 재설정"
        />
        <ResetMethod
          description={
            '휴대전화번호 인증이 어려운 경우\n관리자에게 초기화를 요청합니다.'
          }
          icon={
            <Image source={managerIcon} style={styles.managerIcon} />
          }
          onPress={() => router.push('/password-reset-request')}
          title="관리자에게 재설정 요청"
        />
      </View>
    </SafeAreaView>
  );
}

type ResetMethodProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
};

function ResetMethod({
  title,
  description,
  icon,
  onPress,
}: ResetMethodProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.methodCard,
        pressed && styles.methodCardPressed,
      ]}
    >
      <View style={styles.iconArea}>{icon}</View>
      <Text style={styles.methodTitle}>{title}</Text>
      <Text style={styles.methodDescription}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  backButton: {
    position: 'absolute',
    top: 15,
    left: 16,
    width: 30,
    height: 30,
  },
  backIcon: {
    width: 30,
    height: 30,
  },
  title: {
    position: 'absolute',
    top: 126,
    left: 20,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 24,
    lineHeight: 28,
  },
  methodRow: {
    position: 'absolute',
    top: 248,
    right: 16,
    left: 16,
    flexDirection: 'row',
    gap: 16,
  },
  methodCard: {
    flex: 1,
    height: 228,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AUTH_COLORS.text,
    borderRadius: 10,
  },
  methodCardPressed: {
    borderColor: AUTH_COLORS.link,
    backgroundColor: AUTH_COLORS.overlay,
  },
  iconArea: {
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneIconArea: {
    width: 100,
    height: 100,
  },
  phoneIcon: {
    width: 100,
    height: 100,
  },
  passwordAlertIcon: {
    position: 'absolute',
    top: 38,
    left: 38,
    width: 24,
    height: 24,
  },
  managerIcon: {
    width: 90,
    height: 90,
  },
  methodTitle: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 15,
    lineHeight: 19,
    textAlign: 'center',
  },
  methodDescription: {
    marginTop: 18,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
});
