import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import {
  DEFAULT_QUICK_MENU_IDS,
  QUICK_MENU_ITEM_BY_ID,
  QUICK_MENU_ITEMS,
  type QuickMenuId,
  type QuickMenuItem,
} from '../../constants/student-quick-menu';
import { useAppSettings } from '../../context/app-settings-context';
import { translate } from '../../i18n/translations';
import { getQuickMenuIds, resetQuickMenuIds, saveQuickMenuIds } from '../../services/quick-menu';

const MAX_ITEMS = 8;
const ROW_HEIGHT = 66;

export default function QuickMenuEditScreen() {
  const { language } = useAppSettings();
  const [selectedIds, setSelectedIds] = useState<QuickMenuId[]>([...DEFAULT_QUICK_MENU_IDS]);

  useEffect(() => {
    void getQuickMenuIds().then(setSelectedIds);
  }, []);

  const selected = selectedIds.flatMap((id) => {
    const item = QUICK_MENU_ITEM_BY_ID.get(id);
    return item ? [item] : [];
  });
  const available = QUICK_MENU_ITEMS.filter((item) => !selectedIds.includes(item.id));

  const moveItem = (from: number, offset: number) => {
    const to = Math.max(0, Math.min(selectedIds.length - 1, from + offset));
    if (from === to) return;
    setSelectedIds((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable accessibilityLabel={translate(language, 'common.back')} hitSlop={8} onPress={() => router.back()} style={styles.headerSide}>
          <PlatformHeaderIcon name="back" />
        </Pressable>
        <Text style={styles.headerTitle}>{translate(language, 'quickEdit.title')}</Text>
        <Pressable
          onPress={() => void resetQuickMenuIds().then(setSelectedIds)}
          style={styles.headerSide}
        >
          <Text style={styles.resetText}>{translate(language, 'quickEdit.reset')}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.guide}>{translate(language, 'quickEdit.guide')}</Text>
        <Text style={styles.counter}>{selectedIds.length}/{MAX_ITEMS}</Text>

        <View style={styles.selectedList}>
          {selected.map((item, index) => (
            <QuickMenuRow
              index={index}
              item={item}
              key={item.id}
              language={language}
              onDrop={(offset) => moveItem(index, offset)}
              onRemove={() => setSelectedIds((current) => current.filter((id) => id !== item.id))}
            />
          ))}
        </View>

        <Text style={styles.availableTitle}>{translate(language, 'quickEdit.available')}</Text>
        <View style={styles.availableGrid}>
          {available.map((item) => (
            <Pressable
              key={item.id}
              disabled={selectedIds.length >= MAX_ITEMS}
              onPress={() => setSelectedIds((current) => [...current, item.id])}
              style={({ pressed }) => [styles.availableItem, selectedIds.length >= MAX_ITEMS && styles.disabled, pressed && styles.pressed]}
            >
              <View style={styles.iconBox}>
                <Image contentFit="contain" source={item.icon} style={styles.icon} />
              </View>
              <Text numberOfLines={1} style={styles.availableLabel}>{translate(language, item.titleKey)}</Text>
              <Text style={styles.addIcon}>+</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        <Pressable
          onPress={() => void saveQuickMenuIds(selectedIds).then(() => router.back())}
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
        >
          <Text style={styles.saveText}>{translate(language, 'common.save')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function QuickMenuRow({ index, item, language, onDrop, onRemove }: {
  index: number;
  item: QuickMenuItem;
  language: Parameters<typeof translate>[0];
  onDrop: (offset: number) => void;
  onRemove: () => void;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const responder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
      onPanResponderGrant: () => translateY.setOffset(0),
      onPanResponderMove: Animated.event([null, { dy: translateY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        translateY.setValue(0);
        onDrop(Math.round(gesture.dy / ROW_HEIGHT));
      },
      onPanResponderTerminate: () => translateY.setValue(0),
    }),
    [onDrop, translateY],
  );

  return (
    <Animated.View style={[styles.selectedRow, { transform: [{ translateY }], zIndex: translateY ? 2 : 0 }]}>
      <View style={styles.orderBadge}><Text style={styles.orderText}>{index + 1}</Text></View>
      <Image contentFit="contain" source={item.icon} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{translate(language, item.titleKey)}</Text>
      <Pressable accessibilityLabel="빠른 메뉴 삭제" hitSlop={8} onPress={onRemove} style={styles.removeButton}>
        <Text style={styles.removeText}>−</Text>
      </Pressable>
      <View accessibilityLabel="길게 끌어 순서 변경" style={styles.dragHandle} {...responder.panHandlers}>
        <Text style={styles.dragText}>☰</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { height: 58, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#ECEEF2' },
  headerSide: { width: 58, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#1F232B', fontFamily: 'FreesentationExtraBold', fontSize: 19 },
  resetText: { color: '#6F7682', fontFamily: 'FreesentationSemiBold', fontSize: 13 },
  content: { padding: 16, paddingBottom: 120 },
  guide: { color: '#646B77', fontFamily: 'FreesentationRegular', fontSize: 13, lineHeight: 19 },
  counter: { alignSelf: 'flex-end', marginTop: 4, color: '#3550FF', fontFamily: 'FreesentationExtraBold', fontSize: 13 },
  selectedList: { marginTop: 12, gap: 8 },
  selectedRow: { minHeight: 58, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E6E8ED', borderRadius: 14, backgroundColor: '#FFFFFF', elevation: 1 },
  orderBadge: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#EEF2FF' },
  orderText: { color: '#3550FF', fontFamily: 'FreesentationExtraBold', fontSize: 12 },
  rowIcon: { width: 22, height: 22, marginLeft: 12 },
  rowLabel: { flex: 1, marginLeft: 10, color: '#30353F', fontFamily: 'FreesentationSemiBold', fontSize: 14 },
  removeButton: { width: 38, height: 44, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: '#ED5262', fontSize: 24 },
  dragHandle: { width: 42, height: 50, alignItems: 'center', justifyContent: 'center' },
  dragText: { color: '#9CA2AD', fontSize: 19 },
  availableTitle: { marginTop: 28, color: '#252A33', fontFamily: 'FreesentationExtraBold', fontSize: 17 },
  availableGrid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  availableItem: { width: '48%', minHeight: 64, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E7E9EE', borderRadius: 14 },
  iconBox: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#F5F6FA' },
  icon: { width: 20, height: 20 },
  availableLabel: { flex: 1, marginLeft: 8, color: '#3A404A', fontFamily: 'FreesentationSemiBold', fontSize: 12 },
  addIcon: { color: '#3550FF', fontSize: 21 },
  bottomBar: { position: 'absolute', right: 0, bottom: 0, left: 0, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#ECEEF2', backgroundColor: '#FFFFFF' },
  saveButton: { height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 27, backgroundColor: '#3550FF' },
  saveText: { color: '#FFFFFF', fontFamily: 'FreesentationExtraBold', fontSize: 15 },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.65 },
});
