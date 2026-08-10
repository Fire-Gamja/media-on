import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppSettings } from '../../context/app-settings-context';
import { translate, type TranslationKey } from '../../i18n/translations';

export type StudentTabId =
  | 'home'
  | 'notices'
  | 'applications'
  | 'timetable'
  | 'my';

export const STUDENT_BOTTOM_NAV_HEIGHT = 64;

const TABS: ReadonlyArray<{
  id: StudentTabId;
  labelKey: TranslationKey;
  route: '/home' | '/notices' | '/applications' | '/timetable' | '/profile';
  icon: number;
}> = [
  {
    id: 'home',
    labelKey: 'nav.home',
    route: '/home',
    icon: require('../../../assets/figma/student-v2/bottom-home.svg'),
  },
  {
    id: 'notices',
    labelKey: 'nav.notices',
    route: '/notices',
    icon: require('../../../assets/figma/student-v2/bottom-notice.svg'),
  },
  {
    id: 'applications',
    labelKey: 'nav.applications',
    route: '/applications',
    icon: require('../../../assets/figma/student-v2/bottom-applications.svg'),
  },
  {
    id: 'timetable',
    labelKey: 'nav.timetable',
    route: '/timetable',
    icon: require('../../../assets/figma/student-v2/bottom-timetable.svg'),
  },
  {
    id: 'my',
    labelKey: 'nav.my',
    route: '/profile',
    icon: require('../../../assets/figma/student-v2/my.svg'),
  },
];

export function StudentBottomNavigation({ activeTab }: { activeTab: StudentTabId }) {
  const { language } = useAppSettings();

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {TABS.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => {
                if (selected) return;
                if (tab.id === 'my') {
                  router.replace({ pathname: tab.route, params: { fromTab: '1' } });
                } else {
                  router.replace(tab.route);
                }
              }}
              style={({ pressed }) => [
                styles.tab,
                pressed && styles.pressed,
              ]}
            >
              <Image
                contentFit="contain"
                source={tab.icon}
                style={[
                  styles.icon,
                  { tintColor: selected ? '#3550FF' : '#6B7280' },
                ]}
              />
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {translate(language, tab.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    borderTopWidth: 1,
    borderTopColor: '#EAECEF',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  tabs: {
    height: STUDENT_BOTTOM_NAV_HEIGHT,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tab: {
    flex: 1,
    minWidth: 52,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  icon: { width: 22, height: 22 },
  label: {
    color: '#6B7280',
    fontFamily: 'FreesentationRegular',
    fontSize: 11,
  },
  labelSelected: {
    color: '#3550FF',
    fontFamily: 'FreesentationExtraBold',
  },
  pressed: { opacity: 0.62 },
});
