import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '../../components/common/AppIcon';
import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import { COLORS } from '../../constants/colors';
import { useAppSettings } from '../../context/app-settings-context';
import {
  FREQUENTLY_ASKED_QUESTIONS,
  type FrequentlyAskedQuestion,
} from '../../content/frequently-asked-questions';
import { translate, translateFaqCategory } from '../../i18n/translations';

const ALL_CATEGORIES = '__all__';

export default function FrequentlyAskedQuestionsScreen() {
  const { language } = useAppSettings();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);

  const categories = useMemo(
    () => [
      ALL_CATEGORIES,
      ...Array.from(
        new Set(FREQUENTLY_ASKED_QUESTIONS.map((item) => item.category)),
      ),
    ],
    [],
  );
  const visibleQuestions = useMemo(() => {
    const normalizedQuery = normalize(query);

    return FREQUENTLY_ASKED_QUESTIONS.filter((item) => {
      const categoryMatches =
        selectedCategory === ALL_CATEGORIES ||
        item.category === selectedCategory;
      const queryMatches =
        !normalizedQuery ||
        [item.question, item.answer, item.category, ...(item.keywords ?? [])]
          .map(normalize)
          .some((value) => value.includes(normalizedQuery));

      return categoryMatches && queryMatches;
    });
  }, [query, selectedCategory]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityLabel={translate(language, 'common.back')}
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.headerSide}
        >
          <PlatformHeaderIcon color={COLORS.navy} name="back" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {translate(language, 'faq.title')}
        </Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
      >
        <View style={styles.searchBox}>
          <AppIcon color="#9EADC6" name="search" size={18} />
          <TextInput
            accessibilityLabel="자주 묻는 질문 검색"
            onChangeText={setQuery}
            placeholder={translate(language, 'faq.searchPlaceholder')}
            placeholderTextColor={COLORS.placeholder}
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.categories}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {categories.map((category) => {
            const selected = selectedCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[styles.categoryButton, selected && styles.categorySelected]}
              >
                <Text
                  style={[styles.categoryText, selected && styles.categoryTextSelected]}
                >
                  {category === ALL_CATEGORIES
                    ? translate(language, 'faq.all')
                    : translateFaqCategory(language, category)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {visibleQuestions.length > 0 ? (
          <View style={styles.questionList}>
            {visibleQuestions.map((item) => (
              <QuestionItem
                key={item.id}
                item={item}
                language={language}
                onPress={() =>
                  setOpenQuestionId((current) =>
                    current === item.id ? null : item.id,
                  )
                }
                open={openQuestionId === item.id}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <AppIcon color={COLORS.placeholder} name="faq" size={42} />
            <Text style={styles.emptyTitle}>
              {FREQUENTLY_ASKED_QUESTIONS.length === 0
                ? translate(language, 'faq.preparing')
                : translate(language, 'faq.noResults')}
            </Text>
            <Text style={styles.emptyDescription}>
              {FREQUENTLY_ASKED_QUESTIONS.length === 0
                ? translate(language, 'faq.preparingDescription')
                : translate(language, 'faq.noResultsDescription')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function QuestionItem({
  item,
  language,
  onPress,
  open,
}: {
  item: FrequentlyAskedQuestion;
  language: ReturnType<typeof useAppSettings>['language'];
  onPress: () => void;
  open: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      accessibilityState={{ expanded: open }}
      style={({ pressed }) => [
        styles.questionCard,
        open && styles.questionCardOpen,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.questionHeader}>
        <Text style={styles.questionBadgeText}>Q</Text>
        <View style={styles.questionTextArea}>
          <Text style={styles.questionCategory}>
            {translateFaqCategory(language, item.category)}
          </Text>
          <Text style={styles.questionText}>{item.question}</Text>
        </View>
        <Text style={styles.chevron}>{open ? '⌃' : '⌄'}</Text>
      </View>
      {open ? (
        <View style={styles.answerArea}>
          <Text style={styles.answerBadge}>A</Text>
          <View style={styles.answerContent}>
            <Text style={styles.answerText}>{item.answer}</Text>
            {item.links?.map((link) => (
              <Pressable
                key={link.url}
                accessibilityRole="link"
                onPress={(event) => {
                  event.stopPropagation();
                  void Linking.openURL(link.url);
                }}
                style={({ pressed }) => [
                  styles.linkButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.linkText}>{link.label}</Text>
                <Text style={styles.linkArrow}>›</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

function normalize(value: string) {
  return value.toLocaleLowerCase('ko-KR').replace(/[\s?.!,~_-]/g, '');
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    height: 56,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: COLORS.surface,
  },
  headerSide: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  scrollView: { flex: 1, backgroundColor: COLORS.surface },
  content: { paddingHorizontal: 15, paddingTop: 18, paddingBottom: 52 },
  searchBox: {
    height: 44,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
  },
  categories: { gap: 8, paddingVertical: 16 },
  categoryButton: {
    minHeight: 31,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F1F3F7',
  },
  categorySelected: { backgroundColor: '#3550FF' },
  categoryText: {
    color: '#667085',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 12,
  },
  categoryTextSelected: { color: COLORS.white, fontWeight: '800' },
  questionList: { marginTop: 4 },
  questionCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDF0F4',
    backgroundColor: COLORS.surface,
  },
  questionCardOpen: { backgroundColor: COLORS.surface },
  questionHeader: {
    minHeight: 62,
    paddingHorizontal: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  questionBadgeText: {
    width: 14,
    color: COLORS.navy,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 13,
  },
  questionTextArea: { flex: 1 },
  questionCategory: {
    color: '#667085',
    fontFamily: 'FreesentationRegular',
    fontSize: 10,
  },
  questionText: {
    marginTop: 4,
    color: COLORS.text,
    fontFamily: 'FreesentationSemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  chevron: { color: COLORS.navy, fontSize: 15, fontWeight: '700' },
  answerArea: {
    paddingHorizontal: 8,
    paddingVertical: 18,
    flexDirection: 'row',
    gap: 13,
    backgroundColor: '#F7F7F7',
  },
  answerBadge: {
    width: 14,
    color: COLORS.navy,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 13,
  },
  answerContent: { flex: 1 },
  answerText: {
    color: COLORS.text,
    fontFamily: 'FreesentationRegular',
    fontSize: 13,
    lineHeight: 20,
  },
  linkButton: {
    minHeight: 48,
    marginTop: 14,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 13,
    backgroundColor: COLORS.surface,
  },
  linkText: { flex: 1, color: COLORS.navy, fontSize: 13, fontWeight: '800' },
  linkArrow: { marginLeft: 10, color: COLORS.navy, fontSize: 24 },
  emptyCard: {
    minHeight: 240,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.background,
  },
  emptyTitle: {
    marginTop: 16,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyDescription: {
    marginTop: 8,
    color: COLORS.subText,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  pressed: { opacity: 0.7 },
});
