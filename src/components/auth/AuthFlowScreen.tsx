import { StatusBar } from 'expo-status-bar';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AUTH_COLORS,
  AUTH_FONTS,
} from '../../constants/auth-theme';
import AuthButton from './AuthButton';

const backIcon = require('../../../assets/figma/auth/back.png');

type AuthFlowScreenProps = {
  title: string;
  children: React.ReactNode;
  buttonTitle: string;
  onBack: () => void;
  onButtonPress: () => void;
  buttonDisabled?: boolean;
  buttonLoading?: boolean;
  multiline?: boolean;
};

export default function AuthFlowScreen({
  title,
  children,
  buttonTitle,
  onBack,
  onButtonPress,
  buttonDisabled = false,
  buttonLoading = false,
  multiline = false,
}: AuthFlowScreenProps) {
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={styles.safeArea}
    >
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            accessibilityLabel="이전 단계로 이동"
            accessibilityRole="button"
            hitSlop={12}
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Image source={backIcon} style={styles.backIcon} />
          </Pressable>

          <View style={styles.form}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.field}>{children}</View>
            <AuthButton
              title={buttonTitle}
              disabled={buttonDisabled}
              loading={buttonLoading}
              onPress={onButtonPress}
              style={[
                styles.button,
                multiline && styles.multilineButton,
              ]}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backButton: {
    position: 'absolute',
    zIndex: 2,
    top: 15,
    left: 16,
    width: 30,
    height: 30,
  },
  backIcon: {
    width: 30,
    height: 30,
  },
  form: {
    paddingTop: 126,
    paddingHorizontal: 20,
  },
  title: {
    width: 334,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.extraBold,
    fontSize: 24,
    lineHeight: 28,
  },
  field: {
    marginTop: 16,
  },
  button: {
    marginTop: 60,
  },
  multilineButton: {
    marginTop: 42,
  },
  pressed: {
    opacity: 0.65,
  },
});
