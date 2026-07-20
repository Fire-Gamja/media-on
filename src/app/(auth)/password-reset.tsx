import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  navy: '#182366',
  white: '#FFFFFF',
  background: '#F7F8FC',
  border: '#D9DDEB',
  text: '#111827',
  subText: '#6B7280',
  selectedBackground: '#E9ECF8',
};

export default function PasswordResetScreen() {
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
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

        <Text style={styles.headerTitle}>비밀번호 찾기</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleArea}>
          <Text style={styles.title}>
            비밀번호 재설정 방법을{'\n'}선택해 주세요
          </Text>

          <Text style={styles.description}>
            본인 인증 또는 관리자 요청을 통해 비밀번호를
            재설정할 수 있습니다.
          </Text>
        </View>

        <View style={styles.optionList}>
          <ResetOption
            number="01"
            title="휴대전화번호로 재설정"
            description={
              '가입할 때 등록한 휴대전화번호로\n본인 인증 후 비밀번호를 변경합니다.'
            }
            onPress={() =>
              router.push('/password-reset-phone')
            }
          />

          <ResetOption
            number="02"
            title="관리자에게 재설정 요청"
            description={
              '휴대전화번호 인증이 어려운 경우\n관리자에게 초기화를 요청합니다.'
            }
            onPress={() =>
              router.push('/password-reset-request')
            }
          />
        </View>

        <View style={styles.guideBox}>
          <Text style={styles.guideTitle}>안내사항</Text>

          <Text style={styles.guideText}>
            관리자에게 재설정을 요청한 경우 확인 후 임시
            비밀번호가 발급될 수 있습니다. 임시 비밀번호는
            발급 후 1시간 동안만 사용할 수 있습니다.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

type ResetOptionProps = {
  number: string;
  title: string;
  description: string;
  onPress: () => void;
};

function ResetOption({
  number,
  title,
  description,
  onPress,
}: ResetOptionProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.optionCard,
        pressed && styles.optionCardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.optionNumber}>
        <Text style={styles.optionNumberText}>{number}</Text>
      </View>

      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>
          {description}
        </Text>
      </View>

      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 58,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 38,
  },
  titleArea: {
    marginBottom: 34,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    lineHeight: 39,
    fontWeight: '800',
  },
  description: {
    marginTop: 12,
    color: COLORS.subText,
    fontSize: 14,
    lineHeight: 22,
  },
  optionList: {
    gap: 14,
  },
  optionCard: {
    minHeight: 128,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.white,
  },
  optionCardPressed: {
    opacity: 0.78,
    backgroundColor: COLORS.selectedBackground,
  },
  optionNumber: {
    width: 48,
    height: 48,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: COLORS.selectedBackground,
  },
  optionNumberText: {
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: '800',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  optionDescription: {
    marginTop: 8,
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 20,
  },
  arrow: {
    marginLeft: 8,
    color: COLORS.navy,
    fontSize: 30,
    fontWeight: '300',
  },
  guideBox: {
    marginTop: 28,
    padding: 18,
    borderRadius: 14,
    backgroundColor: COLORS.selectedBackground,
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
});