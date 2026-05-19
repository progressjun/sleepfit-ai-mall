import type {
  CommandAIOutput,
  CsAIOutput,
  DetailPageAIOutput,
  MigrationAIOutput,
  PaymentsAIOutput,
  ScriptsAIOutput,
  WebsiteAIOutput,
} from "./schemas";

export const mockMigrationResponse: MigrationAIOutput = {
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
  estimatedSteps: ["범위 확정", "데이터 추출", "검수", "스크립트 재설치", "결제 테스트"],
  cafe24DataObjects: [
    "상품 기본정보, 옵션/품목, 진열분류, 추가이미지, 상세 HTML",
    "회원 등급, 적립금, 쿠폰, 휴면/탈퇴 회원 제외 기준",
    "주문/배송/클레임 이력은 개인정보 보관 기간과 접근 권한 검토 후 이전 범위 확정",
  ],
  cafe24AdminChecks: [
    "관리자 권한: 상품, 디자인, 주문, 고객, 프로모션, 앱스토어 접근 권한 분리",
    "디자인 스킨 백업 생성 후 공통 레이아웃/상품상세/주문완료 템플릿 수정",
    "도메인, SSL, PG, 간편결제, 네이버페이/카카오페이 사용 가능 상태 확인",
  ],
  cafe24IntegrationTasks: [
    "GTM 컨테이너 삽입 위치를 공통 레이아웃 기준으로 지정",
    "상품상세, 장바구니, 주문완료 화면의 dataLayer 이벤트 매핑",
    "앱스토어 앱과 스킨 직접 삽입 스크립트의 중복 전환 여부 점검",
  ],
  redirectPlan: [
    "기존 상품 URL과 신규 상품 URL을 SKU/상품코드 기준으로 매핑",
    "카테고리, 기획전, 게시판 URL은 301 리다이렉트 우선순위로 분리",
    "광고 랜딩 URL은 캠페인별로 별도 QA 후 전환 태그 테스트",
  ],
  scriptReinstallPlan: [
    "page_view, view_item, add_to_cart, begin_checkout, purchase 순서 검증",
    "purchase 이벤트에 order_id, value, currency가 누락 없이 전달되는지 확인",
    "기존 스킨/앱에 남은 픽셀을 제거해 중복 전환 방지",
  ],
};

export const mockWebsiteResponse: WebsiteAIOutput = {
  mainSections: [
    "첫 화면: 핵심 상품군과 구매 CTA",
    "문제 인식: 고객이 느끼는 불편과 기대",
    "추천 카테고리: 베스트/정기구매/선물세트",
    "리뷰와 신뢰 지표",
    "FAQ와 고객센터 연결",
  ],
  brandCopy:
    "매일 반복 가능한 건강 루틴을 쉽게 설계하는 프리미엄 커머스 브랜드입니다.",
  categoryStructure: ["베스트", "정기구매", "건강 루틴", "선물세트", "리뷰"],
  campaignPages: ["신규 고객 웰컴 기획전", "정기구매 혜택 페이지", "리뷰 모음 페이지"],
  ctaCopy: ["내 루틴에 맞는 상품 보기", "첫 구매 혜택 받기", "상담 후 추천받기"],
  trustSections: ["원료 기준", "구매 후기", "배송/교환 안내", "고객센터 응대 원칙"],
  faqSections: ["섭취/사용 방법", "배송", "교환/반품", "정기구매 변경"],
  mobileChecklist: [
    "첫 화면에서 CTA가 접히지 않도록 배치",
    "상품 카드에는 가격, 혜택, 리뷰 수를 함께 표시",
    "결제 전 배송비와 교환 기준 노출",
  ],
  pageBlueprints: [
    "메인: Hero, 베스트 상품, 루틴 추천, 리뷰 요약, FAQ, 구매 CTA 순서로 설계",
    "상품 리스트: 카테고리 필터, 가격/혜택, 리뷰 수, 배송 조건을 카드 안에 고정",
    "기획전: 광고 랜딩용 상단 메시지, 혜택 조건, 상품 묶음, 종료일 안내",
    "고객센터: 배송/교환/반품/환불 정책과 상담원 연결 기준을 분리",
  ],
  seoMetaPlan: [
    "메인 title은 브랜드명 + 핵심 카테고리, description은 혜택보다 신뢰/루틴 중심",
    "카테고리별 canonical과 기존 URL 리다이렉트 매핑 확인",
    "리뷰/FAQ 콘텐츠는 구조화 데이터 적용 후보로 분리",
  ],
  measurementPlan: [
    "Hero CTA 클릭: main_cta_click",
    "상품 카드 클릭: select_item",
    "기획전 CTA 클릭: campaign_cta_click",
    "고객센터 FAQ 클릭: faq_expand",
  ],
  cafe24ThemeTasks: [
    "스킨 백업 후 메인/상품목록/상품상세/주문완료 템플릿 수정 범위 분리",
    "모바일 전용 CSS에서 CTA sticky 영역과 하단 탭바 충돌 여부 확인",
    "카테고리 진열분류와 기획전 URL이 광고 랜딩 URL과 일치하는지 점검",
  ],
  conversionHypotheses: [
    "첫 구매 혜택을 Hero와 상품 카드에 반복 노출하면 광고 유입 고객의 첫 클릭률이 상승",
    "리뷰 요약과 교환/반품 기준을 결제 전 노출하면 구매 불안이 감소",
    "정기구매 CTA를 상품 상세 하단보다 FAQ 직후에 배치하면 반복구매 전환이 증가",
  ],
};

export const mockDetailPageResponse: DetailPageAIOutput = {
  uspSummary: ["하루 한 번 간편한 루틴", "휴대가 쉬운 개별 포장", "선물 가능한 구성"],
  targetCustomer: ["장 건강 루틴을 만들고 싶은 고객", "가족 선물용 상품을 찾는 고객"],
  conversionBarriers: ["건강 관련 효능 단정 표현 주의", "성분과 섭취 방법 확인 필요"],
  headline: "매일 챙기기 쉬운 프리미엄 루틴 세트",
  subHeadline: "복잡한 설명보다 꾸준히 이어가기 쉬운 구성에 집중했습니다.",
  sectionStructure: [
    "고객 공감 문제 제기",
    "상품 USP 3가지",
    "섭취/사용 루틴 안내",
    "리뷰 요약",
    "구매 전 FAQ",
    "안전한 표현의 CTA",
  ],
  faq: [
    "언제 섭취하면 좋나요? 개인 루틴에 맞춰 일정한 시간에 섭취하는 것을 권장합니다.",
    "선물용으로도 적합한가요? 개별 포장과 패키지 구성이 있어 선물용으로도 활용 가능합니다.",
  ],
  cta: ["내 루틴으로 시작하기", "구성 자세히 보기", "첫 구매 혜택 확인"],
  adCopyVariants: [
    "바쁜 일상에도 간편하게 챙기는 데일리 루틴",
    "선물하기 좋은 프리미엄 건강 루틴 구성",
    "복잡한 관리 대신 꾸준함을 돕는 한 박스",
  ],
  offerStack: [
    "첫 구매 10% 혜택 + 3만원 이상 무료배송",
    "정기구매 전환을 위한 2회차 리마인드 쿠폰",
    "리뷰 작성 시 적립금 지급 구조",
  ],
  evidenceBlocks: [
    "휴대성과 섭취 편의성 중심의 실제 리뷰 요약",
    "성분 효능 단정 대신 원료 기준과 섭취 루틴 안내",
    "배송/교환/반품 기준을 구매 전 FAQ에 노출",
  ],
  sectionWireframe: [
    "Hero: 상품명, 가격, 핵심 혜택, 리뷰 요약, sticky CTA",
    "Problem: 고객이 루틴을 놓치는 상황 3가지",
    "Solution: 제품 구성, 섭취 편의성, 보관 방식",
    "Proof: 리뷰, 원료 기준, 배송 신뢰 요소",
    "FAQ: 섭취, 배송, 교환/반품, 정기구매",
  ],
  complianceRewrites: [
    "'장 건강을 치료합니다' -> '장 건강 루틴을 꾸준히 챙기고 싶은 분께 적합합니다'",
    "'100% 효과 보장' -> '개인 루틴과 섭취 환경에 따라 만족도는 달라질 수 있습니다'",
    "'부작용 없음' -> '섭취 전 원료와 알레르기 유발 성분을 확인해 주세요'",
  ],
  cafe24ApplyChecklist: [
    "상품 상세 HTML 백업 후 섹션 단위로 삽입",
    "모바일 상세 이미지 폭, lazy loading, CTA sticky 충돌 확인",
    "상품 옵션/품목명과 광고 소재명 불일치 여부 검수",
    "상품상세 view_item 이벤트와 장바구니 add_to_cart 이벤트 테스트",
  ],
  riskFlags: [
    {
      level: "medium",
      title: "건강 기능 단정 표현 주의",
      description: "효능을 보장하는 문구 대신 루틴, 편의성, 구성 중심 표현을 사용했습니다.",
    },
  ],
};

export const mockCsResponse: CsAIOutput = {
  faq: [
    "배송은 결제 완료 후 영업일 기준 1~3일 내 출고됩니다.",
    "상품 수령 후 7일 이내 미사용 상품에 한해 교환/반품 접수가 가능합니다.",
    "상품별 사용법은 상세페이지와 동봉 안내를 함께 확인해 주세요.",
  ],
  replyTemplates: [
    "문의 주셔서 감사합니다. 확인해 보니 해당 건은 정책상 접수 가능하며, 접수 링크를 안내드리겠습니다.",
    "불편을 드려 죄송합니다. 사진과 주문 정보를 확인한 뒤 상담원이 순차적으로 안내드리겠습니다.",
  ],
  escalationRules: [
    "개인정보, 결제 오류, 배송 사고는 상담원에게 즉시 연결",
    "의학적 효능 또는 부작용 문의는 자동 답변 금지",
    "환불 분쟁 가능성이 있는 표현은 관리자 검토 후 발송",
  ],
  prohibitedClaims: ["완치", "100% 효과", "부작용 없음", "무조건 보장"],
  intentRouting: [
    "배송/교환/반품은 정책형 답변으로 1차 분류",
    "효능, 부작용, 섭취 제한 문의는 상담원 확인 필요로 분류",
    "주문번호, 전화번호가 포함된 문의는 개인정보 마스킹 후 처리",
  ],
  macroTemplates: [
    "배송 지연: 현재 출고 상태 확인 후 예상 출고일과 보상 기준을 안내",
    "상품 문의: 단정 효능 대신 사용 방법, 원료 기준, 주의사항 중심으로 안내",
    "교환/반품: 수령일, 개봉 여부, 사진 증빙 여부를 먼저 확인",
  ],
  qualityChecklist: [
    "환불/반품 가능 여부를 단정하기 전 주문 상태 확인",
    "의학적 판단으로 보일 수 있는 표현 제거",
    "상담원 연결 기준에 해당하면 자동 답변 금지",
    "개인정보가 포함된 문장은 저장/전송 전 마스킹",
  ],
  cafe24IntegrationNotes: [
    "Cafe24 게시판/상품문의 답변 매크로로 복사 가능한 길이와 톤 유지",
    "주문/회원 개인정보는 AI 입력 전 마스킹",
    "상담원용 초안만 생성하고 고객 자동 발송은 비활성",
    "FAQ는 게시판 분류와 상품 상세 FAQ 섹션으로 나누어 적용",
  ],
  riskFlags: [
    {
      level: "high",
      title: "상담원 보조형 운영 필요",
      description: "초기 MVP에서는 고객에게 직접 자동응답하지 않고 상담원 초안으로만 사용해야 합니다.",
    },
  ],
};

export const mockScriptsResponse: ScriptsAIOutput = {
  requiredScripts: [
    "GA4",
    "Google Tag Manager",
    "Google Ads Conversion Tag",
    "Meta Pixel",
    "Naver Ads Conversion Script",
  ],
  requiredEvents: ["page_view", "view_item", "add_to_cart", "begin_checkout", "purchase"],
  dataLayerRequirements: [
    "purchase 이벤트에 transaction_id, value, currency 전달",
    "view_item 이벤트에 item_id, item_name, price 전달",
    "중복 전환 방지를 위해 주문번호 기준 deduplication key 유지",
  ],
  testPlan: [
    "GTM preview 모드에서 page_view 확인",
    "상품 상세 진입 후 view_item 확인",
    "테스트 결제 후 purchase value와 currency 확인",
  ],
  riskFlags: [
    {
      level: "medium",
      title: "중복 전환 가능성",
      description: "GA4와 광고 매체 전환 태그가 동시에 purchase를 수집하므로 deduplication 정책이 필요합니다.",
    },
  ],
};

export const mockPaymentsResponse: PaymentsAIOutput = {
  recommendedPaymentMethods: ["카드결제", "간편결제", "가상계좌", "무통장 입금"],
  pgChecklist: ["사업자 정보", "정산 계좌", "카드사 심사", "모바일 결제 테스트"],
  approvalRequirements: ["간편결제 심사", "환불 정책 고지", "배송상품 판매 약관 확인"],
  conversionRisks: ["모바일에서 결제수단 선택 단계가 길어질 경우 이탈이 증가할 수 있습니다."],
  testPlan: ["소액 테스트 결제", "부분 취소", "현금영수증", "구매 이벤트 value 확인"],
};

export const mockCommandResponse: CommandAIOutput = {
  intent: "migration_checklist",
  title: "서버 이전 체크리스트 생성",
  summary: "현재 프로젝트 기준으로 이전 범위, 리스크, 실행 체크리스트를 생성합니다.",
  steps: ["입력값 확인", "이전 범위 분류", "리스크 플래그 생성", "승인 대기열 등록"],
  targetModule: "migration",
  riskNotes: ["회원/주문 데이터 포함 시 개인정보 검토가 필요합니다."],
  requiresApproval: true,
};
