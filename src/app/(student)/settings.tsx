import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import { COLORS } from '../../constants/colors';
import { useAppSettings } from '../../context/app-settings-context';
import { getAuthErrorMessage } from '../../services/auth';

export default function StudentSettingsScreen() {
  const {
    generalNotificationsEnabled,
    setGeneralNotificationsEnabled,
  } = useAppSettings();
  const [isSaving, setIsSaving] = useState(false);

  const updateGeneralNotifications = async (enabled: boolean) => {
    try {
      setIsSaving(true);
      await setGeneralNotificationsEnabled(enabled);
    } catch (error) {
      Alert.alert('설정 실패', getAuthErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.headerSide}
        >
          <PlatformHeaderIcon color={COLORS.navy} name="back" />
        </Pressable>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        style={styles.scrollView}
      >
        <Text style={styles.sectionLabel}>알림</Text>
        <View style={styles.card}>
          <SettingRow
            description="공지, 대여·신고·문의 처리 상태 알림"
            disabled={isSaving}
            label="일반 상태 알림"
            onValueChange={(value) => void updateGeneralNotifications(value)}
            value={generalNotificationsEnabled}
          />
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowText}>
              <View style={styles.lockedTitleRow}>
                <Text style={styles.rowTitle}>긴급 알림</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>필수</Text>
                </View>
              </View>
              <Text style={styles.rowDescription}>
                안전·학사 긴급 공지는 항상 전달됩니다.
              </Text>
            </View>
            <Switch
              disabled
              ios_backgroundColor={COLORS.navy}
              thumbColor={COLORS.white}
              trackColor={{ false: COLORS.navy, true: COLORS.navy }}
              value
            />
          </View>
        </View>

        {isSaving ? (
          <View style={styles.saving}>
            <ActivityIndicator color={COLORS.navy} />
            <Text style={styles.savingText}>설정을 저장하는 중입니다.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  description,
  disabled,
  label,
  onValueChange,
  value,
}: {
  description: string;
  disabled: boolean;
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        disabled={disabled}
        ios_backgroundColor={COLORS.disabled}
        onValueChange={onValueChange}
        thumbColor={COLORS.white}
        trackColor={{ false: COLORS.disabled, true: COLORS.navy }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerSide: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.text, fontSize: 19, fontWeight: '900' },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 48 },
  sectionLabel: {
    marginTop: 7,
    marginBottom: 9,
    marginLeft: 4,
    color: COLORS.subText,
    fontSize: 13,
    fontWeight: '800',
  },
  card: {
    marginBottom: 22,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  row: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  rowText: { flex: 1 },
  rowTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  rowDescription: {
    marginTop: 6,
    color: COLORS.subText,
    fontSize: 12,
    lineHeight: 18,
  },
  lockedTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  requiredBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9,
    backgroundColor: COLORS.softNavy,
  },
  requiredText: { color: COLORS.navy, fontSize: 10, fontWeight: '900' },
  divider: { height: 1, backgroundColor: COLORS.border },
  saving: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  savingText: { color: COLORS.subText, fontSize: 12 },
});
