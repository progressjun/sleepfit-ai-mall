export const cafe24CapabilityChecklist = [
  {
    area: "OAuth/App",
    items: ["앱 권한 범위", "access token/refresh token 저장", "토큰 갱신 실패 시 재연결 플로우"],
  },
  {
    area: "상품",
    items: ["상품 기본정보", "옵션/품목", "진열분류", "추가 이미지", "상세 HTML"],
  },
  {
    area: "주문/회원",
    items: ["주문 조회 범위", "회원 등급/적립금", "휴면/탈퇴 회원 제외", "개인정보 보관 기간"],
  },
  {
    area: "디자인 스킨",
    items: ["스킨 백업", "공통 레이아웃", "상품상세", "장바구니", "주문완료 템플릿"],
  },
  {
    area: "마케팅 측정",
    items: ["GTM 삽입 위치", "purchase 이벤트", "value/currency", "중복 전환 방지"],
  },
];

export const cafe24RequiredScopes = [
  "mall.read_product",
  "mall.write_product",
  "mall.read_order",
  "mall.read_customer",
  "mall.read_promotion",
  "mall.write_application",
];
