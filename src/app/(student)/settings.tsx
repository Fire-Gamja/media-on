import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
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
import { getAuthErrorMessage, signOutUser } from '../../services/auth';
import {
  disablePushForCurrentDevice,
  getNotificationPermissionGranted,
  requestAndRegisterCurrentDeviceForPush,
} from '../../services/push-notifications';

export default function StudentSettingsScreen() {
  const {
    generalNotificationsEnabled,
    setGeneralNotificationsEnabled,
  } = useAppSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] =
    useState<boolean | null>(null);

  const refreshNotificationPermission = useCallback(async () => {
    try {
      setNotificationPermissionGranted(
        await getNotificationPermissionGranted(),
      );
    } catch {
      setNotificationPermissionGranted(false);
    }
  }, []);

  useEffect(() => {
    void refreshNotificationPermission();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshNotificationPermission();
      }
    });

    return () => subscription.remove();
  }, [refreshNotificationPermission]);

  const requestNotificationPermission = async () => {
    try {
      setIsSaving(true);
      await requestAndRegisterCurrentDeviceForPush();
      const granted = await getNotificationPermissionGranted();
      setNotificationPermissionGranted(granted);

      if (!granted) {
        Alert.alert(
          '알림 권한이 꺼져 있습니다',
          '알림은 선택 사항입니다. 허용하려면 휴대전화 설정에서 MEDIA ON 알림을 켜 주세요.',
          [
            { text: '나중에', style: 'cancel' },
            {
              text: '설정으로 이동',
              onPress: () => void Linking.openSettings(),
            },
          ],
        );
      }

      return granted;
    } catch (error) {
      Alert.alert('알림 설정 실패', getAuthErrorMessage(error));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateGeneralNotifications = async (enabled: boolean) => {
    try {
      setIsSaving(true);

      if (enabled && !notificationPermissionGranted) {
        setIsSaving(false);
        const granted = await requestNotificationPermission();
        if (!granted) {
          return;
        }
        setIsSaving(true);
      }

      await setGeneralNotificationsEnabled(enabled);
      if (enabled) {
        await requestAndRegisterCurrentDeviceForPush();
      } else {
        await disablePushForCurrentDevice();
      }
    } catch (error) {
      Alert.alert('설정 실패', getAuthErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await signOutUser();
          router.replace({ pathname: '/login', params: { fromLogout: '1' } });
        },
      },
    ]);
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
            disabled={isSaving || notificationPermissionGranted === null}
            label="일반 상태 알림"
            onValueChange={(value) => void updateGeneralNotifications(value)}
            value={
              generalNotificationsEnabled &&
              notificationPermissionGranted === true
            }
          />
          <View style={styles.divider} />
          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => void requestNotificationPermission()}
            style={styles.row}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>기기 알림 권한</Text>
              <Text style={styles.rowDescription}>
                선택 사항이며, 허용하지 않아도 앱을 이용할 수 있습니다.
              </Text>
            </View>
            <View
              style={[
                styles.permissionBadge,
                notificationPermissionGranted && styles.permissionBadgeOn,
              ]}
            >
              <Text
                style={[
                  styles.permissionText,
                  notificationPermissionGranted && styles.permissionTextOn,
                ]}
              >
                {notificationPermissionGranted ? '허용됨' : '설정하기'}
              </Text>
            </View>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>서비스 및 개인정보</Text>
        <View style={styles.card}>
          <LinkRow
            description="버전 2026-08-06"
            label="서비스 이용약관"
            onPress={() =>
              router.push({
                pathname: '/legal-document',
                params: { type: 'terms' },
              })
            }
          />
          <View style={styles.divider} />
          <LinkRow
            description="수집 항목·보유기간·해외 처리·권리 안내"
            label="개인정보처리방침"
            onPress={() =>
              router.push({
                pathname: '/legal-document',
                params: { type: 'privacy' },
              })
            }
          />
          <View style={styles.divider} />
          <LinkRow
            danger
            description="계정과 연결된 개인정보를 영구 삭제합니다."
            label="계정 및 데이터 삭제"
            onPress={() => router.push('/account-deletion')}
          />
        </View>

        {isSaving ? (
          <View style={styles.saving}>
            <ActivityIndicator color={COLORS.navy} />
            <Text style={styles.savingText}>설정을 저장하는 중입니다.</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.logoutText}>로그아웃</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function LinkRow({
  danger = false,
  description,
  label,
  onPress,
}: {
  danger?: boolean;
  description: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && styles.dangerText]}>
          {label}
        </Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Text style={[styles.chevron, danger && styles.dangerText]}>›</Text>
    </Pressable>
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
      <View style={styles.switchWrap}>
        <Switch
          disabled={disabled}
          ios_backgroundColor={COLORS.disabled}
          onValueChange={onValueChange}
          thumbColor={COLORS.white}
          trackColor={{ false: COLORS.disabled, true: COLORS.navy }}
          value={value}
        />
      </View>
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
  headerSide: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  scrollView: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: 16, paddingBottom: 48 },
  sectionLabel: {
    marginTop: 10,
    marginBottom: 10,
    color: '#8E95A3',
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    marginBottom: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  rowText: { flex: 1 },
  switchWrap: {
    width: 54,
    minHeight: 54,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  rowDescription: {
    marginTop: 6,
    color: COLORS.subText,
    fontSize: 12,
    lineHeight: 18,
  },
  permissionBadge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 11,
    backgroundColor: COLORS.background,
  },
  permissionBadgeOn: { backgroundColor: COLORS.softNavy },
  permissionText: { color: COLORS.subText, fontSize: 11, fontWeight: '900' },
  permissionTextOn: { color: COLORS.navy },
  divider: { height: 1, backgroundColor: COLORS.border },
  linkRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chevron: { color: COLORS.subText, fontSize: 25, lineHeight: 28 },
  dangerText: { color: COLORS.error },
  pressed: { opacity: 0.7 },
  saving: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  savingText: { color: COLORS.subText, fontSize: 12 },
  logoutButton: {
    minHeight: 70,
    marginTop: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#A2A2A2',
    fontFamily: 'FreesentationRegular',
    fontSize: 15,
  },
});
