# AI 유지보수 가이드

이 문서는 SlipAI 저장소를 장기 운영 관점에서 유지보수하는 기준을 정의한다.

## 1. 책임 범위
- 온사이트 위젯: `/widget/v1.js`, `/api/onsite/*`, `/api/widget/v1.js`
- AI 응답: `/app/api/onsite/*`, `lib/ai/*`, `lib/onsite/*`
- 연동/API 보안: OAuth, 위젯 토큰, Supabase 저장, CORS
- 운영: 설치 스크립트 배포, 환경변수 관리, 로그/알림

## 2. 배포 전 체크리스트
1. 브랜치 정책 준수: `main`(혹은 `master`) 직접 수정 금지
2. PR 기준 테스트 통과: `npm run lint`, `npm run typecheck`, `npm run build`
3. 환경변수 검증:
   - `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ONSITE_WIDGET_SHARED_SECRET`, `ONSITE_WIDGET_ALLOWED_ORIGINS`(운영은 좁게)
4. 앱 실행 점검:
   - 랜딩 페이지 로딩
   - `public/cafe24-widget-demo.html` 또는 내부 점검 페이지에서 스크립트 정상 로드
5. 위젯 동작 점검:
   - 상품 상세에서 30초 체류 시 배너 노출
   - 상담창 오픈/닫기
   - `dwell_30s`, `chat_open`, `chat_message` 이벤트 전송 로그 유무

## 3. 장애 대응 정책
- **Critical**: 위젯 미노출, API 5xx 급증, 인증/토큰 오류
  - 1차 조치: 스크립트 제거/비활성, 위젯 token 회수(필요 시)
  - 2차 조치: `origin`/환경변수 점검, 배포 롤백
- **Major**: 추천 응답 품질 저하, 채팅 지연 증가
  - API 응답 캐시/폴백 로직 상태 점검
  - 최근 배포 변경분 롤백 후보 확인
- **Minor**: UI 표시 깨짐, 소소한 안내문구 오류
  - 브라우저 콘솔/뷰포트 기준 점검 후 핫픽스 배포

## 4. 로그·감사 기록
- API 로그: `console` + 앱 라우트 응답 메시지
- 감사 로그: `app/api/onsite/*` 응답 구조
- 민감 데이터는 `lib/security/pii.ts`의 마스킹 규칙 적용

## 5. 배포/롤백
- PR 병합 후 `main` 배포까지 시간 지연이 있는 경우, 버그 재현 시 바로 이전 커밋으로 롤백
- 긴급 패치 시: 작은 단위 패치 PR → 검증 체크리스트 통과 후 배포
