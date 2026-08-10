import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StudentBottomNavigation } from '../../components/student/StudentBottomNavigation';
import { StudentTopBar } from '../../components/student/StudentTopBar';
import { useAppSettings } from '../../context/app-settings-context';
import { translate, type TranslationKey } from '../../i18n/translations';

const icons = {
  equipment: require('../../../assets/figma/student-v2/tool.svg'),
  room: require('../../../assets/figma/student-v2/monitor.svg'),
  report: require('../../../assets/figma/student-v2/toolbox.svg'),
  graduation: require('../../../assets/figma/student-v2/book-open.svg'),
  notice: require('../../../assets/figma/student-v2/notice-banner-icon.svg'),
} as const;

const APPLICATIONS: ReadonlyArray<{
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  route: '/equipment' | '/rooms' | '/facility-report' | '/pre-graduation';
  icon: number;
}> = [
  { titleKey: 'home.equipment', descriptionKey: 'applications.equipmentDescription', route: '/equipment', icon: icons.equipment },
  { titleKey: 'home.room', descriptionKey: 'applications.roomDescription', route: '/rooms', icon: icons.room },
  { titleKey: 'home.report', descriptionKey: 'applications.reportDescription', route: '/facility-report', icon: icons.report },
  { titleKey: 'home.preGraduation', descriptionKey: 'applications.preDescription', route: '/pre-graduation', icon: icons.graduation },
];

export default function ApplicationsScreen() {
  const { language } = useAppSettings();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <StudentTopBar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Image contentFit="contain" source={icons.notice} style={styles.bannerIconImage} />
          </View>
          <View style={styles.bannerTextArea}>
            <Text style={styles.bannerTitle}>{translate(language, 'applications.bannerTitle')}</Text>
            <Text style={styles.bannerDescription}>{translate(language, 'applications.bannerDescription')}</Text>
          </View>
        </View>

        <Text style={styles.heading}>{translate(language, 'applications.heading')}</Text>
        <View style={styles.grid}>
          {APPLICATIONS.map((item) => (
            <Pressable
              key={item.route}
              accessibilityRole="button"
              onPress={() => router.push(item.route)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.cardIcon}>
                <Image contentFit="contain" source={item.icon} style={styles.cardIconImage} />
              </View>
              <Text style={styles.cardTitle}>{translate(language, item.titleKey)}</Text>
              <Text style={styles.cardDescription}>{translate(language, item.descriptionKey)}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.hoursCard}>
          <Text style={styles.hoursTitle}>{translate(language, 'applications.hoursTitle')}</Text>
          <Text style={styles.hoursText}>{translate(language, 'applications.hoursText')}</Text>
        </View>
      </ScrollView>
      <StudentBottomNavigation activeTab="applications" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FEFEFF' },
  content: { padding: 16, paddingBottom: 36 },
  banner: {
    minHeight: 84,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
  },
  bannerIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#3550FF' },
  bannerIconImage: { width: 22, height: 22, tintColor: '#FFFFFF' },
  bannerTextArea: { flex: 1, marginLeft: 13 },
  bannerTitle: { color: '#1E2024', fontFamily: 'FreesentationExtraBold', fontSize: 16 },
  bannerDescription: { marginTop: 5, color: '#626874', fontFamily: 'FreesentationRegular', fontSize: 12, lineHeight: 17 },
  heading: { marginTop: 26, marginBottom: 14, color: '#1E2024', fontFamily: 'FreesentationExtraBold', fontSize: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '48%',
    minHeight: 178,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  cardIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#F4F6FF' },
  cardIconImage: { width: 24, height: 24 },
  cardTitle: { marginTop: 15, color: '#1E2024', fontFamily: 'FreesentationExtraBold', fontSize: 16 },
  cardDescription: { marginTop: 5, paddingRight: 10, color: '#8B919D', fontFamily: 'FreesentationRegular', fontSize: 11, lineHeight: 16 },
  chevron: { position: 'absolute', right: 15, bottom: 11, color: '#A4A9B3', fontSize: 24 },
  hoursCard: { marginTop: 22, padding: 17, borderRadius: 16, backgroundColor: '#F5F6FA' },
  hoursTitle: { color: '#1E2024', fontFamily: 'FreesentationExtraBold', fontSize: 14 },
  hoursText: { marginTop: 6, color: '#646A76', fontFamily: 'FreesentationRegular', fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.64 },
});
