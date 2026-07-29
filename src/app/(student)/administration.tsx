import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import { COLORS } from '../../constants/colors';
import { ADMINISTRATION_CONTENT } from '../../content/administration-guides';

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
        <Text style={styles.headerTitle}>
          {ADMINISTRATION_CONTENT.pageTitle}
        </Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        style={styles.scrollView}
      >
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>
            {ADMINISTRATION_CONTENT.introTitle}
          </Text>
          <Text style={styles.guideText}>
            {ADMINISTRATION_CONTENT.introBody}
          </Text>
        </View>

        {ADMINISTRATION_CONTENT.guides.map((guide, index) => (
          <View key={guide.title} style={styles.card}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>{index + 1}</Text>
            </View>
            <View style={styles.textArea}>
              <Text style={styles.cardTitle}>{guide.title}</Text>
              <Text style={styles.cardBody}>{guide.body}</Text>
              {guide.linkUrl ? (
                <Pressable
                  accessibilityRole="link"
                  onPress={() =>
                    void openAdministrationLink(guide.linkUrl as string)
                  }
                  style={({ pressed }) => [
                    styles.linkButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.linkText}>{guide.linkLabel}</Text>
                  <Text style={styles.linkChevron}>›</Text>
                </Pressable>
              ) : null}
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

async function openAdministrationLink(url: string) {
  try {
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      throw new Error('unsupported');
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert('링크 열기 실패', '등록된 주소를 다시 확인해 주세요.');
  }
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
  linkButton: {
    minHeight: 42,
    marginTop: 13,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 11,
    backgroundColor: COLORS.softNavy,
  },
  linkText: { color: COLORS.navy, fontSize: 13, fontWeight: '800' },
  linkChevron: { color: COLORS.navy, fontSize: 21, lineHeight: 24 },
  inquiryButton: {
    height: 54,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.navy,
  },
  inquiryText: { color: COLORS.white, fontSize: 15, fontWeight: '900' },
  pressed: { opacity: 0.72 },
});
