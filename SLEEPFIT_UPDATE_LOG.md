# SleepFit AI 업데이트 로그

## v1 현재 상태

- 한 줄 설치 스크립트 `/sleepfit.js`
- `/api/sleepfit/recommend`, `/api/sleepfit/events`
- Shadow DOM 기반 5문항 진단 UI
- 상품상세 인라인 카드와 홈/카테고리 플로팅 버튼
- 정적 상품 카탈로그 기반 룰 추천
- 상품상세/카테고리 데모 페이지

## v1.5 업데이트 내역

### 상품 데이터

- `catalog.ts` 상품 구조를 운영형 필드로 확장
- 상품번호, URL, 이미지, 가격, 카테고리, 세부 카테고리, 태그, 수면 자세, 체형, 높이, 더위 민감도, 예산, 시나리오, 업셀/크로스셀 그룹, 리뷰 근거 필드 추가
- 정적 Provider 인터페이스 추가로 추후 Cafe24 Admin API 연동 가능

### 추천 로직

- 5문항 매칭에서 선물 여부, 첫 구매 여부, 페이지 타입, 현재 상품, 장바구니 문맥, 업셀/크로스셀까지 반영
- 1순위 추천 1개, 대안 2개, 함께 볼 상품 1~2개로 응답 제한
- 상품상세에서는 현재 상품 이탈을 줄이는 방향으로 점수 보정
- 장바구니에서는 객단가 상승과 함께 구매 후보 우선
- 의료적 치료 효과나 보장 표현 없이 답변과 상품 속성을 연결한 설명문 사용

### 이벤트 로그

- 이벤트 타입 확장: `widget_view`, `widget_open`, `widget_close`, `quiz_start`, `answer_select`, `quiz_complete`, `recommendation_shown`, `product_impression`, `product_click`, `cta_click`, `cross_sell_click`, `chat_open`, `ab_assigned`, `error`
- 이벤트 필드 확장: event id, timestamp, mall id, session id, anonymous id, page url/type, referrer, device type, user agent, current/recommended product no, scenario, ab group, quiz answers, metadata
- 이벤트 저장 실패가 UI/추천 흐름을 막지 않도록 fire-and-forget 구조 유지

### A/B 테스트

- 최초 방문자 랜덤 배정
- `localStorage.sleepfit_ab_group`에 A/B 유지
- 이벤트와 추천 응답에 `abGroup` 포함
- A안: “나에게 맞는 베개 20초 만에 찾기”
- B안: “내 수면 습관에 맞는 베개 추천받기”
- 상품상세 CTA A/B 문구 분리

### 관리자 통계

- `/sleepfit-admin` 화면 추가
- `/api/sleepfit/admin/metrics` API 추가
- 전체 노출, 진단 시작, 진단 완료, 추천 노출, 상품 클릭, CTA 클릭, CTR, 완료율, 페이지별 성과, 상품별 클릭, 시나리오별 성과, A/B 성과, 최근 7일 추이 제공
- DB가 없을 때 mock fallback 제공

### 디자인 및 설치 안정성

- Shadow DOM 유지
- `sleepfit-` prefix CSS 사용
- 모바일 360px~430px 기준 패널 폭과 하단 위치 조정
- 카테고리 상단 미니 배너, 상품상세 인라인 카드, 장바구니/구매완료 인라인 카드 전략 추가
- 중복 삽입 방지, API timeout, 이미지 fallback, 이벤트 실패 무시 처리
- CORS 기본 허용 도메인에 `sleepnsleepmall.cafe24.com` 추가

## 수정된 주요 파일

- `lib/sleepfit/catalog.ts`
- `lib/sleepfit/recommendation.ts`
- `lib/sleepfit/schemas.ts`
- `lib/sleepfit/events.ts`
- `lib/sleepfit/widget-script.ts`
- `lib/sleepfit/http.ts`
- `lib/sleepfit/version.ts`
- `lib/sleepfit/ab-test.ts`
- `app/api/sleepfit/recommend/route.ts`
- `app/api/sleepfit/events/route.ts`
- `app/api/sleepfit/admin/metrics/route.ts`
- `app/sleepfit-admin/page.tsx`
- `public/sleepfit-demo.html`
- `public/sleepfit-category-demo.html`
- `public/product/list.html`
- `README.md`
- `SLEEPFIT_INSTALL.md`
- `SLEEPFIT_ADMIN_GUIDE.md`

## 테스트 결과

- dependency check: `npm ls --depth=0` 통과
- typecheck: `npm run typecheck` 통과
- lint: `npm run lint` 통과
- build: `npm run build` 통과
- `/sleepfit.js`: 200 응답, JS 문법 검사 통과
- recommend API: 200 응답, 1순위 추천/대안 2개/크로스셀 1개 반환 확인
- events API: 200 응답, 이벤트 저장 응답 확인
- 상품상세 데모: 진단 완료 후 CTA 클릭 시 옵션 영역 스크롤 확인
- 카테고리 데모: 미니 배너와 플로팅 진단 시작 확인, 추천 결과 상품 버튼 노출 확인
- 모바일 390px: 390px iframe QA에서 패널 렌더링 확인
- A/B group: `localStorage.sleepfit_ab_group` 기반 A/B 유지 구조 확인
- admin: `/sleepfit-admin?key=demo` 대시보드 렌더링 확인
- CORS: 로컬 개발 환경은 `*`, 운영 환경은 허용 origin 기준으로 배포 후 확인
- fallback: 추천/이벤트 API 중단 상태에서도 기본 추천 카드와 CTA 유지 확인

## v2로 넘긴 과제

- Cafe24 Admin API 상품 자동 동기화
- 주문/구매 데이터 연동
- 고객별 개인화 추천
- 실제 구매전환 매출 어트리뷰션
- CRM/카카오 알림톡 연동
- 관리자 상품 데이터 직접 수정
- OpenAI 기반 완전 동적 상담 추천
