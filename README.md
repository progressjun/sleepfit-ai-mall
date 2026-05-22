# Commerce Migration Console

AI 기반 커머스 이전·운영 콘솔 MVP입니다. 서버 이전 진단, 홈페이지 제작 지원, 상세페이지 제작, 상담원 보조형 AI CS, 마케팅 스크립트 설치 점검, 페이먼츠 선택 지원, 승인 대기열, 작업 로그를 하나의 관리자 화면에서 관리합니다.

## 프로젝트 개요

Commerce Migration Console은 기존 쇼핑몰을 단순 이전하는 도구가 아니라, 광고 집행과 매출 운영이 가능한 AI 커머스 환경으로 전환하기 위한 업무형 SaaS 콘솔입니다. 초기 MVP는 외부 쇼핑몰 API를 실제 호출하지 않고 mock data와 localStorage 기반 상태로 전체 데모 플로우가 동작합니다.

## 서비스 포지션

브랜드사, 광고대행사, 이커머스 운영 담당자, 이전·구축 PM이 서버 이전 범위와 리스크를 확인하고, 홈페이지 구조, 상세페이지 전환 구조, AI CS 보조 체계, 광고 성과 측정 스크립트, 결제 구성을 함께 설계할 수 있도록 돕습니다.

## 주요 기능

- Dashboard: 전환 운영 준비도 점수, 프로젝트 진행률, 리스크 경고, 최근 작업 로그 확인
- 솔루션 점검: Cafe24형 쇼핑몰 솔루션 운영 모듈 기준의 전체 기능 커버리지 확인
- AI 작업실: Lovable처럼 자연어 요청을 다중 작업 계획으로 분해하고 선택 실행
- Migration: 이전 범위, 복잡도 점수, 리스크 플래그, 실행 체크리스트 생성
- Cafe24 전면 체크: 관리자 권한, 스킨 백업, 도메인·SSL·PG, URL 리다이렉트, 구매 이벤트 중복 수집 점검
- Website: 브랜드몰 페이지 구조, CTA, 신뢰 요소, FAQ, 모바일 UX 체크리스트 생성
- Detail Pages: 상품별 USP, 상세 구성, FAQ, 광고 카피, 표현 리스크 생성
- AI CS: 상담원 답변 초안, FAQ, 상담원 연결 규칙, 금지 표현 관리
- Marketing Scripts: GA4, GTM, Google Ads, Meta, Naver, Kakao, TikTok 이벤트 테스트 점검
- Payments: 객단가와 판매 구조 기반 결제수단, PG 체크리스트, 승인 요건 추천
- Approval Queue: AI 생성 결과 승인, 반려, 적용 준비 상태 관리
- Work Logs: 생성, 승인, 반려, 적용, 스크립트 테스트 이력 추적
- Settings: provider placeholder, OpenAI/Supabase 연결 상태, 보안 안내 확인

## 기술스택

Next.js App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand persist, Zod, OpenAI SDK, Supabase JS, lucide-react, date-fns.

## 설치 방법

```bash
npm install
```

## 슬립AI 온사이트 위젯 설치 (Cafe24)

광고주의 홈페이지에는 아래 1개 스크립트만 넣으면 됩니다. OpenAI 키는 서버(현재 Next.js)에서만 사용되고, 브라우저 스크립트에 노출되지 않습니다.

```html
<script
  async
  src="https://YOUR_APP_DOMAIN/onsite.js"
  data-site-id="your_mall_id"
  data-project-key="pk_your_project_key"
  data-mall-id="your_mall_id"
  data-widget-token="your_widget_token_if_configured"
  data-dwell-seconds="30"
></script>
```

### 어느 위치에 넣어야 하나요?

- Cafe24 관리자: **디자이너/디자인 편집** → 공통 레이아웃 또는 공통 스크립트 삽입 영역
- 헤더/푸터/공통 레이아웃에 넣으면 모든 페이지에 반영됩니다.
- 테스트: `public/cafe24-widget-demo.html`에 있는 형태 그대로 붙이면 됩니다.

### 보안/운영 옵션

- 운영 시 위젯 호출을 제한하려면 `.env.local`에 `ONSITE_WIDGET_SHARED_SECRET`를 넣고 스크립트에 `data-widget-token="..."`를 추가하세요.
- 허용 origin은 `ONSITE_WIDGET_ALLOWED_ORIGINS`로 제어합니다. 운영(prod)에서는 운영자 브랜딩 도메인(예: `https://your-mall.cafe24.com`)을 정확히 넣는 것을 권장합니다. (임시 개발/테스트만 `*` 사용)
- 상품/리뷰 연동은 `/api/cafe24/oauth/*` 동의 + `/api/cafe24/sync` 동기화 후 사용됩니다.

### 동작 요약

- 상품 상세 30초 체류: 리뷰 하이라이트 + 유사 상품 추천 배너 노출
- 상담사 대화: 현재 몰/상품/리뷰 맥락 기반으로만 응답
- 코딩/일반상식/타브랜드 질문은 위반 차단 응답

## 실행 방법

```bash
npm run dev
```

기본 개발 서버는 `http://localhost:3000`입니다. 주요 화면은 `/dashboard`, `/solution-audit`, `/workspace`에서 확인할 수 있습니다.

## 환경변수

`.env.example`을 참고해 `.env.local`을 만들 수 있습니다.

```bash
NEXT_PUBLIC_APP_NAME="Commerce Migration Console"
OPENAI_API_KEY=
OPENAI_MODEL="gpt-5-mini"
OPENAI_REASONING_EFFORT="minimal"
OPENAI_MAX_OUTPUT_TOKENS="360"
OPENAI_PROMPT_CACHE_RETENTION="24h"
ONSITE_OPENAI_MODEL="gpt-5.4-nano"
ONSITE_OPENAI_MAX_OUTPUT_TOKENS="240"
ONSITE_OPENAI_REASONING_EFFORT="minimal"
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
COMMERCE_PROVIDER_SECRET=
TOKEN_ENCRYPTION_KEY=
```

`OPENAI_API_KEY`가 없으면 Mock AI 모드로 동일한 UI 플로우가 동작합니다.

## OpenAI API 사용 방식

클라이언트 컴포넌트는 OpenAI SDK를 직접 호출하지 않습니다. 모든 AI 생성은 `app/api/ai/*`, `app/api/command/*`, `app/api/onsite/*` route를 통해 서버에서 처리합니다. `OPENAI_MODEL`이 없으면 현재 프로젝트 키에서 접근 가능한 비용 최적화 기본값인 `gpt-5-mini`를 사용하며, `lib/ai/service.ts`에서 Responses API와 structured output schema를 사용합니다.

고트래픽 온사이트 위젯 비용을 낮추기 위해 기본 설정은 `OPENAI_REASONING_EFFORT=minimal`, `OPENAI_MAX_OUTPUT_TOKENS=360`, `OPENAI_PROMPT_CACHE_RETENTION=24h`입니다. 계정에 `gpt-5.4-nano` 접근 권한이 생기면 `OPENAI_MODEL`을 `gpt-5.4-nano`로 낮춰 추가 절감할 수 있습니다.

온사이트 상담사는 설치된 쇼핑몰의 브랜드/상품/리뷰/구매 상담 범위에서만 답변합니다. 코딩, 일반지식, 뉴스, 투자, 다른 브랜드 질문은 `lib/onsite/scope-guard.ts`에서 OpenAI 호출 전에 차단해 비용과 오답 리스크를 줄입니다.

## 온사이트 위젯 월간 비용 추정(예시)

아래는 2026-05-19 기준 OpenAI 요금표 기준의 **예상치**입니다.  
실결제는 `input/output 토큰` 실측치와 요청 수에 따라 달라집니다.

전제:
- 일 방문자수: 40,000명 (월 1,200,000명)
- 상품 상세 체류 30초 이상 추천 트리거: 55%
- 추천 API 호출당 토큰: 입력 540 / 출력 220
- 상담 채팅 1회당 토큰: 입력 220 / 출력 180
- 상담 건수 비율: 방문자 대비 8%

요금(예시): `gpt-5.4-nano` 기준 input $0.20/1M, output $1.25/1M

월 예상비용(순수 LLM 토큰):
- 추천 API: 660,000건 × (540×0.20 + 220×1.25) / 1,000,000 ≈ **$252.8**
- 챗봇 API: 96,000건 × (220×0.20 + 180×1.25) / 1,000,000 ≈ **$25.8**
- 총 예상: **약 $278.6 / 월**

비용을 더 줄이려면:
- 토큰 예산 축소: `OPENAI_MAX_OUTPUT_TOKENS`, `ONSITE_OPENAI_MAX_OUTPUT_TOKENS`
- 모델 다운시프트: `ONSITE_OPENAI_MODEL=gpt-5.4-mini` 또는 `gpt-5.4-nano`
- `track` 이벤트만 받는 기간은 beacon 전송만 유지하고, 챗/추천 호출은 실제 트리거/의도에서만 수행

요청 전에는 `maskPIIInObject`로 이메일, 전화번호, 주소, 주문번호로 보이는 값을 마스킹합니다. JSON 파싱이나 SDK 호출이 실패하면 mock fallback으로 안전하게 응답합니다.

## Mock AI Fallback

`OPENAI_API_KEY`가 없거나 AI 호출이 실패하면 `lib/ai/mock-responses.ts`와 route별 fallback이 mock 응답을 반환합니다. 따라서 제안, 영업 데모, 로컬 QA는 API key 없이도 진행할 수 있습니다.

## 자연어 작업실

`/workspace`의 AI 작업실은 사용자가 자연어로 “Cafe24 이전 리스크 점검하고 홈페이지, 상세페이지, AI CS, 전환 스크립트까지 준비해줘”처럼 요청하면 다음 순서로 동작합니다.

1. `/api/command/workflow`가 요청을 분석해 작업 계획과 하위 task를 생성합니다.
2. 사용자는 실행할 task만 선택합니다.
3. 선택한 task가 기존 AI API route를 호출합니다.
4. 결과는 Zustand store에 저장되고 승인 대기열과 작업 로그에 등록됩니다.
5. high risk 작업은 승인 플로우에서 검수하도록 남깁니다.

이 기능은 외부 시스템에 즉시 적용하지 않고, 항상 계획 생성, 선택 실행, 승인 등록, 로그 기록 순서를 따릅니다.

## Commerce Provider 확장 방식

`lib/commerce/provider.ts`에 `CommerceProvider` interface가 있고, `lib/commerce/providers`에 Mock, Cafe24 placeholder, Shopify placeholder, Custom Mall placeholder가 있습니다. 초기 MVP에서는 외부 쇼핑몰 API를 호출하지 않습니다. Cafe24 adapter는 OAuth, Admin API, webhook, token refresh 연결 지점을 placeholder로 남겨두었습니다.

## Supabase Schema 적용 방법

`supabase/schema.sql`을 Supabase SQL Editor에서 실행하면 MVP용 테이블 구조를 만들 수 있습니다. JSON 생성물은 `jsonb`로 저장하도록 설계했고, RLS는 MVP 단계에서 TODO 주석으로 남겨두었습니다.

## 보안 주의사항

- `OPENAI_API_KEY`는 클라이언트에 노출하지 않습니다.
- 쇼핑몰 access token과 refresh token은 암호화 저장해야 합니다.
- 고객 개인정보는 OpenAI 요청에 직접 포함하지 않고 마스킹합니다.
- AI 생성 결과는 자동 적용하지 않고 승인 절차를 거칩니다.
- 마케팅 스크립트 적용 전 테스트 이벤트 확인이 필요합니다.
- 회원·주문 데이터 이전은 개인정보 처리 검토가 필요합니다.

## 향후 개발 로드맵

1. 실제 commerce provider OAuth와 상품·주문 읽기 연동
2. Supabase Auth, RLS, organization 멀티테넌시 적용
3. 승인 항목별 diff, 코멘트, 담당자 지정
4. 마케팅 스크립트 실측 이벤트 수집
5. 상세페이지 HTML export와 provider별 적용 adapter
6. CS 지식베이스 업로드와 상담원 워크스페이스 연동
