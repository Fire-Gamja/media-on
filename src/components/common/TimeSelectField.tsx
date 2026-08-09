import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/colors';
import { BottomSheetModal } from './BottomSheetModal';

type TimeSelectFieldProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

const WHEEL_ITEM_HEIGHT = 54;
const WHEEL_VISIBLE_ITEMS = 5;
const WHEEL_PADDING =
  WHEEL_ITEM_HEIGHT * Math.floor(WHEEL_VISIBLE_ITEMS / 2);

export function TimeSelectField({
  label,
  value,
  options,
  onChange,
}: TimeSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const listRef = useRef<FlatList<string>>(null);
  const safeOptions = useMemo(
    () => (options.length > 0 ? options : [value]),
    [options, value],
  );
  const selectedIndex = Math.max(0, safeOptions.indexOf(draftValue));

  useEffect(() => {
    if (!isOpen) return;
    const nextValue = safeOptions.includes(value) ? value : safeOptions[0];
    setDraftValue(nextValue);
    const nextIndex = Math.max(0, safeOptions.indexOf(nextValue));
    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        animated: false,
        offset: nextIndex * WHEEL_ITEM_HEIGHT,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, safeOptions, value]);

  const updateFromOffset = (offsetY: number) => {
    const nextIndex = Math.min(
      safeOptions.length - 1,
      Math.max(0, Math.round(offsetY / WHEEL_ITEM_HEIGHT)),
    );
    setDraftValue(safeOptions[nextIndex]);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} 선택`}
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [styles.selectButton, pressed && styles.pressed]}
      >
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      <BottomSheetModal
        accessibilityLabel={`${label} 선택 닫기`}
        backdropColor="rgba(0, 0, 0, 0.42)"
        onRequestClose={() => setIsOpen(false)}
        visible={isOpen}
      >
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{label}</Text>
          <View
            accessibilityActions={[
              { name: 'increment', label: '다음 값' },
              { name: 'decrement', label: '이전 값' },
            ]}
            accessibilityLabel={`${label} ${draftValue}`}
            accessibilityRole="adjustable"
            accessibilityValue={{
              min: 1,
              max: safeOptions.length,
              now: selectedIndex + 1,
              text: draftValue,
            }}
            onAccessibilityAction={({ nativeEvent }) => {
              const amount = nativeEvent.actionName === 'increment' ? 1 : -1;
              const nextIndex = Math.min(
                safeOptions.length - 1,
                Math.max(0, selectedIndex + amount),
              );
              setDraftValue(safeOptions[nextIndex]);
              listRef.current?.scrollToOffset({
                animated: true,
                offset: nextIndex * WHEEL_ITEM_HEIGHT,
              });
            }}
            style={styles.wheelViewport}
          >
            <View pointerEvents="none" style={styles.selectionBand} />
            <FlatList
              ref={listRef}
              bounces={false}
              contentContainerStyle={styles.wheelContent}
              data={safeOptions}
              decelerationRate="fast"
              disableIntervalMomentum
              getItemLayout={(_, index) => ({
                index,
                length: WHEEL_ITEM_HEIGHT,
                offset: index * WHEEL_ITEM_HEIGHT,
              })}
              keyExtractor={(item, index) => `${item}-${index}`}
              onMomentumScrollEnd={({ nativeEvent }) =>
                updateFromOffset(nativeEvent.contentOffset.y)
              }
              onScroll={({ nativeEvent }) =>
                updateFromOffset(nativeEvent.contentOffset.y)
              }
              overScrollMode="never"
              renderItem={({ item, index }) => {
                const distance = Math.abs(index - selectedIndex);
                return (
                  <Pressable
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    onPress={() => {
                      setDraftValue(item);
                      listRef.current?.scrollToOffset({
                        animated: true,
                        offset: index * WHEEL_ITEM_HEIGHT,
                      });
                    }}
                    style={styles.wheelItem}
                  >
                    <Text
                      style={[
                        styles.wheelText,
                        distance === 1 && styles.wheelTextNear,
                        distance >= 2 && styles.wheelTextFar,
                        distance === 0 && styles.wheelTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              }}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              snapToAlignment="start"
              snapToInterval={WHEEL_ITEM_HEIGHT}
              style={styles.wheel}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onChange(draftValue);
              setIsOpen(false);
            }}
            style={({ pressed }) => [
              styles.confirmButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.confirmText}>확인</Text>
          </Pressable>
        </SafeAreaView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1 },
  label: {
    marginBottom: 9,
    color: COLORS.text,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
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
    fontFamily: 'FreesentationSemiBold',
    fontSize: 15,
  },
  chevron: { color: COLORS.subText, fontSize: 20 },
  sheet: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: COLORS.surface,
  },
  handle: {
    width: 30,
    height: 5,
    alignSelf: 'center',
    borderRadius: 3,
    backgroundColor: '#626262',
  },
  sheetTitle: {
    marginTop: 16,
    color: COLORS.text,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
    textAlign: 'center',
  },
  wheelViewport: {
    position: 'relative',
    height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS,
    marginTop: 8,
    overflow: 'hidden',
  },
  wheel: { flex: 1 },
  wheelContent: { paddingVertical: WHEEL_PADDING },
  selectionBand: {
    position: 'absolute',
    top: WHEEL_PADDING,
    right: 36,
    left: 36,
    height: WHEEL_ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D7DBE5',
    backgroundColor: '#F8F9FF',
  },
  wheelItem: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: {
    color: COLORS.text,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 31,
    opacity: 0.2,
  },
  wheelTextNear: { fontSize: 27, opacity: 0.45 },
  wheelTextFar: { fontSize: 23, opacity: 0.16 },
  wheelTextSelected: {
    color: '#3550FF',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 38,
    opacity: 1,
  },
  confirmButton: {
    height: 52,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#3550FF',
  },
  confirmText: {
    color: COLORS.white,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 15,
  },
  pressed: { opacity: 0.65 },
});
