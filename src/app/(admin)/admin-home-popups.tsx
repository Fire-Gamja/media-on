import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/colors';
import { getAuthErrorMessage } from '../../services/auth';
import {
  getAdminHomePopups,
  type HomePopupInput,
  updateHomePopups,
} from '../../services/home-popups';

const EMPTY_POPUPS: HomePopupInput[] = [1, 2, 3].map((slot) => ({
  slot_number: slot as 1 | 2 | 3,
  title: '',
  body: '',
  action_label: '자세히 보기',
  action_url: null,
  is_active: false,
}));

export default function AdminHomePopupsScreen() {
  const [popups, setPopups] = useState<HomePopupInput[]>(EMPTY_POPUPS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const activeCount = useMemo(
    () => popups.filter((popup) => popup.is_active).length,
    [popups],
  );

  const loadPopups = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAdminHomePopups();
      setPopups(
        EMPTY_POPUPS.map(
          (emptyPopup) =>
            data.find(
              (popup) => popup.slot_number === emptyPopup.slot_number,
            ) ?? emptyPopup,
        ),
      );
    } catch (error) {
      Alert.alert('조회 실패', getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPopups();
    }, [loadPopups]),
  );

  const updatePopup = (
    slotNumber: HomePopupInput['slot_number'],
    patch: Partial<HomePopupInput>,
  ) => {
    setPopups((current) =>
      current.map((popup) =>
        popup.slot_number === slotNumber ? { ...popup, ...patch } : popup,
      ),
    );
  };

  const handleSave = async () => {
    const invalidPopup = popups.find(
      (popup) =>
        popup.is_active && (!popup.title.trim() || !popup.body.trim()),
    );

    if (invalidPopup) {
      Alert.alert(
        '내용 확인',
        `${invalidPopup.slot_number}번 팝업의 제목과 내용을 입력해 주세요.`,
      );
      return;
    }

    const invalidUrlPopup = popups.find(
      (popup) =>
        popup.action_url?.trim() &&
        !/^https?:\/\/\S+$/i.test(popup.action_url.trim()),
    );

    if (invalidUrlPopup) {
      Alert.alert(
        '링크 확인',
        `${invalidUrlPopup.slot_number}번 팝업 링크를 https:// 또는 http://로 시작해 주세요.`,
      );
      return;
    }

    try {
      setIsSaving(true);
      await updateHomePopups(popups);
      Alert.alert(
        '저장 완료',
        activeCount > 0
          ? `학생 홈 첫 화면에 팝업 ${activeCount}개가 순서대로 표시됩니다.`
          : '첫 화면 팝업 노출을 모두 해제했습니다.',
      );
    } catch (error) {
      Alert.alert('저장 실패', getAuthErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>첫 팝업 관리</Text>
        <View style={styles.headerSide} />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.navy} size="large" />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            style={styles.scrollView}
          >
            <View style={styles.guideCard}>
              <View style={styles.guideHeading}>
                <Text style={styles.guideTitle}>현재 {activeCount}개 노출</Text>
                <Text style={styles.guideLimit}>최대 3개</Text>
              </View>
              <Text style={styles.guideText}>
                노출을 켠 팝업만 학생이 홈에 들어올 때 1번부터 순서대로
                표시됩니다. 한 개만 켜면 한 개만 표시됩니다.
              </Text>
            </View>

            {popups.map((popup) => (
              <View key={popup.slot_number} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.slotLabel}>
                      팝업 {popup.slot_number}
                    </Text>
                    <Text style={styles.slotDescription}>
                      {popup.is_active ? '학생에게 노출 중' : '노출 안 함'}
                    </Text>
                  </View>
                  <Switch
                    accessibilityLabel={`${popup.slot_number}번 팝업 노출`}
                    ios_backgroundColor={COLORS.disabled}
                    onValueChange={(value) =>
                      updatePopup(popup.slot_number, { is_active: value })
                    }
                    thumbColor={COLORS.white}
                    trackColor={{
                      false: COLORS.disabled,
                      true: COLORS.navy,
                    }}
                    value={popup.is_active}
                  />
                </View>

                <PopupField
                  label="제목"
                  maxLength={60}
                  onChangeText={(value) =>
                    updatePopup(popup.slot_number, { title: value })
                  }
                  placeholder="예: 졸업전시회 안내"
                  value={popup.title}
                />
                <PopupField
                  label="내용"
                  maxLength={240}
                  multiline
                  onChangeText={(value) =>
                    updatePopup(popup.slot_number, { body: value })
                  }
                  placeholder="학생에게 보여 줄 이벤트 내용을 입력하세요."
                  value={popup.body}
                />
                <PopupField
                  label="버튼 문구"
                  maxLength={20}
                  onChangeText={(value) =>
                    updatePopup(popup.slot_number, { action_label: value })
                  }
                  placeholder="자세히 보기"
                  value={popup.action_label}
                />
                <PopupField
                  autoCapitalize="none"
                  keyboardType="url"
                  label="연결 링크 (선택)"
                  onChangeText={(value) =>
                    updatePopup(popup.slot_number, {
                      action_url: value || null,
                    })
                  }
                  placeholder="https://..."
                  value={popup.action_url ?? ''}
                />
              </View>
            ))}

            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => void handleSave()}
              style={({ pressed }) => [
                styles.saveButton,
                isSaving && styles.disabled,
                pressed && !isSaving && styles.pressed,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveText}>첫 팝업 설정 저장</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function PopupField({
  label,
  multiline = false,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  label: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={COLORS.placeholder}
        style={[styles.input, multiline && styles.multilineInput]}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  keyboardView: { flex: 1 },
  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  headerSide: { width: 40 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 48, gap: 16 },
  guideCard: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: COLORS.softNavy,
  },
  guideHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guideTitle: { color: COLORS.navy, fontSize: 17, fontWeight: '900' },
  guideLimit: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    color: COLORS.navy,
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: COLORS.white,
  },
  guideText: {
    marginTop: 9,
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 20,
  },
  card: {
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  cardHeader: {
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotLabel: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  slotDescription: { marginTop: 4, color: COLORS.subText, fontSize: 12 },
  field: { marginTop: 14 },
  fieldLabel: {
    marginBottom: 7,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    color: COLORS.text,
    fontSize: 14,
    backgroundColor: COLORS.white,
  },
  multilineInput: {
    minHeight: 104,
    paddingTop: 13,
    paddingBottom: 13,
    lineHeight: 21,
  },
  saveButton: {
    height: 54,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.navy,
  },
  saveText: { color: COLORS.white, fontSize: 15, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.72 },
});
