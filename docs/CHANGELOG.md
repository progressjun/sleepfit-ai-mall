# Changelog

## Unreleased

### 유지보수 (2026-05-19)
- `docs/*` 유지보수 가이던스 문서 6종 추가:
  - AI_MAINTENANCE_GUIDE.md
  - PROJECT_GOAL.md
  - CURRENT_STATUS.md
  - ROADMAP.md
  - DEBUG_POLICY.md
  - NEXT_ACTIONS.md
  - CHANGELOG.md 초기 버전 작성
- `.github/workflows/ci.yml` 추가: lint/typecheck/build를 PR 검증에 자동 적용
- `package.json`에 `typecheck`, `verify` 스크립트 추가
- 위젯 추천 상품 렌더링 폴백 개선: 값이 비어있을 때 `undefined` 출력 제거

## 2026-05-19
- 초기 SlipAI 위젯 MVP 기능 구현 반영(주요 라우트, 위젯 스크립트, API 스키마, 보안 가드 포함)
