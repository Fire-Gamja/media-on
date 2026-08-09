import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          hitSlop={10}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.headerSide,
            pressed && styles.pressed,
          ]}
        >
          <PlatformHeaderIcon name="back" />
        </Pressable>
        <Text style={styles.headerTitle}>공지사항 설정</Text>
        <View style={styles.headerSide} />
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
    height: 56,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF3',
    backgroundColor: COLORS.surface,
  },
  headerSide: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 20,
  },
  pressed: {
    opacity: 0.6,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  heading: {
    color: '#111B2C',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 24,
    lineHeight: 32,
  },
  label: {
    marginTop: 32,
    color: '#111B2C',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 14,
  },
  optionList: {
    marginTop: 20,
    gap: 16,
  },
  optionRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionPressed: {
    opacity: 0.72,
  },
  radio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#B9C0D4',
    borderRadius: 11,
    backgroundColor: COLORS.surface,
  },
  radioSelected: {
    borderWidth: 6,
    borderColor: '#3550FF',
  },
  radioCenter: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surface,
  },
  optionCard: {
    flex: 1,
    height: 56,
    paddingHorizontal: 24,
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F4F6FA',
  },
  optionText: {
    color: '#111B2C',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
  },
  saveButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#3550FF',
  },
  saveButtonPressed: {
    backgroundColor: '#293FDC',
  },
  saveButtonText: {
    color: COLORS.white,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 16,
  },
});
