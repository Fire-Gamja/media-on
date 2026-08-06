declare const Deno: {
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

const operator = '서원대학교 미디어콘텐츠학부';
const phone = '043-299-8590';
const address =
  '(우)28674 충북 청주시 서원구 무심서로 377-3 서원대학교 제1자연관 302호';
const effectiveDate = '2026년 8월 6일';

Deno.serve((request) => {
  const path = new URL(request.url).pathname.replace(/\/+$/, '');
  const page = path.split('/').pop();

  if (page === 'privacy') {
    return htmlResponse(
      pageLayout(
        'MEDIA ON 개인정보처리방침',
        privacyContent,
        'privacy',
      ),
    );
  }

  if (page === 'terms') {
    return htmlResponse(
      pageLayout('MEDIA ON 서비스 이용약관', termsContent, 'terms'),
    );
  }

  if (page === 'account-deletion') {
    return htmlResponse(
      pageLayout(
        'MEDIA ON 계정 및 데이터 삭제',
        deletionContent,
        'account-deletion',
      ),
    );
  }

  return htmlResponse(
    pageLayout(
      'MEDIA ON 법적 고지',
      `<section><h2>안내</h2><p>아래 문서를 확인할 수 있습니다.</p><ul><li><a href="./privacy">개인정보처리방침</a></li><li><a href="./terms">서비스 이용약관</a></li><li><a href="./account-deletion">계정 및 데이터 삭제</a></li></ul></section>`,
      'index',
    ),
  );
});

function htmlResponse(body: string) {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

function pageLayout(title: string, content: string, active: string) {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="index,follow" />
  <base href="/functions/v1/legal/" />
  <title>${title}</title>
  <style>
    :root { color-scheme: light; --navy:#182366; --ink:#111827; --muted:#5f6675; --line:#d9ddeb; --bg:#f7f8fc; --danger:#b91c1c; }
    * { box-sizing:border-box; }
    body { margin:0; background:var(--bg); color:var(--ink); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans KR",sans-serif; line-height:1.7; }
    header { background:var(--navy); color:#fff; }
    .header-inner, main, footer { width:min(880px,calc(100% - 32px)); margin:0 auto; }
    .header-inner { padding:44px 0 34px; }
    .brand { margin:0 0 8px; font-size:14px; font-weight:800; opacity:.82; }
    h1 { margin:0; font-size:clamp(26px,4vw,38px); line-height:1.25; }
    .meta { margin:10px 0 0; font-size:13px; opacity:.82; }
    nav { margin-top:24px; display:flex; flex-wrap:wrap; gap:8px; }
    nav a { padding:8px 12px; border:1px solid rgba(255,255,255,.28); border-radius:10px; color:#fff; font-size:13px; text-decoration:none; }
    nav a.active { background:#fff; color:var(--navy); font-weight:800; }
    main { padding:26px 0 52px; }
    section { margin-top:14px; padding:24px; border:1px solid var(--line); border-radius:18px; background:#fff; }
    h2 { margin:0 0 12px; font-size:19px; line-height:1.4; }
    p { margin:9px 0; color:var(--muted); }
    ul { margin:10px 0 0; padding-left:22px; color:var(--muted); }
    li { margin:7px 0; }
    a { color:var(--navy); }
    .notice { border-color:#fecaca; background:#fff7f7; }
    .notice h2 { color:var(--danger); }
    .primary { display:inline-block; margin-top:14px; padding:12px 17px; border-radius:12px; background:var(--navy); color:#fff; font-weight:800; text-decoration:none; }
    footer { padding:0 0 44px; color:var(--muted); font-size:13px; }
    @media (max-width:520px) { section { padding:19px; } .header-inner { padding-top:34px; } }
  </style>
</head>
<body>
  <header><div class="header-inner">
    <p class="brand">${operator} · MEDIA ON</p>
    <h1>${title}</h1>
    <p class="meta">버전 2026-08-06 · 시행 ${effectiveDate}</p>
    <nav aria-label="법적 고지">
      <a class="${active === 'privacy' ? 'active' : ''}" href="./privacy">개인정보처리방침</a>
      <a class="${active === 'terms' ? 'active' : ''}" href="./terms">이용약관</a>
      <a class="${active === 'account-deletion' ? 'active' : ''}" href="./account-deletion">계정 삭제</a>
    </nav>
  </div></header>
  <main>${content}</main>
  <footer>
    <strong>${operator}</strong><br />${address}<br />전화 <a href="tel:${phone}">${phone}</a> · 평일 09:00~18:00 (주말·공휴일 제외)
  </footer>
</body>
</html>`;
}

const privacyContent = `
<section><h2>1. 개인정보 처리 목적</h2><ul><li>회원가입 심사, 재학생·관계자 확인과 계정 관리</li><li>학부 공지·학사·실습 정보 제공</li><li>기자재 대여, 실습실 이용, 시설 신고와 조교 문의 처리</li><li>비밀번호 재설정, 본인 확인과 이용자 문의 대응</li><li>공지·신청·문의 처리 상태 알림</li><li>검색 품질, 보안, 장애 대응과 서비스 운영 개선</li></ul></section>
<section><h2>2. 처리하는 개인정보</h2><ul><li><strong>필수 계정정보:</strong> 이름, 학번, 비밀번호(인증 서비스가 암호화해 처리), 학년, 전공, 학적 상태, 휴대전화번호, 내부 사용자 ID, 가입·승인·약관 확인 기록</li><li><strong>선택정보:</strong> 프로필 사진</li><li><strong>서비스 이용정보:</strong> 기자재·실습실 신청, 시설 신고, 조교 문의·채팅, 비밀번호 재설정 요청, 기능 검색어, 공지·알림 확인 상태</li><li><strong>기기·자동 생성정보:</strong> 운영체제 구분, Expo 푸시 토큰, 접속 일시와 보안·오류 대응 로그</li></ul></section>
<section><h2>3. 보유기간</h2><ul><li>계정과 서비스 이용정보: 회원 탈퇴 또는 계정 삭제 시까지</li><li>가입 승인 대기·거절 정보: 승인 절차 종료와 이의 대응에 필요한 기간까지</li><li>푸시 토큰: 로그아웃, 알림 등록 해제 또는 계정 삭제 시까지</li><li>약관 확인 기록: 계정 유지 기간과 분쟁 대응에 필요한 기간까지</li><li>법령 또는 학교 기록관리 기준에 보관 의무가 있는 정보: 해당 기간</li></ul><p>목적을 달성한 개인정보는 지체 없이 파기하며, 백업 정보는 제공자의 순환 삭제 절차에 따라 접근이 제한된 상태로 삭제됩니다.</p></section>
<section><h2>4. 수집 방법과 법적 근거</h2><p>회원가입, 프로필 수정, 신청·신고·문의, 설정 변경에서 이용자가 직접 입력하거나 서비스 이용 중 자동 생성되는 정보를 처리합니다. 핵심 서비스 제공에 필요한 정보는 이용계약의 체결·이행과 정당한 운영을 위해 처리하고, 선택 기능은 별도로 고지합니다.</p></section>
<section><h2>5. 제3자 제공</h2><p>개인정보를 판매하지 않으며, 이용자의 별도 동의가 있거나 법령에 근거가 있는 경우에만 필요한 범위에서 제공합니다.</p></section>
<section><h2>6. 처리업무 위탁과 국외 처리</h2><ul><li><strong>Supabase Inc.(미국):</strong> 회원 인증, 데이터베이스, 파일 저장과 백엔드 운영. 계정정보·서비스 이용정보·프로필 사진을 암호화된 통신으로 처리하며 계정 또는 데이터 삭제 시까지 보유합니다.</li><li><strong>OpenAI, L.L.C.(미국):</strong> 이용자가 AI 정리를 선택한 경우 문의 내용의 제목·분류 생성. API 입력은 모델 학습에 사용되지 않으며 저장 비활성화 설정을 적용합니다. 기본 악용 모니터링 로그는 예외적인 법적·안전상 필요를 제외하고 최대 30일 보관될 수 있습니다.</li><li><strong>650 Industries, Inc.(Expo, 미국):</strong> 알림을 허용한 경우 푸시 토큰, 운영체제 구분과 메시지 전달 정보를 알림 등록 해제 또는 계정 삭제 시까지 처리합니다.</li></ul><p>AI와 알림을 거부해도 앱의 기본 기능을 이용할 수 있습니다. Supabase를 통한 핵심 정보 처리를 거부하면 계정 기반 서비스 제공이 어려우므로 계정을 삭제할 수 있습니다.</p></section>
<section><h2>7. 파기</h2><p>전자적 파일은 복구하기 어려운 안전한 삭제 절차로 파기합니다. 별도 보관 의무가 있는 정보는 다른 정보와 분리하고 접근을 제한합니다.</p></section>
<section><h2>8. 이용자의 권리</h2><p>이용자는 개인정보 열람, 정정, 처리정지, 동의 철회와 삭제를 요구할 수 있습니다. 프로필과 알림은 앱에서 변경할 수 있고, 계정 삭제는 앱의 설정에서 시작할 수 있습니다. 앱을 사용할 수 없는 경우 <a href="tel:${phone}">${phone}</a>로 요청할 수 있으며 본인 확인 후 처리합니다.</p></section>
<section><h2>9. 안전성 확보조치</h2><ul><li>전송 구간 암호화와 인증 기반 접근 통제</li><li>사용자·관리자 권한 분리와 행 단위 데이터 접근 정책</li><li>비밀번호 암호화 처리와 비밀키의 앱 코드 외부 보관</li><li>개인정보 접근 최소화와 보안·장애 기록 점검</li></ul></section>
<section><h2>10. 만 14세 미만</h2><p>MEDIA ON은 서원대학교 미디어콘텐츠학부 재학생과 관계자를 대상으로 하며 만 14세 미만 아동을 대상으로 가입을 제공하지 않습니다.</p></section>
<section><h2>11. 개인정보 보호 문의</h2><p>담당부서: ${operator} 앱 운영 담당<br />전화: <a href="tel:${phone}">${phone}</a><br />주소: ${address}</p></section>
<section><h2>12. 권익침해 구제</h2><ul><li>개인정보침해 신고센터: 국번 없이 118, privacy.kisa.or.kr</li><li>개인정보분쟁조정위원회: 1833-6972, www.kopico.go.kr</li><li>대검찰청 사이버수사과: 국번 없이 1301, www.spo.go.kr</li><li>경찰청 사이버범죄 신고시스템: 국번 없이 182, ecrm.police.go.kr</li></ul></section>
<section><h2>13. 변경</h2><p>중요한 변경은 앱 공지로 시행 전 안내하고 필요한 경우 새 버전에 대한 확인 또는 동의를 받습니다. 공고일 및 시행일은 ${effectiveDate}입니다.</p></section>`;

const termsContent = `
<section><h2>1. 목적과 운영 주체</h2><p>MEDIA ON은 ${operator}가 운영하는 학사·실습 지원 서비스입니다. 공지, 기자재·실습실 신청, 시설 신고, 조교 문의와 관련 알림을 제공합니다.</p><p>운영 주체: ${operator}<br />전화: <a href="tel:${phone}">${phone}</a><br />주소: ${address}</p></section>
<section><h2>2. 약관의 적용과 변경</h2><p>회원가입 또는 기존 이용자의 재동의 절차에서 동의한 때부터 적용됩니다. 중요한 변경은 시행 전 앱 공지 또는 알림으로 안내하며, 이용자에게 불리한 중요한 변경은 원칙적으로 30일 전에 안내하고 필요한 경우 다시 동의를 받습니다.</p></section>
<section><h2>3. 가입과 승인</h2><ul><li>본인의 정확한 이름, 학번, 학적과 연락처를 사용해야 합니다.</li><li>학생 계정은 학부 관리자의 승인 후 사용할 수 있습니다.</li><li>허위 정보, 계정 도용 또는 권한 없는 접근은 이용 제한 사유가 됩니다.</li></ul></section>
<section><h2>4. 이용자 의무</h2><ul><li>관련 법령, 학칙, 기자재·시설 이용 규정과 앱 안내를 준수합니다.</li><li>욕설, 차별, 협박, 불법 정보 또는 타인의 권리를 침해하는 내용을 등록하지 않습니다.</li><li>서비스 운영을 방해하거나 권한 없이 시스템·데이터에 접근하지 않습니다.</li><li>신청·신고·문의 정보를 정확하게 작성하고 승인·반납 조건을 지킵니다.</li></ul></section>
<section><h2>5. 알림과 AI</h2><p>푸시 알림은 선택 사항이며 허용하지 않아도 기본 기능을 사용할 수 있습니다. AI 제목·분류 추천도 선택 사항이고, 별도 고지에 동의한 경우에만 작성한 문의 내용이 OpenAI API로 전송됩니다. AI를 사용하지 않고 직접 입력할 수 있습니다.</p></section>
<section><h2>6. 서비스 변경과 제한</h2><p>점검, 장애, 학교 운영 일정 또는 불가피한 사유로 서비스가 일시 중단될 수 있습니다. 약관 위반, 계정 도용, 허위 신청 또는 시스템 침해가 확인되면 이용이 제한될 수 있습니다.</p></section>
<section><h2>7. 탈퇴와 삭제</h2><p>앱 설정에서 계정 삭제를 요청할 수 있습니다. 완료되면 계정과 연결된 프로필, 신청, 신고, 문의, 채팅, 검색과 알림 정보가 삭제됩니다. 법령 또는 학교 기준에 별도 보관 의무가 있으면 해당 기간 동안 분리 보관할 수 있습니다.</p></section>
<section><h2>8. 개인정보와 분쟁</h2><p>개인정보 처리는 MEDIA ON 개인정보처리방침에 따릅니다. 서비스 관련 문의와 이의는 학부 사무실에 제기할 수 있고, 해결되지 않는 분쟁은 대한민국 법령에 따릅니다.</p></section>
<section><h2>부칙</h2><p>이 약관은 ${effectiveDate}부터 시행합니다.</p></section>`;

const deletionContent = `
<section class="notice"><h2>계정 삭제 시 복구할 수 없습니다</h2><p>MEDIA ON 계정을 삭제하면 이름·학번·학적·연락처, 프로필 사진, 기자재·실습실 신청, 시설 신고, 조교 문의·채팅, 검색, 알림과 푸시 기기 정보가 함께 삭제됩니다.</p></section>
<section><h2>앱에서 직접 삭제</h2><ol><li>MEDIA ON에 로그인합니다.</li><li><strong>설정 → 서비스 및 개인정보 → 계정 및 데이터 삭제</strong>로 이동합니다.</li><li>본인의 학번을 입력하고 삭제 내용을 확인합니다.</li><li><strong>계정과 데이터 영구 삭제</strong>를 선택합니다.</li></ol><p>삭제가 완료되면 자동으로 로그아웃되며 같은 계정의 데이터는 복구할 수 없습니다.</p></section>
<section><h2>앱에 로그인할 수 없는 경우</h2><p>학부 사무실로 전화해 MEDIA ON 계정 삭제를 요청할 수 있습니다. 이름·학번·등록 연락처를 통한 본인 확인 후 계정과 연결 데이터를 삭제합니다.</p><a class="primary" href="tel:${phone}">${phone}로 삭제 요청</a><p>접수시간: 평일 09:00~18:00 (주말·공휴일 제외)</p></section>
<section><h2>별도 보관</h2><p>법령 또는 학교 기록관리 기준에 따라 보관 의무가 있는 정보가 있다면 해당 근거와 기간 동안 다른 정보와 분리하여 보관한 뒤 파기합니다. 자세한 내용은 <a href="./privacy">개인정보처리방침</a>에서 확인할 수 있습니다.</p></section>`;
