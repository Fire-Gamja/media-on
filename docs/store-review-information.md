# MEDIA ON 정식 스토어 심사 정보

기준일: 2026-08-06
운영 주체: **서원대학교 미디어콘텐츠학부**

이 문서는 App Store Connect와 Google Play Console에 입력할 정보, 개인정보 공개 답변, 심사 계정 준비와 배포 순서를 한곳에 정리한 제출 기준본이다.

## 1. 앱 기본 정보

| 항목 | 입력값 |
| --- | --- |
| 앱 이름 | MEDIA ON |
| 부제 / 짧은 설명 | 서원대학교 미디어콘텐츠학부 학사·실습 지원 |
| 운영 주체 | 서원대학교 미디어콘텐츠학부 |
| 기본 카테고리 | 교육 |
| 가격 | 무료 |
| 광고 | 없음 |
| 인앱 구매 | 없음 |
| 지원 언어 | 한국어 |
| 대상 이용자 | 서원대학교 미디어콘텐츠학부 재학생 및 승인된 관계자 |
| 지원 웹사이트 | https://www.seowon.ac.kr/multimedia/index.do |
| 지원 전화 | 043-299-8590 |
| 주소 | (우)28674 충북 청주시 서원구 무심서로 377-3 서원대학교 제1자연관 302호 |

### Google Play 짧은 설명

> 미디어콘텐츠학부 공지, 기자재·실습실 신청과 조교 문의를 한곳에서 이용하세요.

### 스토어 전체 설명

> MEDIA ON은 서원대학교 미디어콘텐츠학부 학생을 위한 학사·실습 지원 앱입니다.
>
> 학부 공지와 학사 일정을 확인하고, 기자재 대여와 실습실 이용을 신청할 수 있습니다. 시설·환경 문제를 신고하고 처리 상태를 확인하거나 조교에게 문의하고 상담 내역을 관리할 수 있습니다.
>
> 주요 기능
>
> - 학부 공지와 학사 일정 확인
> - 기자재 대여 신청 및 처리 상태 확인
> - 실습실 이용 신청 및 승인 상태 확인
> - 시설·환경 신고 및 조치 상태 확인
> - 조교 문의와 상담 메시지
> - 자주 묻는 질문과 기능 검색
> - 선택형 푸시 알림
>
> 회원가입 후 학부 관리자의 승인을 받은 계정만 사용할 수 있습니다.

### App Store 키워드 후보

`서원대학교,미디어콘텐츠학부,학부공지,기자재대여,실습실,조교문의,학사일정`

## 2. 공개 URL

`legal` Supabase Edge Function을 공개 배포한 뒤 `<PROJECT_REF>`를 실제 Supabase 프로젝트 ref로 교체한다.

| 콘솔 항목 | URL |
| --- | --- |
| 개인정보처리방침 | `https://<PROJECT_REF>.supabase.co/functions/v1/legal/privacy` |
| 서비스 이용약관 | `https://<PROJECT_REF>.supabase.co/functions/v1/legal/terms` |
| Google Play 계정 삭제 URL | `https://<PROJECT_REF>.supabase.co/functions/v1/legal/account-deletion` |
| 고객지원 URL | `https://www.seowon.ac.kr/multimedia/index.do` |

공개 페이지는 PDF가 아니며 로그인 없이 전 세계에서 HTTPS로 열려야 한다. 배포 후 시크릿 브라우저와 모바일 데이터 환경에서 세 URL을 모두 확인한다.

## 3. 심사 계정

Apple과 Google 심사팀이 모든 기능을 사용할 수 있도록 **승인 완료된 학생용 심사 계정**을 만든다. 실제 학생 계정을 제공하지 않는다.

| 항목 | 제출 전 입력 |
| --- | --- |
| 학번 | `[심사용 학번]` |
| 비밀번호 | `[심사용 비밀번호]` |
| 계정 상태 | 승인 완료 |
| 학년·전공 | 테스트용 정보임을 심사 메모에 명시 |
| 서버 상태 | 심사 기간 동안 Supabase와 Edge Functions 상시 사용 가능 |

심사 계정에는 기자재·실습실·시설 신고·조교 문의의 확인 가능한 테스트 데이터가 있으면 좋다. 일회용 비밀번호나 추가 인증은 사용하지 않는다.

### Apple App Review Notes

> MEDIA ON is an account-based academic and practice-support app for approved members of Seowon University Division of Media Contents. Please sign in with the review student number and password provided in the review information. No institutional SSO or hardware is required. Push notifications are optional and may be declined without blocking the app. Account deletion is available under Settings > Service & Privacy > Delete Account and Data. The AI title/category suggestion is optional and shows a separate disclosure before sending inquiry text to the OpenAI API.

### Google Play 앱 액세스 안내

> 앱의 모든 기능 또는 일부 기능이 제한됨 → 로그인 정보 필요. 제공한 심사용 학번과 비밀번호로 로그인하면 별도의 학교 인증 없이 전체 학생 기능을 확인할 수 있습니다. 알림 권한은 선택 사항입니다. 계정 삭제는 설정 → 서비스 및 개인정보 → 계정 및 데이터 삭제에서 시작할 수 있습니다.

## 4. 개인정보 및 데이터 보안 답변 기준

현재 저장소 코드를 기준으로 작성한 항목이다. 새 SDK, 분석 도구, 광고, 로그인 방식 또는 데이터 항목을 추가하면 양쪽 콘솔과 개인정보처리방침을 함께 갱신한다.

### 처리 데이터 목록

| 스토어 분류 | 실제 데이터 | 계정 연결 | 목적 |
| --- | --- | --- | --- |
| 이름 | 이름 | 예 | 계정 승인, 서비스 제공 |
| 전화번호 | 휴대전화번호 | 예 | 본인 확인, 계정 복구 |
| 사용자 ID | 학번, Supabase 사용자 ID | 예 | 로그인, 계정·신청 연결 |
| 사진 | 선택한 프로필 사진 | 예 | 프로필 표시 |
| 기타 사용자 콘텐츠 | 대여 목적, 실습실 목적, 시설 신고, 조교 문의·채팅, 비밀번호 재설정 사유 | 예 | 요청 처리와 상담 |
| 검색 기록 | 앱 기능 검색어와 선택 결과 | 예 | 검색 품질과 운영 개선 |
| 앱 상호작용 | 공지·알림 읽음 상태, 신청·처리 상태 | 예 | 앱 기능 제공 |
| 기기 또는 기타 ID | Expo 푸시 토큰, OS 구분 | 예 | 선택형 푸시 알림 |
| 진단·보안 로그 | 접속·오류·보안 대응 로그 | 상황에 따라 예 | 보안, 장애 대응 |

### Google Play 데이터 보안

- 데이터 수집: **예**
- 전송 중 암호화: **예(HTTPS/TLS)**
- 계정 생성: **예**
- 앱 내 계정 삭제: **예**
- 외부 웹 계정 삭제 요청: **예**
- 광고 또는 데이터 판매: **아니요**
- 선택 데이터: 프로필 사진, 푸시 토큰, AI 처리를 위해 사용자가 선택해 전송하는 문의 내용
- 필수 데이터: 이름, 학번, 학년, 전공, 학적 상태, 휴대전화번호, 계정·신청·문의 데이터
- 제3자 서비스 처리: Supabase, Expo Push Service, 선택 시 OpenAI API

Google의 정의상 개발자를 대신하는 서비스 제공자 처리는 특정 조건에서 `공유` 예외가 될 수 있다. Play Console에서 표시하는 최신 정의를 읽고 Supabase·Expo·OpenAI가 서비스 제공자 예외에 해당하는지 최종 확인한다. 개인정보처리방침에는 예외 여부와 관계없이 모두 공개한다.

### Apple App Privacy

다음 데이터 유형을 `App Functionality` 목적으로 공개한다.

- Contact Info: Name, Phone Number
- Identifiers: User ID
- User Content: Photos or Videos(프로필 사진), Customer Support(조교 문의·채팅), Other User Content(신청·신고 내용)
- Search History: 기능 검색어
- Usage Data: Product Interaction(공지·알림·신청 상태 상호작용)
- Diagnostics: 앱 또는 백엔드에서 실제 수집되는 범위만 선택

광고 추적, 제3자 광고, 맞춤형 광고와 데이터 브로커 제공은 현재 코드에 없다. 따라서 Tracking은 `No`로 제출한다.

## 5. 권한 설명

| 권한 | 사용 목적 | 필수 여부 |
| --- | --- | --- |
| 사진 보관함 | 이용자가 선택한 프로필 사진 변경 | 선택 |
| 알림 | 공지와 신청·문의 처리 상태 수신 | 선택 |
| 인터넷 | 계정, 공지, 신청·문의 등 서버 기반 기능 | 핵심 기능에 필요 |

알림 권한을 거부해도 앱을 사용할 수 있어야 한다. 앱은 설정에서 권한을 다시 요청할 수 있지만 설정 이동을 강제하지 않는다.

## 6. 계정 삭제 동작

학생은 앱에서 학번을 다시 입력하고 최종 확인한 뒤 계정 삭제를 실행한다. 삭제 시 다음 데이터가 사용자 ID 외래키를 통해 함께 삭제된다.

- 프로필과 약관 확인 기록
- 기자재·실습실 신청
- 시설 신고
- 조교 문의와 채팅
- 비밀번호 재설정 요청
- 검색 기록
- 앱 알림과 푸시 기기 정보
- 프로필 사진

관리자 계정은 공지 작성자와 업무 기록의 책임 관계가 있어 앱에서 직접 삭제하지 않고 운영자가 인계·보존 기준을 확인한 뒤 처리한다. 일반 학생용 심사 계정에서는 앱 내 삭제가 정상 동작해야 한다.

## 7. 제출 전 기술 배포 순서

1. 최신 코드를 pull한다.
2. Supabase DB migration `202608060001_store_review_legal_and_account_deletion.sql`을 적용한다.
3. 공개 법적 고지 페이지를 JWT 검증 없이 배포한다.

   ```bash
   supabase functions deploy legal --no-verify-jwt
   ```

4. AI Edge Function을 다시 배포해 `store: false`를 적용한다.

   ```bash
   supabase functions deploy suggest-assistant-inquiry
   ```

5. 개인정보처리방침, 이용약관, 계정 삭제 URL을 브라우저에서 확인한다.
6. 승인된 학생 심사 계정으로 가입 약관, 로그인, 알림 거부, AI 미사용 문의, AI 사용 동의, 계정 삭제를 실제 기기에서 확인한다.
7. 새 Android AAB와 iOS archive를 생성한다.

## 8. 콘솔 제출 체크리스트

### App Store Connect

- [ ] 앱 이름, 부제, 설명, 키워드, 카테고리 입력
- [ ] 지원 URL과 개인정보처리방침 URL 입력
- [ ] App Privacy 데이터 유형 입력
- [ ] 연령 등급 설문 실제 기능 기준 응답
- [ ] 스크린샷과 앱 아이콘 최종본 업로드
- [ ] 심사 연락처와 활성 심사 계정 입력
- [ ] App Review Notes 입력
- [ ] 계정 삭제 경로 확인
- [ ] 암호화 수출 규정 질문 응답 (`ITSAppUsesNonExemptEncryption: false`와 일치)

### Google Play Console

- [ ] 앱 이름, 짧은 설명, 전체 설명, 카테고리 입력
- [ ] 개인정보처리방침 URL 입력
- [ ] 데이터 보안 양식 입력
- [ ] 앱 액세스에 심사 계정 입력
- [ ] 계정 삭제 URL 입력
- [ ] 콘텐츠 등급 및 타깃층 설문 실제 기능 기준 응답
- [ ] 광고 없음으로 신고
- [ ] 스크린샷, 아이콘, 그래픽 이미지 최종본 업로드
- [ ] Android App Bundle 업로드 및 사전 출시 보고서 확인

## 9. 학교 최종 확인이 필요한 항목

아래 정보는 코드로 확정할 수 없으므로 심사 제출 전에 운영 책임자 또는 학교 개인정보 담당 부서가 확인해야 한다.

- [ ] `서원대학교 미디어콘텐츠학부` 명의로 앱과 외부 클라우드 서비스를 운영하는 내부 승인
- [ ] 개인정보 보호 담당부서·책임자 표기와 연락처 `043-299-8590`의 사용 승인
- [ ] Supabase 프로젝트의 실제 저장 리전, 백업 보유기간과 계약 상태
- [ ] OpenAI API와 Expo Push Service의 국외 처리·위탁 고지 문구
- [ ] 학교 기록관리 기준상 신청·상담 기록을 탈퇴 즉시 삭제해도 되는지 여부
- [ ] Apple Developer 및 Google Play 개발자 표시 이름과 운영 주체의 관계 설명
- [ ] 최종 시행일과 약관 버전

학교 검토로 내용이 바뀌면 `src/content/legal.ts`, `supabase/functions/legal/index.ts`, migration의 현재 버전과 이 문서를 함께 갱신한다.

## 공식 정책 참고

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple App Privacy: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/
- Google Play User Data: https://support.google.com/googleplay/android-developer/answer/10144311?hl=ko
- Google Play Account Deletion: https://support.google.com/googleplay/android-developer/answer/13327111?hl=ko
- 개인정보보호위원회 개인정보 처리방침 작성지침: https://www.pipc.go.kr/np/cop/bbs/selectBoardList.do?bbsId=BS217&mCode=D010030000
- OpenAI API Data Controls: https://developers.openai.com/api/docs/guides/your-data
