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

  const resultTitle = query.trim()
    ? `검색 결과 ${visibleQuestions.length}개`
    : selectedCategory === ALL_CATEGORIES
      ? `전체 질문 ${visibleQuestions.length}개`
      : `${selectedCategory} 관련 질문 ${visibleQuestions.length}개`;

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
        <View style={styles.searchBox}>
          <AppIcon color={COLORS.text} name="search" size={21} />
          <TextInput
            accessibilityLabel="자주 묻는 질문 검색"
            onChangeText={setQuery}
            placeholder="예: 군휴학 신청"
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
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>{resultTitle}</Text>
          <Text style={styles.resultHint}>질문을 누르면 답변이 펼쳐집니다.</Text>
        </View>

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
      accessibilityState={{ expanded: open }}
      style={({ pressed }) => [
        styles.questionCard,
        open && styles.questionCardOpen,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.questionHeader}>
        <View style={[styles.questionBadge, open && styles.questionBadgeOpen]}>
          <Text style={[styles.questionBadgeText, open && styles.questionBadgeTextOpen]}>
            Q
          </Text>
        </View>
        <View style={styles.questionTextArea}>
          <Text style={styles.questionCategory}>{item.category}</Text>
          <Text style={styles.questionText}>{item.question}</Text>
        </View>
        <Text style={[styles.chevron, open && styles.chevronOpen]}>
          {open ? '⌃' : '⌄'}
        </Text>
      </View>
      {open ? (
        <View style={styles.answerArea}>
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
    backgroundColor: COLORS.surface,
  },
  headerSide: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: COLORS.text, fontSize: 19, fontWeight: '900' },
  scrollView: { flex: 1, backgroundColor: COLORS.surface },
  content: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 52 },
  searchBox: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 15 },
  categories: { gap: 8, paddingVertical: 20 },
  categoryButton: {
    minHeight: 38,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#F0F2F7',
  },
  categorySelected: { backgroundColor: COLORS.navy },
  categoryText: { color: COLORS.subText, fontSize: 12, fontWeight: '700' },
  categoryTextSelected: { color: COLORS.white, fontWeight: '800' },
  resultHeader: { marginTop: 4, marginBottom: 12 },
  resultTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  resultHint: { marginTop: 6, color: COLORS.subText, fontSize: 12 },
  questionList: { gap: 6 },
  questionCard: {
    paddingHorizontal: 4,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF4',
    backgroundColor: COLORS.surface,
  },
  questionCardOpen: {
    marginVertical: 4,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
    borderRadius: 18,
    backgroundColor: COLORS.softNavy,
  },
  questionHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  questionBadge: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.softNavy,
  },
  questionBadgeOpen: { backgroundColor: COLORS.navy },
  questionBadgeText: { color: COLORS.navy, fontSize: 17, fontWeight: '900' },
  questionBadgeTextOpen: { color: COLORS.white },
  questionTextArea: { flex: 1 },
  questionCategory: { color: COLORS.navy, fontSize: 10, fontWeight: '800' },
  questionText: {
    marginTop: 4,
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
  },
  chevron: { color: COLORS.subText, fontSize: 21, fontWeight: '700' },
  chevronOpen: { color: COLORS.navy },
  answerArea: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(24, 35, 102, 0.12)',
  },
  answerText: { color: COLORS.text, fontSize: 14, lineHeight: 23 },
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
