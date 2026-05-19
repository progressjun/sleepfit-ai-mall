import type { RiskLevel } from "@/types";

export type SolutionModuleId =
  | "store-foundation"
  | "migration-data"
  | "design-skin"
  | "product-detail"
  | "cs-board"
  | "marketing-tracking"
  | "payments-fulfillment"
  | "approval-governance";

export interface SolutionModuleDefinition {
  id: SolutionModuleId;
  title: string;
  description: string;
  route: string;
  routeLabel: string;
  owner: string;
  riskLevel: RiskLevel;
  capabilities: string[];
  cafe24LikeChecks: string[];
}

export const solutionModuleDefinitions: SolutionModuleDefinition[] = [
  {
    id: "store-foundation",
    title: "쇼핑몰 기본 운영",
    description: "상품, 옵션, 진열분류, 재고, 쿠폰/혜택이 운영자 관점으로 정리되어야 합니다.",
    route: "/migration",
    routeLabel: "기본 운영 점검",
    owner: "운영 PM",
    riskLevel: "medium",
    capabilities: ["상품 기본정보", "옵션/품목", "진열분류", "재고/판매상태", "쿠폰/프로모션"],
    cafe24LikeChecks: ["상품관리 권한", "진열분류 구조", "옵션 품목 코드", "혜택 노출 위치"],
  },
  {
    id: "migration-data",
    title: "이전 데이터/리다이렉트",
    description: "상품, 회원, 주문, 리뷰, 게시판, URL 매핑을 이전 리스크 중심으로 관리합니다.",
    route: "/migration",
    routeLabel: "이전 진단 보기",
    owner: "이전 담당자",
    riskLevel: "high",
    capabilities: ["상품 데이터", "회원/주문 데이터", "리뷰/게시판", "301 리다이렉트", "SEO 보존"],
    cafe24LikeChecks: ["데이터 추출 범위", "개인정보 보관 기준", "URL 매핑표", "광고 랜딩 URL QA"],
  },
  {
    id: "design-skin",
    title: "디자인 스킨/템플릿",
    description: "메인, 상품목록, 상품상세, 주문완료, 모바일 CSS를 스킨 단위로 분리합니다.",
    route: "/website",
    routeLabel: "스킨 설계 보기",
    owner: "프론트/디자인",
    riskLevel: "medium",
    capabilities: ["스킨 백업", "공통 레이아웃", "메인 템플릿", "상품상세 템플릿", "모바일 CTA"],
    cafe24LikeChecks: ["백업 스킨", "공통 header/footer", "주문완료 템플릿", "하단 탭바 충돌"],
  },
  {
    id: "product-detail",
    title: "상품 상세/전환 콘텐츠",
    description: "상세 HTML, 이미지, USP, FAQ, 광고 카피, 표현 리스크를 상품별로 검수합니다.",
    route: "/detail-pages",
    routeLabel: "상세페이지 작업",
    owner: "마케터",
    riskLevel: "medium",
    capabilities: ["상세 HTML", "이미지 경로", "USP/오퍼", "FAQ", "표현 리스크"],
    cafe24LikeChecks: ["상품상세 백업", "모바일 이미지 폭", "옵션명/소재명 일치", "view_item 이벤트"],
  },
  {
    id: "cs-board",
    title: "CS/게시판 운영",
    description: "상품문의, 게시판, 상담원 매크로, 금지 표현, 상담원 연결 기준을 관리합니다.",
    route: "/ai-cs",
    routeLabel: "AI CS 점검",
    owner: "CS 리더",
    riskLevel: "high",
    capabilities: ["FAQ", "상품문의 답변", "상담원 매크로", "금지 표현", "에스컬레이션"],
    cafe24LikeChecks: ["게시판 분류", "상품문의 매크로", "개인정보 마스킹", "자동발송 비활성"],
  },
  {
    id: "marketing-tracking",
    title: "마케팅/전환 측정",
    description: "GTM, 광고 픽셀, 구매 이벤트, value/currency, 중복 전환을 테스트합니다.",
    route: "/marketing-scripts",
    routeLabel: "스크립트 점검",
    owner: "퍼포먼스 마케터",
    riskLevel: "high",
    capabilities: ["GA4", "GTM", "Meta Pixel", "Naver/Kakao/TikTok", "purchase 이벤트"],
    cafe24LikeChecks: ["공통 레이아웃 삽입", "주문완료 dataLayer", "deduplication key", "앱 중복 설치"],
  },
  {
    id: "payments-fulfillment",
    title: "결제/배송 준비",
    description: "PG, 간편결제, 정산, 취소/환불, 배송상품 테스트를 전환 관점으로 확인합니다.",
    route: "/payments",
    routeLabel: "페이먼츠 보기",
    owner: "운영/정산",
    riskLevel: "medium",
    capabilities: ["카드결제", "간편결제", "가상계좌", "취소/환불", "구매 이벤트 연동"],
    cafe24LikeChecks: ["PG 심사", "네이버페이/카카오페이", "모바일 결제", "부분 취소 테스트"],
  },
  {
    id: "approval-governance",
    title: "승인/적용 거버넌스",
    description: "AI 생성물과 운영 작업을 승인, 반려, 적용 준비, 로그로 통제합니다.",
    route: "/approval",
    routeLabel: "승인 대기열",
    owner: "프로젝트 책임자",
    riskLevel: "low",
    capabilities: ["승인 대기열", "리스크 필터", "작업 로그", "적용 준비", "감사 이력"],
    cafe24LikeChecks: ["자동 적용 차단", "고위험 승인 경고", "작업자/상태 로그", "적용 전 QA"],
  },
];
