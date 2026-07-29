import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import { COLORS } from '../../constants/colors';

const ADMINISTRATION_GUIDES = [
  {
    title: '휴학·복학 신청 방법',
    body:
      '통합정보시스템에 로그인한 뒤 학적관리 메뉴에서 휴학 또는 복학을 신청해 주세요. 신청 기간과 제출 서류는 학부 공지사항을 먼저 확인하고, 군휴학·질병휴학 등 증빙이 필요한 경우 행정조교에게 문의해 주세요.',
  },
  {
    title: '학과 일정',
    body:
      '수강신청, 휴·복학, 공결, 졸업전시회와 비교과 프로그램 일정을 안내하는 영역입니다. 현재는 임시 문구이며, 확정된 학사 일정을 입력해 주세요.',
  },
  {
    title: '공결 신청 안내',
    body:
      '공결 사유에 맞는 증빙서류를 준비한 뒤 통합정보시스템에서 신청해 주세요. 승인 여부와 추가 제출 서류는 행정조교에게 확인할 수 있습니다.',
  },
  {
    title: '졸업·수강 문의',
    body:
      '졸업학점, 전공필수, 복수·부전공 및 수강 관련 확인이 필요하면 학번과 문의 내용을 정리해 조교 문의로 보내 주세요.',
  },
];

export default function AdministrationScreen() {
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
          <PlatformHeaderIcon name="back" />
        </Pressable>
        <Text style={styles.headerTitle}>행정 업무</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        style={styles.scrollView}
      >
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>학부 행정 안내</Text>
          <Text style={styles.guideText}>
            자주 찾는 학사 절차와 일정을 한곳에서 확인하세요.
          </Text>
        </View>

        {ADMINISTRATION_GUIDES.map((guide, index) => (
          <View key={guide.title} style={styles.card}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>{index + 1}</Text>
            </View>
            <View style={styles.textArea}>
              <Text style={styles.cardTitle}>{guide.title}</Text>
              <Text style={styles.cardBody}>{guide.body}</Text>
            </View>
          </View>
        ))}

        <Pressable
          onPress={() => router.push('/assistant-inquiry')}
          style={styles.inquiryButton}
        >
          <Text style={styles.inquiryText}>추가 문의하기</Text>
        </Pressable>
      </ScrollView>
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
  headerTitle: { color: COLORS.text, fontSize: 19, fontWeight: '900' },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 48, gap: 13 },
  guideCard: {
    marginBottom: 3,
    padding: 19,
    borderRadius: 18,
    backgroundColor: COLORS.navy,
  },
  guideTitle: { color: COLORS.white, fontSize: 18, fontWeight: '900' },
  guideText: { marginTop: 7, color: '#D9DDEF', fontSize: 12 },
  card: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
  },
  numberBadge: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: COLORS.softNavy,
  },
  numberText: { color: COLORS.navy, fontSize: 13, fontWeight: '900' },
  textArea: { flex: 1 },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  cardBody: {
    marginTop: 8,
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 21,
  },
  inquiryButton: {
    height: 54,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.navy,
  },
  inquiryText: { color: COLORS.white, fontSize: 15, fontWeight: '900' },
});
