import { Image as ExpoImage } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const chevronDown = require('../../../assets/figma/student-v2/chervron-down.svg');

export type InlineDropdownOption = Readonly<{
  label: string;
  value: string;
}>;

type InlineDropdownProps = {
  accessibilityLabel?: string;
  isOpen: boolean;
  label: string;
  onSelect: (value: string) => void;
  onToggle: () => void;
  options: ReadonlyArray<InlineDropdownOption>;
  placeholder?: string;
  selectedValue: string | null;
};

export function InlineDropdown({
  accessibilityLabel,
  isOpen,
  label,
  onSelect,
  onToggle,
  options,
  placeholder = '선택해 주세요',
  selectedValue,
}: InlineDropdownProps) {
  const selectedOption = options.find(
    (option) => option.value === selectedValue,
  );

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        accessibilityLabel={accessibilityLabel ?? `${label} 선택`}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.selectField,
          isOpen && styles.selectFieldOpen,
          pressed && styles.pressed,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.fieldValue,
            !selectedOption && styles.placeholderText,
          ]}
        >
          {selectedOption?.label ?? placeholder}
        </Text>
        <ExpoImage
          accessible={false}
          contentFit="contain"
          source={chevronDown}
          style={[styles.chevronIcon, isOpen && styles.chevronIconOpen]}
        />
      </Pressable>

      {isOpen ? (
        <View style={styles.selectOptions}>
          {options.map((option, index) => {
            const isSelected = option.value === selectedValue;

            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                key={option.value}
                onPress={() => onSelect(option.value)}
                style={({ pressed }) => [
                  styles.selectOption,
                  index === 0 && styles.firstOption,
                  isSelected && styles.selectedOption,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: { gap: 12 },
  fieldLabel: {
    color: '#1B2A4A',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
  },
  selectField: {
    minHeight: 44,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E4E9F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  selectFieldOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  fieldValue: {
    flex: 1,
    color: '#333D4B',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  placeholderText: { color: '#8A94A6' },
  chevronIcon: { width: 14, height: 14, marginLeft: 12 },
  chevronIconOpen: { transform: [{ rotate: '180deg' }] },
  selectOptions: {
    marginTop: -12,
    overflow: 'hidden',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#E4E9F0',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  selectOption: {
    minHeight: 42,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
  },
  firstOption: { borderTopWidth: 0 },
  selectedOption: { backgroundColor: '#F5F6FA' },
  optionText: {
    color: '#333D4B',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
    lineHeight: 20,
  },
  selectedOptionText: { fontFamily: 'FreesentationExtraBold' },
  pressed: { opacity: 0.7 },
});
