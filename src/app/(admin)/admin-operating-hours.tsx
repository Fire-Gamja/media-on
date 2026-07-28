import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TimeSelectField } from '../../components/common/TimeSelectField';
import { COLORS } from '../../constants/colors';
import { getAuthErrorMessage } from '../../services/auth';
import {
  getOperatingHoursSettings,
  type OperatingMode,
  updateOperatingHoursSettings,
} from '../../services/operating-hours';

const TIME_OPTIONS = createTimeOptions();

export default function AdminOperatingHoursScreen() {
  const [mode, setMode] = useState<OperatingMode>('vacation');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const settings = await getOperatingHoursSettings();
      setMode(settings.mode);
      setStartTime(settings.start_time.slice(0, 5));
      setEndTime(settings.end_time.slice(0, 5));
    } catch (error) {
      Alert.alert('조회 실패', getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSettings();
    }, [loadSettings]),
  );

  const handleSave = async () => {
    if (endTime <= startTime) {
      Alert.alert(
        '시간 확인',
        '종료 시간은 시작 시간보다 늦어야 합니다.',
      );
      return;
    }

    try {
      setIsSaving(true);
      await updateOperatingHoursSettings({
        mode,
        startTime,
        endTime,
      });
      Alert.alert(
        '저장 완료',
        '학생 홈의 운영시간이 변경되었습니다.',
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
        <Text style={styles.headerTitle}>운영시간 설정</Text>
        <View style={styles.headerSide} />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.navy} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          style={styles.scrollView}
        >
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>학생 홈 운영시간</Text>
            <Text style={styles.guideText}>
              저장 즉시 학생 홈 하단 안내에 반영됩니다.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>운영 구분</Text>
            <View style={styles.modeRow}>
              <ModeButton
                isSelected={mode === 'vacation'}
                label="방학 중"
                onPress={() => setMode('vacation')}
              />
              <ModeButton
                isSelected={mode === 'semester'}
                label="학기 중"
                onPress={() => setMode('semester')}
              />
            </View>
            <Text style={styles.previewLabel}>학생 화면 표시 제목</Text>
            <Text style={styles.previewTitle}>
              {mode === 'vacation' ? '방학 중 운영시간' : '운영 시간'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>운영 시간</Text>
            <View style={styles.timeRow}>
              <TimeSelectField
                label="시작 시간"
                onChange={(value) => {
                  setStartTime(value);
                  if (endTime <= value) {
                    setEndTime(getNextTime(value));
                  }
                }}
                options={TIME_OPTIONS.slice(0, -1)}
                value={startTime}
              />
              <TimeSelectField
                label="종료 시간"
                onChange={setEndTime}
                options={TIME_OPTIONS.filter((value) => value > startTime)}
                value={endTime}
              />
            </View>
            <Text style={styles.closedNote}>
              주말 및 공휴일 휴무 문구는 공통으로 표시됩니다.
            </Text>
          </View>

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
              <Text style={styles.saveText}>운영시간 저장</Text>
            )}
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ModeButton({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={[
        styles.modeButton,
        isSelected && styles.modeButtonSelected,
      ]}
    >
      <Text
        style={[
          styles.modeText,
          isSelected && styles.modeTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function createTimeOptions() {
  return Array.from({ length: 48 }, (_, index) => {
    const hour = Math.floor(index / 2);
    const minute = index % 2 === 0 ? '00' : '30';
    return `${String(hour).padStart(2, '0')}:${minute}`;
  });
}

function getNextTime(value: string) {
  const index = TIME_OPTIONS.indexOf(value);
  return TIME_OPTIONS[Math.min(index + 1, TIME_OPTIONS.length - 1)];
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backText: {
    width: 40,
    color: COLORS.navy,
    fontSize: 38,
    lineHeight: 40,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSide: {
    width: 40,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 44,
  },
  guideCard: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: COLORS.navy,
  },
  guideTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  guideText: {
    marginTop: 8,
    color: '#D9DDEF',
    fontSize: 13,
    lineHeight: 20,
  },
  card: {
    marginTop: 16,
    padding: 20,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  modeRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
  },
  modeButtonSelected: {
    borderColor: COLORS.navy,
    backgroundColor: COLORS.softNavy,
  },
  modeText: {
    color: COLORS.subText,
    fontSize: 14,
    fontWeight: '800',
  },
  modeTextSelected: {
    color: COLORS.navy,
  },
  previewLabel: {
    marginTop: 20,
    color: COLORS.subText,
    fontSize: 12,
    fontWeight: '700',
  },
  previewTitle: {
    marginTop: 6,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  timeRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  closedNote: {
    marginTop: 14,
    color: COLORS.subText,
    fontSize: 12,
    lineHeight: 18,
  },
  saveButton: {
    height: 56,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.navy,
  },
  saveText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.68,
  },
});
