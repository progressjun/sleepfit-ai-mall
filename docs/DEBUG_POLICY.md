# 디버그 정책

## 1. 기본 원칙
1. 재현 가능한 증상 먼저 확보
2. 최소 변경으로 원인 분리
3. 환경변수/권한 이슈 먼저 점검
4. 본질이 아닌 UI만의 변경으로 번복하지 않음

## 2. 재현 우선순위
1. 라우트 500/400 응답 (콘솔 및 네트워크 탭)
2. 위젯 미노출 (스크립트 삽입/도메인/토큰)
3. 추천 미표시 (상품 상세 30초 체류 시)
4. 상담 응답 품질/범위 이탈

## 3. 체크 항목
- 서버 상태: `npm run dev` 또는 `npm run start` 실행 로그
- API 로그: `/api/onsite/events`, `/api/onsite/recommendation`, `/api/onsite/chat`
- 브라우저 로그:
  - 스크립트 실행 에러
  - `__C24AI`/`__SLIPAI` 객체 존재 여부
  - 이벤트 payload 생성 여부
- 환경 변수:
  - `ONSITE_WIDGET_SHARED_SECRET` 존재/미존재 시 동작 분기
  - `ONSITE_WIDGET_ALLOWED_ORIGINS` 설정

## 4. 수집해야 할 정보
- 발생 시간/브라우저 UA
- 페이지 타입(product detail / other)
- 요청 payload의 `projectKey`, `mallId`, `eventName`(혹은 `message`)
- `response.ok` 여부 및 응답 메시지

## 5. 임시 완화
- 위젯 동작이 핵심 영업 이슈일 때:
  1. 관리자 페이지에서 스크립트 삽입 비활성
  2. 운영자 브라우저 캐시/쿠키 초기화
  3. 핵심 스크립트 재삽입 후 5분 단위로 재확인
