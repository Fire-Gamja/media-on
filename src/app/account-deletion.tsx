import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlatformHeaderIcon } from '../components/common/PlatformHeaderIcon';
import { COLORS } from '../constants/colors';
import { DEPARTMENT_CONTACT } from '../content/legal';
import {
  getAuthErrorMessage,
  getCurrentProfile,
  type StudentProfile,
} from '../services/auth';
import { deleteCurrentAccount } from '../services/legal';

export default function AccountDeletionScreen() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const canDelete =
    profile?.role === 'student' &&
    confirmation.trim() === profile.student_number &&
    !isDeleting;

  useEffect(() => {
    void getCurrentProfile()
      .then(setProfile)
      .catch((error) => {
        Alert.alert('정보 확인 실패', getAuthErrorMessage(error));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const confirmDeletion = () => {
    if (!canDelete) {
      return;
    }

    Alert.alert(
      '계정과 데이터를 삭제할까요?',
      '삭제를 완료하면 계정, 신청, 신고, 문의, 채팅, 검색, 알림 및 프로필 사진을 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '영구 삭제',
          style: 'destructive',
          onPress: () => void handleDeletion(),
        },
      ],
    );
  };

  const handleDeletion = async () => {
    try {
      setIsDeleting(true);
      await deleteCurrentAccount();
      Alert.alert(
        '계정 삭제 완료',
        'MEDIA ON 계정과 연결 데이터가 삭제되었습니다.',
        [{ text: '확인', onPress: () => router.replace('/') }],
      );
    } catch (error) {
      setIsDeleting(false);
      Alert.alert('계정 삭제 실패', getAuthErrorMessage(error));
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
        <Text style={styles.headerTitle}>계정 및 데이터 삭제</Text>
        <View style={styles.headerSide} />
      </View>

      {isLoading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={COLORS.navy} size="large" />
          <Text style={styles.stateText}>계정 정보를 확인하고 있어요.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>삭제 전에 확인해 주세요</Text>
            <Text style={styles.warningText}>
              계정을 삭제하면 아래 정보가 함께 삭제되며 복구할 수 없습니다.
            </Text>
            {[
              '이름·학번·학적·연락처와 프로필 사진',
              '기자재·실습실 신청과 시설 신고',
              '조교 문의·상담 메시지와 비밀번호 재설정 요청',
              '기능 검색, 앱 알림, 푸시 기기 정보와 약관 기록',
            ].map((item) => (
              <View key={item} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>

          {profile?.role === 'admin' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>관리자 계정</Text>
              <Text style={styles.cardText}>
                관리자 계정은 공지와 처리 기록의 책임 관계를 확인해야 하므로 앱에서
                직접 삭제할 수 없습니다. 마스터 관리자 또는 학부 앱 운영 담당자에게
                요청해 주세요.
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>본인 확인</Text>
              <Text style={styles.cardText}>
                계정 삭제를 계속하려면 본인의 학번을 입력해 주세요.
              </Text>
              <TextInput
                accessibilityLabel="계정 삭제 확인용 학번"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isDeleting}
                keyboardType="number-pad"
                maxLength={20}
                onChangeText={(value) =>
                  setConfirmation(value.replace(/\D/g, ''))
                }
                placeholder="학번 입력"
                placeholderTextColor={COLORS.placeholder}
                style={styles.input}
                value={confirmation}
              />
              <Pressable
                accessibilityRole="button"
                disabled={!canDelete}
                onPress={confirmDeletion}
                style={({ pressed }) => [
                  styles.deleteButton,
                  !canDelete && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                {isDeleting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.deleteText}>계정과 데이터 영구 삭제</Text>
                )}
              </Pressable>
            </View>
          )}

          <View style={styles.supportCard}>
            <Text style={styles.supportTitle}>앱을 사용할 수 없나요?</Text>
            <Text style={styles.supportText}>
              앱에 로그인할 수 없는 경우 학부 사무실로 계정 삭제를 요청할 수
              있습니다. 본인 확인 후 처리합니다.
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() =>
                void Linking.openURL(`tel:${DEPARTMENT_CONTACT.phone}`)
              }
            >
              <Text style={styles.phone}>{DEPARTMENT_CONTACT.phone}</Text>
            </Pressable>
            <Text style={styles.hours}>{DEPARTMENT_CONTACT.hours}</Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
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
  },
  headerSide: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  stateBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  stateText: { marginTop: 14, color: COLORS.subText, fontSize: 14 },
  content: { padding: 20, paddingBottom: 56, backgroundColor: COLORS.background },
  warningCard: {
    padding: 21,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 19,
    backgroundColor: '#FFF7F7',
  },
  warningTitle: { color: '#991B1B', fontSize: 18, fontWeight: '900' },
  warningText: {
    marginTop: 9,
    marginBottom: 12,
    color: '#7F1D1D',
    fontSize: 13,
    lineHeight: 20,
  },
  bulletRow: { marginTop: 7, flexDirection: 'row' },
  bullet: { width: 18, color: '#B91C1C', fontWeight: '900' },
  bulletText: { flex: 1, color: '#7F1D1D', fontSize: 12, lineHeight: 19 },
  card: {
    marginTop: 16,
    padding: 21,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
  },
  cardTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  cardText: {
    marginTop: 9,
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 21,
  },
  input: {
    height: 54,
    marginTop: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    color: COLORS.text,
    fontSize: 16,
    backgroundColor: COLORS.background,
  },
  deleteButton: {
    minHeight: 52,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#B91C1C',
  },
  deleteText: { color: COLORS.white, fontSize: 15, fontWeight: '900' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.72 },
  supportCard: {
    marginTop: 16,
    padding: 21,
    borderRadius: 19,
    backgroundColor: COLORS.softNavy,
  },
  supportTitle: { color: COLORS.navy, fontSize: 16, fontWeight: '900' },
  supportText: {
    marginTop: 8,
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 21,
  },
  phone: {
    marginTop: 13,
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  hours: { marginTop: 6, color: COLORS.subText, fontSize: 12 },
});
