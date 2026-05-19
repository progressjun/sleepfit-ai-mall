import type { MigrationDiagnostic } from "@/types";

export const mockMigrationDiagnostics: MigrationDiagnostic[] = [
  {
    id: "migration_001",
    projectId: "project_001",
    complexityScore: 76,
    summary:
      "회원/주문 데이터와 광고 스크립트 재설치가 포함되어 중상 난이도의 이전 프로젝트입니다.",
    riskFlags: [
      {
        level: "high",
        title: "개인정보 이전 검토 필요",
        description:
          "회원/주문 데이터 이전 시 개인정보 처리방침과 보관 범위 확인이 필요합니다.",
      },
      {
        level: "medium",
        title: "SEO 손실 가능성",
        description:
          "URL 구조 변경 시 검색 노출 손실 가능성이 있어 리다이렉트 정책이 필요합니다.",
      },
    ],
    checklist: [
      "기존 상품 데이터 추출 범위 확정",
      "상세페이지 이미지 경로 점검",
      "URL 리다이렉트 매핑표 작성",
      "GA4 및 광고 매체 전환 스크립트 재설치",
      "결제 모듈 승인 일정 확인",
    ],
    estimatedSteps: ["범위 확정", "데이터 추출", "검수", "스크립트 재설치", "테스트"],
    cafe24DataObjects: [
      "상품 기본정보, 옵션/품목, 진열분류, 추가이미지, 상세 HTML",
      "회원 등급, 적립금, 쿠폰 사용 가능 범위, 휴면/탈퇴 회원 제외 정책",
      "주문/배송/클레임 이력은 개인정보 보관 기간과 접근 권한 검토 후 범위 확정",
    ],
    cafe24AdminChecks: [
      "쇼핑몰 관리자 권한: 상품, 디자인, 주문, 고객, 프로모션, 앱스토어 접근 분리 확인",
      "디자인 스킨 편집 권한과 백업 스킨 생성 여부 확인",
      "도메인 연결, SSL, PG 심사 상태, 간편결제 사용 가능 여부 확인",
    ],
    cafe24IntegrationTasks: [
      "스킨 공통 레이아웃에 GTM 컨테이너 삽입 위치 지정",
      "상품 상세/장바구니/주문완료 페이지별 dataLayer 이벤트 매핑",
      "카카오/네이버/메타 픽셀 중복 구매 전환 방지 키 정의",
    ],
    redirectPlan: [
      "기존 상품 URL과 신규 상품 URL을 SKU 기준으로 매핑",
      "카테고리, 기획전, 리뷰 게시판 URL은 301 리다이렉트 우선순위로 분리",
      "광고 랜딩 URL은 캠페인별로 별도 검수 후 전환 태그 테스트",
    ],
    scriptReinstallPlan: [
      "GTM preview로 page_view, view_item, add_to_cart, purchase 순서 검증",
      "purchase 이벤트 value/currency/order_id 전달 확인",
      "앱 또는 스킨에 중복 삽입된 기존 스크립트 제거",
    ],
    approvalStatus: "approved",
    createdAt: "2026-05-04T04:00:00.000Z",
  },
];
