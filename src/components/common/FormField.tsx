import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
} from 'react-native';

import { COLORS } from '../../constants/colors';

type FormFieldProps = TextInputProps & {
  label: string;
  errorMessage?: string;
};

export default function FormField({
  label,
  errorMessage,
  multiline = false,
  style,
  ...inputProps
}: FormFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        {...inputProps}
        multiline={multiline}
        placeholderTextColor={
          inputProps.placeholderTextColor ?? COLORS.placeholder
        }
        style={[
          styles.input,
          multiline && styles.multilineInput,
          errorMessage && styles.errorInput,
          style,
        ]}
      />

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
  },
  label: {
    marginBottom: 9,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 140,
    paddingTop: 16,
    paddingBottom: 16,
    textAlignVertical: 'top',
  },
  errorInput: {
    borderColor: COLORS.error,
  },
  errorText: {
    marginTop: 7,
    color: COLORS.error,
    fontSize: 12,
    lineHeight: 18,
  },
});