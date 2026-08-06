export type FrequentlyAskedQuestion = {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords?: readonly string[];
  links?: ReadonlyArray<{
    label: string;
    url: string;
  }>;
};

// 질문을 전달받으면 이 배열에 항목만 추가하면 FAQ 화면의
// 검색, 카테고리 필터, 답변 펼치기가 자동으로 동작합니다.
export const FREQUENTLY_ASKED_QUESTIONS: readonly FrequentlyAskedQuestion[] = [
  {
    id: 'general-leave-of-absence',
    category: '휴학·자퇴',
    question: '일반휴학은 어떻게 신청하나요?',
    answer:
      '1. 본인 전공주임 교수님께 직접 연락해 상담 일정을 잡고 상담합니다.\n2. 학부 사무실에 방문해 일반휴학원을 작성합니다.\n3. 작성한 일반휴학원을 학생지원팀에 제출합니다.\n\n전공주임 교수님\n• 멀티미디어전공: 이병권 교수님\n• 영상미디어전공: 김금영 교수님',
    keywords: ['일반 휴학', '휴학원', '전공주임', '학생지원팀'],
  },
  {
    id: 'military-leave-of-absence',
    category: '휴학·자퇴',
    question: '군휴학은 언제, 어떻게 신청하나요?',
    answer:
      '군휴학은 입영일 기준 30일 전부터 입영 당일까지 신청할 수 있습니다.\n\n입영통지서를 지참해 학부 사무실에 방문하고 군휴학원을 작성한 뒤 학생지원팀에 제출해 주세요.',
    keywords: ['군 휴학', '입영', '입대', '입영통지서', '군휴학원'],
  },
  {
    id: 'early-military-leave',
    category: '휴학·자퇴',
    question: '입대가 30일보다 많이 남았는데 미리 휴학할 수 있나요?',
    answer:
      '군휴학 신청 가능 기간 전이라면 먼저 일반휴학을 진행해 주세요. 입영일 30일 전부터 군휴학 신청이 가능해지면 일반휴학을 군휴학으로 변경하면 됩니다.',
    keywords: ['입대 전 휴학', '군휴학 변경', '일반휴학'],
  },
  {
    id: 'withdrawal',
    category: '휴학·자퇴',
    question: '자퇴는 어떻게 신청하나요?',
    answer:
      '1. 학부장 김병완 교수님께 직접 연락해 상담 일정을 잡고 상담합니다.\n2. 학부 사무실에 방문해 자퇴원을 작성합니다.\n3. 작성한 자퇴원을 학생지원팀에 제출합니다.',
    keywords: ['자퇴원', '학부장', '김병완', '학생지원팀'],
    links: [
      {
        label: '휴·복학 및 자퇴 안내 보기',
        url: 'https://www.seowon.ac.kr/seowon/403/subview.do',
      },
    ],
  },
  {
    id: 'official-absence',
    category: '공결',
    question: '공결서는 어떻게 발급받나요?',
    answer:
      '증빙자료를 지참해 학부 사무실을 방문하면 공결서를 발급받을 수 있습니다. 발급받은 공결서는 해당 과목 교수님께 직접 제출해 주세요.\n\n질병공결은 반드시 진료확인서가 필요합니다. 병원 또는 약국 영수증만으로는 발급할 수 없습니다.',
    keywords: ['공결서', '질병공결', '진료확인서', '증빙자료', '결석'],
  },
  {
    id: 'course-registration-site',
    category: '수강신청',
    question: '수강신청과 강의시간표는 어디에서 확인하나요?',
    answer:
      '서원대학교 수강신청 사이트에서 수강신청, 강의시간표 조회, 대치교과목 조회, 타학과 전공인정과목 조회 등을 확인할 수 있습니다.',
    keywords: ['수강신청 사이트', '강의시간표', '대치교과목', '전공인정'],
    links: [
      {
        label: '수강신청 사이트 열기',
        url: 'https://sugangh.seowon.ac.kr/nx/',
      },
    ],
  },
  {
    id: 'course-registration-guide',
    category: '수강신청',
    question: '최소 이수학점과 교양필수과목은 어디에서 확인하나요?',
    answer:
      '서원대학교 수강신청 지침에서 최소 이수학점과 교양필수과목 등을 확인할 수 있습니다. 전공 교육과정은 미디어콘텐츠학부 홈페이지에서 확인해 주세요.',
    keywords: ['최소 이수학점', '교양필수', '전공 교육과정', '수강신청 지침'],
    links: [
      {
        label: '수강신청 지침 보기',
        url: 'https://www.seowon.ac.kr/seowon/1811/subview.do',
      },
    ],
  },
  {
    id: 'multimedia-required-courses',
    category: '필수과목',
    question: '멀티미디어전공 졸업 필수과목은 무엇인가요?',
    answer:
      "이수 구분이 '전공선택'이어도 졸업을 위해 아래 과목을 반드시 수강해야 합니다.\n\n• 창업캡스톤디자인실습 (3학년 2학기)\n• 스마트미디어플랫폼제작 (4학년 1학기)\n• 창업캡스톤디자인실무 (4학년 1학기)\n• 창업캡스톤디자인프로젝트 (4학년 2학기)\n• 멀티미디어포트폴리오제작 (4학년 2학기)",
    keywords: ['멀티미디어전공', '졸업 필수', '전공선택', '캡스톤'],
  },
  {
    id: 'video-media-required-courses',
    category: '필수과목',
    question: '영상미디어전공 졸업 필수과목은 무엇인가요?',
    answer:
      "이수 구분이 '전공선택'이어도 졸업을 위해 아래 과목을 반드시 수강해야 합니다.\n\n• 창업캡스톤디자인실습 (3학년 2학기)\n• 영상콘텐츠크리에이티브 (4학년 1학기)\n• 창업캡스톤디자인실무 (4학년 1학기)\n• 창업캡스톤디자인프로젝트 (4학년 2학기)\n• 영상미디어프로젝트 (4학년 2학기)",
    keywords: ['영상미디어전공', '졸업 필수', '전공선택', '캡스톤'],
  },
  {
    id: 'graduation-requirements',
    category: '졸업요건',
    question: '졸업요건은 어디에서 확인하나요?',
    answer:
      '전공별 교육과정은 미디어콘텐츠학부 홈페이지에서 확인해 주세요. 졸업을 위해 반드시 이수해야 하는 과목은 이 화면의 ‘필수과목’ 카테고리에서도 확인할 수 있습니다.',
    keywords: ['졸업', '졸업요건', '교육과정', '필수과목'],
  },
  {
    id: 'employment-attendance',
    category: '취업계',
    question: '취업계는 누가, 어떻게 신청하나요?',
    answer:
      '대상은 취업한 4학년 재학생이며 아르바이트는 인정되지 않습니다.\n\n제출 서류\n• 재직증명서\n• 건강보험득실확인서 또는 근로소득원천징수영수증\n\n취업계는 출석만 인정하며 과제와 시험 등은 인정되지 않습니다. 세부 운영은 담당 교수님 재량이므로 과목 담당 교수님께 직접 연락해 주세요. 학부 사무실 방문은 필요하지 않습니다.',
    keywords: ['취업', '출석 인정', '재직증명서', '건강보험', '원천징수'],
  },
  {
    id: 'preferred-major-change',
    category: '전공변경',
    question: '희망전공 변경은 언제 신청하나요?',
    answer:
      '희망전공 변경 신청은 1학기 3월 초, 2학기 9월 초에 진행합니다. 카카오톡 공지방에 안내할 예정이므로 공지글을 확인한 뒤 신청해 주세요.',
    keywords: ['희망전공', '세부전공', '전공 변경', '멀티', '영상'],
  },
  {
    id: 'major-change-course-registration',
    category: '전공변경',
    question: '희망전공 변경 전에는 어느 전공 기준으로 수강신청하나요?',
    answer:
      '변경하려는 전공의 교육과정에 맞춰 먼저 수강신청하고, 3월 초 또는 9월 초 희망전공 변경 기간에 신청해 주세요.\n\n변경하려는 전공의 과목이 일반선택으로 담긴 경우에는 4학년 졸업 전까지 해당 과목의 이수 구분을 전공으로 변경 신청해야 합니다.',
    keywords: ['전공 변경 전 수강신청', '이수구분 변경', '일반선택', '전공선택'],
  },
  {
    id: 'double-major',
    category: '복수전공',
    question: '복수전공은 어떻게 신청하나요?',
    answer:
      '복수전공 신청 기간은 해당 학기 학사일정에서 확인해 주세요. 신청 기간에 학교 ERP에서 직접 신청하면 됩니다.',
    keywords: ['복수 전공', 'ERP', '학사일정'],
  },
];
