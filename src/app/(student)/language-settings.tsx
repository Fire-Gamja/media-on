import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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

import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import { COLORS } from '../../constants/colors';
import { useAppSettings } from '../../context/app-settings-context';
import {
  type AppLanguage,
  LANGUAGE_OPTIONS,
  translate,
} from '../../i18n/translations';

export default function LanguageSettingsScreen() {
  const { language, setLanguage } = useAppSettings();
  const [pendingLanguage, setPendingLanguage] =
    useState<AppLanguage>(language);
  const [isSaving, setIsSaving] = useState(false);

  const applyLanguage = async () => {
    try {
      setIsSaving(true);
      await setLanguage(pendingLanguage);
      Alert.alert(
        translate(pendingLanguage, 'language.changedTitle'),
        translate(pendingLanguage, 'language.changedMessage'),
        [
          {
            text: translate(pendingLanguage, 'pre.ok'),
            onPress: () => router.back(),
          },
        ],
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.panel}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel={translate(pendingLanguage, 'common.back')}
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}
            style={styles.headerSide}
          >
            <PlatformHeaderIcon color={COLORS.text} name="back" />
          </Pressable>
          <Text style={styles.headerTitle}>
            {translate(pendingLanguage, 'language.title')}
          </Text>
          <View style={styles.headerSide} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.description}>
            {translate(pendingLanguage, 'language.prompt')}
          </Text>

          <View style={styles.languageList}>
            {LANGUAGE_OPTIONS.map((option) => {
              const selected = option.code === pendingLanguage;
              return (
                <Pressable
                  key={option.code}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => setPendingLanguage(option.code)}
                  style={({ pressed }) => [
                    styles.languageRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.languageText}>
                    <Text style={styles.nativeLabel}>{option.nativeLabel}</Text>
                    <Text style={styles.koreanLabel}>{option.koreanLabel}</Text>
                  </View>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => void applyLanguage()}
            style={({ pressed }) => [
              styles.applyButton,
              isSaving && styles.applyButtonDisabled,
              pressed && !isSaving && styles.pressed,
            ]}
          >
            {isSaving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.applyText}>
                {translate(pendingLanguage, 'language.apply')}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  panel: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    height: 56,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerSide: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: COLORS.text,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 20,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 26,
    paddingBottom: 32,
  },
  description: {
    color: '#666666',
    fontFamily: 'FreesentationRegular',
    fontSize: 16,
    lineHeight: 23,
  },
  languageList: {
    marginTop: 22,
  },
  languageRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  languageText: {
    flex: 1,
  },
  nativeLabel: {
    color: '#171717',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 16,
  },
  koreanLabel: {
    marginTop: 4,
    color: '#8A8A8A',
    fontFamily: 'FreesentationRegular',
    fontSize: 13,
  },
  radio: {
    width: 22,
    height: 22,
    marginLeft: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    borderRadius: 11,
  },
  radioSelected: {
    borderColor: COLORS.navy,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.navy,
  },
  applyButton: {
    height: 52,
    marginTop: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#3550FF',
  },
  applyButtonDisabled: {
    opacity: 0.55,
  },
  applyText: {
    color: COLORS.white,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 16,
  },
  pressed: {
    opacity: 0.7,
  },
});
