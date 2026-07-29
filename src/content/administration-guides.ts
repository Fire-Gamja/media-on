export type AdministrationGuide = {
  title: string;
  body: string;
  linkLabel: string;
  linkUrl: string | null;
};

export const ADMINISTRATION_CONTENT: {
  pageTitle: string;
  introTitle: string;
  introBody: string;
  guides: readonly AdministrationGuide[];
} = {
  pageTitle: '행정 업무',
  introTitle: '학부 행정 안내',
  introBody: '자주 찾는 학사 절차와 일정을 한곳에서 확인하세요.',
  guides: [
    {
      title: '휴학·복학 신청 방법',
      body:
        '통합정보시스템에 로그인한 뒤 학적관리 메뉴에서 휴학 또는 복학을 신청해 주세요. 신청 기간과 제출 서류는 학부 공지사항을 먼저 확인하고, 군휴학·질병휴학 등 증빙이 필요한 경우 행정조교에게 문의해 주세요.',
      linkLabel: '통합정보시스템 바로가기',
      linkUrl: null,
    },
    {
      title: '학과 일정',
      body:
        '수강신청, 휴·복학, 공결, 졸업전시회와 비교과 프로그램 일정을 안내하는 영역입니다. 현재는 임시 문구이며, 확정된 학사 일정을 입력해 주세요.',
      linkLabel: '학과 일정 확인하기',
      linkUrl: null,
    },
    {
      title: '공결 신청 안내',
      body:
        '공결 사유에 맞는 증빙서류를 준비한 뒤 통합정보시스템에서 신청해 주세요. 승인 여부와 추가 제출 서류는 행정조교에게 확인할 수 있습니다.',
      linkLabel: '공결 신청 바로가기',
      linkUrl: null,
    },
    {
      title: '졸업·수강 문의',
      body:
        '졸업학점, 전공필수, 복수·부전공 및 수강 관련 확인이 필요하면 학번과 문의 내용을 정리해 조교 문의로 보내 주세요.',
      linkLabel: '관련 안내 확인하기',
      linkUrl: null,
    },
  ],
};
