import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import {
  AUTH_COLORS,
  AUTH_FONTS,
} from '../../constants/auth-theme';

type AuthButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'outline';
  style?: ViewStyle;
};

export default function AuthButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
}: AuthButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'outline' && styles.outlineButton,
        isDisabled && styles.disabledButton,
        pressed && !isDisabled && styles.pressedButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={AUTH_COLORS.text} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'outline' && styles.outlineButtonText,
            isDisabled && styles.disabledButtonText,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: AUTH_COLORS.primary,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: AUTH_COLORS.inputBorder,
    backgroundColor: 'transparent',
  },
  pressedButton: {
    opacity: 0.84,
    backgroundColor: AUTH_COLORS.primaryPressed,
  },
  disabledButton: {
    borderColor: AUTH_COLORS.disabled,
    backgroundColor: AUTH_COLORS.disabled,
  },
  buttonText: {
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 17,
  },
  outlineButtonText: {
    color: AUTH_COLORS.text,
  },
  disabledButtonText: {
    color: AUTH_COLORS.disabledText,
  },
});
