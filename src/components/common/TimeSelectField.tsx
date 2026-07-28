import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/colors';

type TimeSelectFieldProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

export function TimeSelectField({
  label,
  value,
  options,
  onChange,
}: TimeSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} 선택`}
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [
          styles.selectButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      <Modal
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
        transparent
        visible={isOpen}
      >
        <Pressable
          accessibilityLabel={`${label} 선택 닫기`}
          onPress={() => setIsOpen(false)}
          style={styles.backdrop}
        >
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <Pressable>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{label}</Text>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={() => setIsOpen(false)}
                >
                  <Text style={styles.close}>닫기</Text>
                </Pressable>
              </View>
              <FlatList
                data={options}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.optionList}
                style={styles.list}
                renderItem={({ item }) => {
                  const isSelected = value === item;

                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => {
                        onChange(item);
                        setIsOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.option,
                        isSelected && styles.optionSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                      {isSelected ? (
                        <Text style={styles.check}>✓</Text>
                      ) : null}
                    </Pressable>
                  );
                }}
              />
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
  },
  label: {
    marginBottom: 9,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  selectButton: {
    height: 56,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
  },
  value: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  chevron: {
    color: COLORS.subText,
    fontSize: 20,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  sheet: {
    maxHeight: '72%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.surface,
  },
  sheetHeader: {
    height: 64,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  close: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '800',
  },
  list: {
    maxHeight: 430,
  },
  optionList: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  option: {
    minHeight: 50,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
  },
  optionSelected: {
    backgroundColor: COLORS.softNavy,
  },
  optionText: {
    color: COLORS.text,
    fontSize: 15,
  },
  optionTextSelected: {
    color: COLORS.navy,
    fontWeight: '800',
  },
  check: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.65,
  },
});
