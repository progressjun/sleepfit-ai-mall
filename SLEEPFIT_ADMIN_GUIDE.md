# SleepFit AI 관리자 가이드

## 접속 경로

```text
https://sleepfit-ai-mall.vercel.app/sleepfit-admin?key=demo
```

운영 배포 전에는 Vercel 환경변수에 보호키를 설정하세요.

```bash
SLEEPFIT_ADMIN_KEY="운영자_보호키"
```

보호키를 설정한 뒤에는 아래처럼 접속합니다.

```text
https://sleepfit-ai-mall.vercel.app/sleepfit-admin?key=운영자_보호키
```

## 주요 지표

- 전체 위젯 노출 수: `widget_view`
- 진단 시작 수: `quiz_start`
- 진단 완료 수: `quiz_complete`
- 추천 결과 노출 수: `recommendation_shown`
- 추천 상품 클릭 수: `product_click`
- CTA 클릭 수: `cta_click`
- 페이지별 성과: `pageType` 기준 집계
- 상품별 클릭 수: `recommendedProductNo` 기준 집계
- 시나리오별 성과: `scenario` 기준 집계
- A/B 그룹별 성과: `abGroup` 기준 집계
- 최근 7일 이벤트 추이: 일자별 노출, 시작, 추천 노출, 클릭

## 계산 방식

- 추천 CTR = `product_click / recommendation_shown`
- 진단 시작률 = `quiz_start / widget_view`
- 진단 완료율 = `recommendation_shown / quiz_start`
- CTA 클릭률 = `cta_click / recommendation_shown`

화면에서는 백분율로 표시합니다. 분모가 0이면 0%로 처리합니다.

## A/B 테스트 보는 법

현재 v1.5 테스트 항목:

- A안 플로팅 문구: “나에게 맞는 베개 20초 만에 찾기”
- B안 플로팅 문구: “내 수면 습관에 맞는 베개 추천받기”
- A안 상품상세 CTA: “내 옵션 확인하기”
- B안 상품상세 CTA: “이 상품이 맞는지 확인하기”

판단 순서:

1. `quizStartRate`가 높은 그룹을 먼저 봅니다.
2. `recommendationCtr`가 높은 그룹을 비교합니다.
3. `ctaClickRate`가 낮으면 추천 결과 카드나 CTA 문구를 조정합니다.

## 운영자가 매주 확인할 항목

- 카테고리 페이지에서 진단 시작률이 유지되는지
- 상품상세 페이지에서 CTA 클릭률이 떨어지지 않는지
- 클릭 TOP 상품이 실제 주력 상품과 맞는지
- 클릭 저조 상품이 반복되면 추천 점수나 상품 태그가 잘못된 것은 아닌지
- A/B 그룹 간 차이가 10% 이상 벌어지는지
- 모바일 이벤트 비중이 높을 때 하단 구매 버튼과 위젯이 겹치지 않는지
- 이벤트 저장이 0건으로 보이면 CORS, `/api/sleepfit/events`, ad blocker 영향을 확인할 것

## 데이터 보관 주의

v1.5는 DB가 없는 환경에서도 볼 수 있도록 서버 메모리 저장과 mock fallback을 사용합니다. Vercel 서버리스 인스턴스가 바뀌면 메모리 이벤트는 사라질 수 있습니다. 장기 운영에서는 Supabase나 Vercel 연동 스토리지로 이벤트 저장소를 분리해야 합니다.
