export type FrequentlyAskedQuestion = {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords?: readonly string[];
};

// 질문을 전달받으면 이 배열에 항목만 추가하면 FAQ 화면의
// 검색, 카테고리 필터, 답변 펼치기가 자동으로 동작합니다.
export const FREQUENTLY_ASKED_QUESTIONS: readonly FrequentlyAskedQuestion[] = [];
