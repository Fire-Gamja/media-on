import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FormField from '../../components/common/FormField';
import PrimaryButton from '../../components/common/PrimaryButton';
import { COLORS } from '../../constants/colors';

export default function PasswordResetRequestScreen() {
  const [name, setName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [requestReason, setRequestReason] = useState('');

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);

    if (numbers.length <= 3) {
      return numbers;
    }

    if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }

    return `${numbers.slice(0, 3)}-${numbers.slice(
      3,
      7,
    )}-${numbers.slice(7)}`;
  };

  const handleStudentNumberChange = (value: string) => {
    setStudentNumber(value.replace(/\D/g, ''));
  };

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(formatPhoneNumber(value));
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const trimmedStudentNumber = studentNumber.trim();
    const phoneNumbersOnly = phoneNumber.replace(/\D/g, '');

    if (!trimmedName) {
      Alert.alert('입력 확인', '이름을 입력해 주세요.');
      return;
    }

    if (!trimmedStudentNumber) {
      Alert.alert('입력 확인', '학번을 입력해 주세요.');
      return;
    }

    if (phoneNumbersOnly.length !== 11) {
      Alert.alert(
        '입력 확인',
        '휴대전화번호 11자리를 입력해 주세요.',
      );
      return;
    }

    Alert.alert(
      '재설정 요청 완료',
      '관리자에게 비밀번호 재설정 요청이 전달되었습니다.\n확인 후 임시 비밀번호가 발급될 수 있습니다.',
      [
        {
          text: '확인',
          onPress: () => router.replace('/login'),
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="이전 화면으로 이동"
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            관리자 재설정 요청
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleArea}>
            <Text style={styles.title}>
              가입 정보를 입력해 주세요
            </Text>

            <Text style={styles.description}>
              관리자가 가입 정보를 확인한 뒤 비밀번호 재설정을
              처리합니다.
            </Text>
          </View>

          <FormField
            label="이름"
            value={name}
            onChangeText={setName}
            placeholder="이름을 입력해 주세요"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="next"
          />

          <FormField
            label="학번"
            value={studentNumber}
            onChangeText={handleStudentNumberChange}
            placeholder="학번을 입력해 주세요"
            keyboardType="number-pad"
            maxLength={20}
          />

          <FormField
            label="휴대전화번호"
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            placeholder="010-0000-0000"
            keyboardType="phone-pad"
            maxLength={13}
          />

          <View style={styles.reasonArea}>
            <FormField
              label="요청 사유"
              value={requestReason}
              onChangeText={setRequestReason}
              placeholder="휴대전화번호 변경 등 재설정이 필요한 사유를 입력해 주세요. 선택사항입니다."
              multiline
              maxLength={500}
              style={styles.reasonInput}
            />

            <Text style={styles.characterCount}>
              {requestReason.length}/500
            </Text>
          </View>

          <View style={styles.guideBox}>
            <Text style={styles.guideTitle}>
              임시 비밀번호 안내
            </Text>

            <Text style={styles.guideText}>
              관리자가 요청을 확인하면 임시 비밀번호를 발급할 수
              있습니다. 임시 비밀번호는 발급 후 1시간 동안 유효하며,
              로그인 후 반드시 새 비밀번호로 변경해야 합니다.
            </Text>
          </View>

          <PrimaryButton
            title="재설정 요청"
            onPress={handleSubmit}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    height: 58,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  backText: {
    width: 32,
    color: COLORS.navy,
    fontSize: 38,
    lineHeight: 40,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
  },
  titleArea: {
    marginBottom: 32,
  },
  title: {
    color: COLORS.text,
    fontSize: 27,
    lineHeight: 38,
    fontWeight: '800',
  },
  description: {
    marginTop: 10,
    color: COLORS.subText,
    fontSize: 14,
    lineHeight: 22,
  },
  reasonArea: {
    position: 'relative',
  },
  reasonInput: {
    paddingBottom: 38,
  },
  characterCount: {
    position: 'absolute',
    right: 14,
    bottom: 32,
    color: COLORS.subText,
    fontSize: 12,
  },
  guideBox: {
    padding: 18,
    borderRadius: 14,
    backgroundColor: COLORS.softNavy,
  },
  guideTitle: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '800',
  },
  guideText: {
    marginTop: 8,
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 21,
  },
  submitButton: {
    marginTop: 28,
  },
});