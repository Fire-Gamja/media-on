import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import {
  AUTH_COLORS,
  AUTH_FONTS,
} from '../../constants/auth-theme';

type AuthFieldProps = TextInputProps & {
  label?: string;
  errorMessage?: string;
  rightActionLabel?: string;
  onRightActionPress?: () => void;
};

export default function AuthField({
  label,
  errorMessage,
  rightActionLabel,
  onRightActionPress,
  multiline = false,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: AuthFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputShell,
          multiline && styles.multilineShell,
          isFocused && styles.focusedShell,
          errorMessage && styles.errorShell,
        ]}
      >
        <TextInput
          {...inputProps}
          multiline={multiline}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          placeholderTextColor={
            inputProps.placeholderTextColor ?? AUTH_COLORS.placeholder
          }
          selectionColor={AUTH_COLORS.link}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            rightActionLabel && styles.inputWithAction,
            style,
          ]}
        />

        {rightActionLabel && onRightActionPress ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={onRightActionPress}
            style={({ pressed }) => [
              styles.rightAction,
              pressed && styles.rightActionPressed,
            ]}
          >
            <Text style={styles.rightActionText}>{rightActionLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 9,
    color: AUTH_COLORS.subText,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 14,
  },
  inputShell: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AUTH_COLORS.inputBorder,
    borderRadius: 12,
    backgroundColor: AUTH_COLORS.input,
  },
  focusedShell: {
    borderColor: AUTH_COLORS.inputFocused,
  },
  errorShell: {
    borderColor: AUTH_COLORS.error,
  },
  multilineShell: {
    minHeight: 148,
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 16,
    color: AUTH_COLORS.text,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 146,
    paddingTop: 16,
    paddingBottom: 16,
    textAlignVertical: 'top',
  },
  inputWithAction: {
    paddingRight: 4,
  },
  rightAction: {
    minHeight: 42,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActionPressed: {
    opacity: 0.65,
  },
  rightActionText: {
    color: AUTH_COLORS.link,
    fontFamily: AUTH_FONTS.semiBold,
    fontSize: 14,
  },
  errorText: {
    marginTop: 7,
    color: AUTH_COLORS.error,
    fontFamily: AUTH_FONTS.regular,
    fontSize: 12,
    lineHeight: 18,
  },
});
