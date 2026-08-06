import type { Href } from 'expo-router';

import { supabase } from '../lib/supabase';

export type FeatureSearchItem = {
  id: string;
  title: string;
  description: string;
  route: Href;
  keywords: string[];
};

export const FEATURE_SEARCH_ITEMS: FeatureSearchItem[] = [
  {
    id: 'notices',
    title: '학과 공지사항',
    description: '학부 공지와 긴급 공지를 확인합니다.',
    route: '/notices',
    keywords: ['공지', '알림', '학과 소식', '긴급 공지'],
  },
  {
    id: 'rentals',
    title: '대여',
    description: '기자재 대여와 실습실 대여를 한곳에서 확인합니다.',
    route: '/rentals',
    keywords: ['대여', '기자재', '실습실', '장비', '공간'],
  },
  {
    id: 'equipment-rental',
    title: '기자재 대여',
    description: '카메라와 학부 기자재를 조회하고 대여합니다.',
    route: '/equipment',
    keywords: ['카메라', '장비', '노트북', '대여', '빌리기'],
  },
  {
    id: 'room-rental',
    title: '실습실 대여',
    description: '실습실 이용 가능 시간과 신청 내역을 확인합니다.',
    route: '/rooms',
    keywords: ['강의실', '실습실', '공간', '예약', '대여'],
  },
  {
    id: 'facility-report',
    title: '시설 신고',
    description: '실습실 시설이나 기자재 고장을 신고합니다.',
    route: '/facility-report',
    keywords: ['고장', '수리', '컴퓨터', '빔프로젝터', '신고'],
  },
  {
    id: 'assistant-inquiry',
    title: '조교 문의',
    description: '조교에게 문의를 남기고 실시간으로 상담합니다.',
    route: '/assistant-inquiry',
    keywords: ['질문', '상담', '조교', '문의', '채팅'],
  },
  {
    id: 'frequently-asked-questions',
    title: '자주 묻는 질문',
    description: '학부 이용 중 자주 묻는 질문과 답변을 확인합니다.',
    route: '/frequently-asked-questions',
    keywords: ['FAQ', '자주 묻는 질문', '질문', '답변', '도움말'],
  },
  {
    id: 'applications',
    title: '내 신청 현황',
    description: '대기·처리 중·완료된 모든 신청을 확인합니다.',
    route: '/application-status?stage=pending',
    keywords: ['신청', '처리 상황', '승인', '반려', '진행 상태'],
  },
  {
    id: 'schedule',
    title: '일정',
    description: '개인 일정과 학부 일정을 확인합니다.',
    route: '/schedule',
    keywords: ['달력', '캘린더', '일정', '스케줄'],
  },
  {
    id: 'profile',
    title: '내 정보 변경',
    description: '프로필 사진과 학생 정보를 변경합니다.',
    route: '/profile',
    keywords: ['프로필', '사진', '정보 변경', '비밀번호'],
  },
  {
    id: 'notifications',
    title: '알림',
    description: '읽지 않은 알림과 이전 알림을 확인합니다.',
    route: '/notifications',
    keywords: ['알림', '푸시', '메시지', '미확인'],
  },
  {
    id: 'settings',
    title: '설정',
    description: '일반 상태 알림 설정을 변경합니다.',
    route: '/settings',
    keywords: ['설정', '알림 끄기', '알림 켜기'],
  },
];

export function searchFeatures(query: string) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return FEATURE_SEARCH_ITEMS;
  }

  return FEATURE_SEARCH_ITEMS.map((item) => ({
    item,
    score: calculateScore(item, normalizedQuery),
  }))
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((result) => result.item);
}

export async function logFeatureSearch(
  query: string,
  selectedFeatureId?: string,
) {
  if (!supabase || !query.trim()) {
    return;
  }

  await supabase.from('feature_search_logs').insert({
    query: query.trim().slice(0, 500),
    selected_feature_id: selectedFeatureId ?? null,
  });
}

function calculateScore(item: FeatureSearchItem, query: string) {
  const title = normalize(item.title);
  const description = normalize(item.description);
  let score = 0;

  if (title === query) score += 100;
  if (title.includes(query)) score += 60;
  if (query.includes(title)) score += 35;
  if (description.includes(query)) score += 20;

  item.keywords.forEach((keyword) => {
    const normalizedKeyword = normalize(keyword);
    if (normalizedKeyword === query) score += 80;
    if (
      normalizedKeyword.includes(query) ||
      query.includes(normalizedKeyword)
    ) {
      score += 30;
    }
  });

  return score;
}

function normalize(value: string) {
  return value.toLocaleLowerCase('ko-KR').replace(/[\s?.!,~_-]/g, '');
}
