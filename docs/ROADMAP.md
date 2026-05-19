# 유지보수 로드맵

## Phase 0 (즉시, 이번 PR)
1. 문서 체계화: AI_MAINTENANCE_GUIDE, PROJECT_GOAL, CURRENT_STATUS, ROADMAP, DEBUG_POLICY, NEXT_ACTIONS, CHANGELOG 신설
2. 최소 안정성 보강: `typecheck` 스크립트 추가, CI 파이프라인 보강
3. UI 작은 회귀 완화: 추천 상품 카드 렌더링에서 빈값 방지
4. 점검 완료 후 PR 작성

## Phase 1 (다음 2주)
- API 응답 모니터링 대시보드 연결
- 위젯 이벤트 추적 메트릭 대시보드 시각화
- 환경변수 누락 시 정합성 에러 메시지 개선

## Phase 2 (다음 분기)
- 저장소 내 문서와 설치 가이드 다국어/가독성 정비
- 온사이트 DOM 감지 규칙 추가(카페24 템플릿별 템플릿 시나리오)
- 자동 리그레션 점검 스크립트(브라우저 스냅샷, 최소 렌더 체크) 도입

## 제외 항목 (현재 범위 외)
- DB 스키마, 인증/결제 흐름, API Key 정책, 개인정보 처리 모델 변경
