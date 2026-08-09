import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

const icons = {
  logo: require('../../../assets/figma/student-v2/logo.svg'),
  bell: require('../../../assets/figma/student-v2/bell.svg'),
  search: require('../../../assets/figma/student-v2/search.svg'),
  settings: require('../../../assets/figma/student-v2/settings.svg'),
} as const;

export function StudentTopBar() {
  return (
    <View style={styles.header}>
      <Image accessibilityLabel="MEDIA ON" contentFit="contain" source={icons.logo} style={styles.logo} />
      <View style={styles.actions}>
        <HeaderButton label="알림" onPress={() => router.push('/notifications')} source={icons.bell} />
        <HeaderButton label="기능 검색" onPress={() => router.push('/feature-search')} source={icons.search} />
        <HeaderButton label="설정" onPress={() => router.push('/settings')} source={icons.settings} />
      </View>
    </View>
  );
}

function HeaderButton({ label, onPress, source }: { label: string; onPress: () => void; source: number }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={7}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Image contentFit="contain" source={source} style={styles.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EAECEF',
    backgroundColor: '#FFFFFF',
  },
  logo: { width: 24, height: 24 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  button: { width: 24, height: 36, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 22, height: 22 },
  pressed: { opacity: 0.62 },
});
