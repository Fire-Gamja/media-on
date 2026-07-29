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

import { AppIcon, type AppIconName } from '../../components/common/AppIcon';
import { PlatformHeaderIcon } from '../../components/common/PlatformHeaderIcon';
import { COLORS } from '../../constants/colors';
import {
  type FeatureSearchItem,
  logFeatureSearch,
  searchFeatures,
} from '../../services/feature-search';

const searchIcon = require('../../../assets/figma/student/search.png');

export default function FeatureSearchScreen() {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchFeatures(query), [query]);

  const handleSelect = (item: FeatureSearchItem) => {
    void logFeatureSearch(query || item.title, item.id);
    router.push(item.route);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
        >
          <PlatformHeaderIcon name="back" />
        </Pressable>
        <Text style={styles.headerTitle}>기능 검색</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.searchArea}>
        <View style={styles.searchBox}>
          <Image source={searchIcon} style={styles.searchIcon} />
          <TextInput
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            onSubmitEditing={() => void logFeatureSearch(query)}
            placeholder="무엇을 찾고 계신가요?"
            placeholderTextColor={COLORS.placeholder}
            returnKeyType="search"
            style={styles.input}
            value={query}
          />
          {query ? (
            <Pressable
              accessibilityLabel="검색어 지우기"
              hitSlop={8}
              onPress={() => setQuery('')}
            >
              <Text style={styles.clear}>×</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.guide}>
          “휴학을 하고 싶은데 어떻게 하지?”처럼 문장으로 검색해도 돼요.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
      >
        <Text style={styles.resultTitle}>
          {query.trim() ? '연관 기능' : '전체 기능'}
        </Text>
        {results.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>연관 기능을 찾지 못했습니다.</Text>
            <Text style={styles.emptyText}>
              다른 단어로 검색하거나 조교 문의를 이용해 주세요.
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
          <View style={styles.list}>
            {results.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => handleSelect(item)}
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.iconBox}>
                  <AppIcon name={getFeatureIcon(item.id)} size={28} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.description}>{item.description}</Text>
                  <View style={styles.keywordRow}>
                    {item.keywords.slice(0, 3).map((keyword) => (
                      <Text key={keyword} style={styles.keyword}>
                        {keyword}
                      </Text>
                    ))}
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getFeatureIcon(id: string): AppIconName {
  if (id.includes('equipment')) return 'equipment';
  if (id.includes('room')) return 'room';
  if (id.includes('facility')) return 'report';
  if (
    id.includes('assistant') ||
    id.includes('leave') ||
    id.includes('profile')
  ) {
    return 'assistant';
  }
  return 'notice';
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backText: {
    width: 40,
    color: COLORS.navy,
    fontSize: 38,
    lineHeight: 40,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSide: {
    width: 40,
  },
  searchArea: {
    padding: 18,
    paddingBottom: 14,
    backgroundColor: COLORS.surface,
  },
  searchBox: {
    height: 54,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  searchIcon: {
    width: 19,
    height: 19,
    resizeMode: 'contain',
  },
  input: {
    flex: 1,
    height: 54,
    marginLeft: 11,
    color: COLORS.text,
    fontSize: 15,
  },
  clear: {
    color: COLORS.subText,
    fontSize: 25,
  },
  guide: {
    marginTop: 10,
    color: COLORS.subText,
    fontSize: 12,
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  resultTitle: {
    marginBottom: 13,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  list: {
    gap: 12,
  },
  card: {
    minHeight: 112,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  iconBox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.softNavy,
  },
  cardText: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  description: {
    marginTop: 5,
    color: COLORS.subText,
    fontSize: 12,
    lineHeight: 18,
  },
  keywordRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  keyword: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: COLORS.navy,
    fontSize: 10,
    fontWeight: '700',
    borderRadius: 8,
    backgroundColor: COLORS.softNavy,
  },
  chevron: {
    marginLeft: 8,
    color: COLORS.subText,
    fontSize: 25,
  },
  empty: {
    minHeight: 300,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
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
    backgroundColor: COLORS.navy,
  },
  inquiryButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.68,
  },
});
