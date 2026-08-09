import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import { COLORS } from '../../constants/colors';
import { confirmRoomRequestNavigation } from '../../lib/room-request-confirmation';
import {
  type FeatureSearchItem,
  logFeatureSearch,
  searchFeatures,
} from '../../services/feature-search';

const searchIcon = require('../../../assets/figma/student/search.png');
const RECOMMENDED_SEARCHES = [
  '공지',
  '복학',
  '학부 소식',
  '대여',
  '장비',
  '고장',
  '휴학',
  '기자재',
  '실습실',
  '카메라',
] as const;

export default function FeatureSearchScreen() {
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();
  const results = useMemo(
    () => (trimmedQuery ? searchFeatures(trimmedQuery) : []),
    [trimmedQuery],
  );

  const handleSelect = (item: FeatureSearchItem) => {
    void logFeatureSearch(trimmedQuery || item.title, item.id);

    if (item.route === '/rooms') {
      confirmRoomRequestNavigation(() => router.push('/rooms'));
      return;
    }

    router.push(item.route);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <PlatformHeaderIcon name="back" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>무엇을{`\n`}찾고 계신가요?</Text>

        <View style={styles.searchRow}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            onSubmitEditing={() => void logFeatureSearch(trimmedQuery)}
            placeholder="검색어를 입력하세요."
            placeholderTextColor="#A8A8A8"
            returnKeyType="search"
            style={styles.input}
            value={query}
          />
          <Image source={searchIcon} style={styles.searchIcon} />
        </View>

        {!trimmedQuery ? (
          <>
            <Text style={styles.guide}>
              “휴학을 하고 싶은데 어떻게 하지?”처럼 문장으로 검색해도 돼요.
            </Text>
            <Text style={styles.sectionTitle}>추천 검색어</Text>
            <View style={styles.chipList}>
              {RECOMMENDED_SEARCHES.map((keyword) => (
                <Pressable
                  key={keyword}
                  accessibilityRole="button"
                  onPress={() => setQuery(keyword)}
                  style={({ pressed }) => [
                    styles.chip,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.chipText}>{keyword}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>검색 결과</Text>
            {results.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>검색 결과가 없습니다.</Text>
                <Text style={styles.emptyText}>
                  다른 검색어를 입력하거나 조교 문의를 이용해 주세요.
                </Text>
                <Pressable
                  onPress={() =>
                    handleSelect({
                      id: 'assistant-inquiry-fallback',
                      title: '조교 문의',
                      description: '',
                      route: '/assistant-inquiry',
                      keywords: [],
                    })
                  }
                  style={styles.inquiryButton}
                >
                  <Text style={styles.inquiryButtonText}>조교 문의로 이동</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.resultList}>
                {results.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => handleSelect(item)}
                    style={({ pressed }) => [
                      styles.resultRow,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.resultName}>{item.title}</Text>
                    <Text numberOfLines={2} style={styles.resultDescription}>
                      {item.description}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    height: 64,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  pageTitle: {
    marginTop: 12,
    color: '#171717',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 28,
    lineHeight: 38,
  },
  searchRow: {
    height: 52,
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DADADA',
  },
  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: 0,
    color: COLORS.text,
    fontFamily: 'FreesentationRegular',
    fontSize: 15,
  },
  searchIcon: { width: 24, height: 24, resizeMode: 'contain' },
  guide: {
    marginTop: 10,
    color: '#9A9A9A',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
    lineHeight: 18,
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 16,
    color: '#3E3E3E',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 15,
  },
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 38,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  chipText: {
    color: '#2D2D2D',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
  },
  resultList: { borderTopWidth: 1, borderTopColor: '#EEEEEE' },
  resultRow: {
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  resultName: {
    color: '#171717',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 15,
  },
  resultDescription: {
    marginTop: 5,
    color: '#777777',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
    lineHeight: 17,
  },
  empty: { paddingVertical: 56, alignItems: 'center' },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  emptyText: {
    marginTop: 9,
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  inquiryButton: {
    minHeight: 44,
    marginTop: 20,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#3550FF',
  },
  inquiryButtonText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.65 },
});
