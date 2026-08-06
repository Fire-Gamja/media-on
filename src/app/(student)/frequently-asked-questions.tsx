import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
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
import {
  FREQUENTLY_ASKED_QUESTIONS,
  type FrequentlyAskedQuestion,
} from '../../content/frequently-asked-questions';

const ALL_CATEGORIES = '전체';

export default function FrequentlyAskedQuestionsScreen() {
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
          accessibilityLabel="뒤로 가기"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.headerSide}
        >
          <PlatformHeaderIcon color={COLORS.navy} name="back" />
        </Pressable>
        <Text style={styles.headerTitle}>자주 묻는 질문</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
      >
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <AppIcon name="faq" size={30} />
          </View>
          <View style={styles.introTextArea}>
            <Text style={styles.introTitle}>궁금한 내용을 찾아보세요.</Text>
            <Text style={styles.introDescription}>
              질문을 검색하거나 카테고리별로 빠르게 확인할 수 있습니다.
            </Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <AppIcon color={COLORS.subText} name="search" size={20} />
          <TextInput
            onChangeText={setQuery}
            placeholder="질문 검색"
            placeholderTextColor={COLORS.placeholder}
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
                  {category}
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
                ? '자주 묻는 질문을 준비 중입니다.'
                : '검색 결과가 없습니다.'}
            </Text>
            <Text style={styles.emptyDescription}>
              {FREQUENTLY_ASKED_QUESTIONS.length === 0
                ? '질문과 답변이 확정되면 이곳에서 바로 확인할 수 있습니다.'
                : '다른 검색어나 카테고리를 선택해 주세요.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function QuestionItem({
  item,
  onPress,
  open,
}: {
  item: FrequentlyAskedQuestion;
  onPress: () => void;
  open: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.questionCard, pressed && styles.pressed]}
    >
      <View style={styles.questionHeader}>
        <View style={styles.questionTextArea}>
          <Text style={styles.questionCategory}>{item.category}</Text>
          <Text style={styles.questionText}>Q. {item.question}</Text>
        </View>
        <Text style={styles.chevron}>{open ? '−' : '+'}</Text>
      </View>
      {open ? (
        <View style={styles.answerArea}>
          <Text style={styles.answerText}>{item.answer}</Text>
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
  headerTitle: { color: COLORS.text, fontSize: 19, fontWeight: '900' },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 48 },
  introCard: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.navy,
  },
  introIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: COLORS.white,
  },
  introTextArea: { flex: 1, marginLeft: 14 },
  introTitle: { color: COLORS.white, fontSize: 16, fontWeight: '900' },
  introDescription: {
    marginTop: 6,
    color: '#D9DDEF',
    fontSize: 12,
    lineHeight: 18,
  },
  searchBox: {
    height: 52,
    marginTop: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
  categories: { gap: 8, paddingVertical: 16 },
  categoryButton: {
    minHeight: 38,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
  },
  categorySelected: { borderColor: COLORS.navy, backgroundColor: COLORS.navy },
  categoryText: { color: COLORS.subText, fontSize: 12, fontWeight: '700' },
  categoryTextSelected: { color: COLORS.white, fontWeight: '800' },
  questionList: { gap: 10 },
  questionCard: {
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  questionHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  questionTextArea: { flex: 1 },
  questionCategory: { color: COLORS.navy, fontSize: 11, fontWeight: '800' },
  questionText: {
    marginTop: 6,
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
  },
  chevron: { color: COLORS.navy, fontSize: 23, fontWeight: '600' },
  answerArea: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  answerText: { color: COLORS.subText, fontSize: 14, lineHeight: 22 },
  emptyCard: {
    minHeight: 240,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
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
