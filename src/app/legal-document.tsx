import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlatformHeaderIcon } from '../components/common/PlatformHeaderIcon';
import { COLORS } from '../constants/colors';
import {
  DEPARTMENT_CONTACT,
  LEGAL_DOCUMENTS,
  type LegalDocumentType,
} from '../content/legal';

export default function LegalDocumentScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const type = isLegalDocumentType(params.type) ? params.type : 'privacy';
  const document = LEGAL_DOCUMENTS[type];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.headerSide}
        >
          <PlatformHeaderIcon color={COLORS.navy} name="back" />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {document.title}
        </Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        style={styles.scrollView}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.documentTitle}>{document.title}</Text>
          <Text style={styles.versionText}>
            버전 {document.version} · 시행 {document.effectiveDate}
          </Text>
          <Text style={styles.introduction}>{document.introduction}</Text>
        </View>

        {document.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs?.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
            {section.bullets?.map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <Text style={styles.bulletMark}>•</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>문의</Text>
          <Text style={styles.contactText}>{DEPARTMENT_CONTACT.address}</Text>
          <Pressable
            accessibilityRole="link"
            onPress={() =>
              void Linking.openURL(`tel:${DEPARTMENT_CONTACT.phone}`)
            }
          >
            <Text style={styles.contactLink}>
              {DEPARTMENT_CONTACT.phone}
            </Text>
          </Pressable>
          <Text style={styles.contactText}>{DEPARTMENT_CONTACT.hours}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function isLegalDocumentType(
  value: string | undefined,
): value is LegalDocumentType {
  return value === 'privacy' || value === 'terms' || value === 'ai-transfer';
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
  headerTitle: {
    maxWidth: '72%',
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
  },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 56 },
  summaryCard: {
    padding: 22,
    borderRadius: 20,
    backgroundColor: COLORS.navy,
  },
  documentTitle: { color: COLORS.white, fontSize: 21, fontWeight: '900' },
  versionText: {
    marginTop: 7,
    color: '#D9DDEF',
    fontSize: 12,
    fontWeight: '700',
  },
  introduction: {
    marginTop: 17,
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 22,
  },
  section: {
    marginTop: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  sectionTitle: {
    marginBottom: 11,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
  },
  paragraph: {
    marginBottom: 10,
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 21,
  },
  bulletRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletMark: {
    width: 18,
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: '900',
  },
  bulletText: {
    flex: 1,
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 21,
  },
  contactCard: {
    marginTop: 18,
    padding: 20,
    borderRadius: 18,
    backgroundColor: COLORS.softNavy,
  },
  contactTitle: { color: COLORS.navy, fontSize: 15, fontWeight: '900' },
  contactText: {
    marginTop: 8,
    color: COLORS.subText,
    fontSize: 12,
    lineHeight: 19,
  },
  contactLink: {
    marginTop: 8,
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
});
