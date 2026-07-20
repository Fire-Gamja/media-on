import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/colors';
import {
  NOTICE_COUNT_OPTIONS,
  type NoticeCount,
  useNoticeSettings,
} from '../../context/notice-settings-context';

export default function NoticeSettingsScreen() {
  const { noticeCount, setNoticeCount } = useNoticeSettings();
  const [selectedCount, setSelectedCount] = useState<NoticeCount>(noticeCount);

  const handleSave = () => {
    setNoticeCount(selectedCount);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerSide} />
        <Text style={styles.headerTitle}>공지사항 설정</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="공지사항 설정 닫기"
          hitSlop={10}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>

      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>
            공지사항에 표시할 내용을{`\n`}선택해 보세요.
          </Text>
          <Text style={styles.label}>조회 게시글 건수 선택</Text>

          <View style={styles.optionList}>
            {NOTICE_COUNT_OPTIONS.map((count) => {
              const isSelected = selectedCount === count;

              return (
                <Pressable
                  key={count}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => setSelectedCount(count)}
                  style={({ pressed }) => [
                    styles.optionRow,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.radio,
                      isSelected && styles.radioSelected,
                    ]}
                  >
                    {isSelected ? <View style={styles.radioCenter} /> : null}
                  </View>
                  <View style={styles.optionCard}>
                    <Text style={styles.optionText}>{count}건</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.saveButtonPressed,
            ]}
          >
            <Text style={styles.saveButtonText}>저장</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    height: 68,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF3',
    backgroundColor: COLORS.surface,
  },
  headerSide: {
    width: 44,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '800',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: COLORS.text,
    fontSize: 40,
    lineHeight: 42,
    fontWeight: '300',
  },
  pressed: {
    opacity: 0.6,
  },
  screen: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 38,
    paddingBottom: 24,
  },
  heading: {
    color: COLORS.text,
    fontSize: 25,
    lineHeight: 36,
    fontWeight: '800',
  },
  label: {
    marginTop: 38,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
  },
  optionList: {
    marginTop: 22,
    gap: 16,
  },
  optionRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionPressed: {
    opacity: 0.72,
  },
  radio: {
    width: 26,
    height: 26,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#8090A0',
    borderRadius: 13,
    backgroundColor: COLORS.surface,
  },
  radioSelected: {
    borderWidth: 7,
    borderColor: '#1688F8',
  },
  radioCenter: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
  },
  optionCard: {
    flex: 1,
    height: 68,
    paddingHorizontal: 26,
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: COLORS.surface,
  },
  optionText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: COLORS.surface,
  },
  saveButton: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#1688F8',
  },
  saveButtonPressed: {
    backgroundColor: '#0873D7',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
});
