# SleepFit AI Mall

SleepFit AI Mall은 카페24 자사몰에 한 줄 스크립트로 설치하는 수면핏 진단형 구매 도우미입니다. 방문자가 수면 자세, 선호 높이, 체형, 더위 민감도, 예산, 선물 여부, 첫 구매 여부를 답하면 베개/토퍼/침구 추천과 구매 CTA를 제공합니다.

## v1.5 핵심 기능

- `GET /sleepfit.js`: 카페24 공통 레이아웃에 삽입하는 독립 위젯 스크립트
- `POST /api/sleepfit/recommend`: 룰 기반 매출형 추천 API
- `POST /api/sleepfit/events`: 위젯/진단/추천/클릭 이벤트 수집 API
- `/sleepfit-admin`: 운영 통계 대시보드
- Shadow DOM 기반 UI 격리
- 홈/카테고리/상품상세/장바구니/구매완료 페이지별 노출 전략
- A/B 테스트 기본 구조와 이벤트 로그의 `abGroup` 기록
- 정적 카탈로그 Provider 구조로 추후 Cafe24 Admin API 연동 가능

## 카페24 설치 코드

```html
<script async src="https://sleepfit-ai-mall.vercel.app/sleepfit.js" data-mall-id="sleepnsleepmall"></script>
```

설치 위치와 운영 체크리스트는 [SLEEPFIT_INSTALL.md](./SLEEPFIT_INSTALL.md)를 확인하세요.

## 주요 경로

- 위젯 스크립트: `/sleepfit.js`
- 헬스체크: `/api/sleepfit/health`
- 추천 API: `/api/sleepfit/recommend`
- 이벤트 API: `/api/sleepfit/events`
- 관리자 지표 API: `/api/sleepfit/admin/metrics?key=demo`
- 관리자 화면: `/sleepfit-admin?key=demo`
- 상품상세 데모: `/sleepfit-demo.html`
- 카테고리 데모: `/sleepfit-category-demo.html`
- Cafe24 카테고리 경로 데모: `/product/list.html?cate_no=45`

## 로컬 실행

```bash
npm install
npm run dev
```

기본 개발 서버는 `http://localhost:3000`입니다.

## 검증 명령

```bash
npm run typecheck
npm run lint
npm run build
```

렌더링 QA는 상품상세 데모와 카테고리 데모에서 진단 완료, 추천 노출, CTA 클릭, 모바일 390px 화면을 확인합니다.

## 운영 환경변수

```bash
SLEEPFIT_ALLOWED_ORIGINS="https://sleepnsleepmall.com,https://www.sleepnsleepmall.com,https://sleepnsleepmall.co.kr,https://www.sleepnsleepmall.co.kr,https://sleepnsleepmall.cafe24.com"
SLEEPFIT_ADMIN_KEY="운영자_보호키"
SLEEPFIT_RATE_LIMIT_WINDOW_MS=60000
SLEEPFIT_RATE_LIMIT_RECOMMEND=120
SLEEPFIT_RATE_LIMIT_EVENTS=1000
```

`SLEEPFIT_ADMIN_KEY`가 없으면 `/sleepfit-admin?key=demo`로 mock fallback 화면을 확인할 수 있습니다. 운영 배포 전에는 반드시 실제 보호키를 설정하세요.

## v2로 넘긴 항목

- Cafe24 Admin API 상품 자동 동기화
- 주문/구매 데이터 연동
- 추천 매출 어트리뷰션
- 고객별 개인화 추천
- CRM/카카오 알림톡 연동
- 관리자 상품 수정 기능
- OpenAI 기반 완전 동적 상담 추천
