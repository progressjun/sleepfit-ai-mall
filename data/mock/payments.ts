import type { PaymentRecommendation } from "@/types";

export const mockPaymentRecommendations: PaymentRecommendation[] = [
  {
    id: "payment_001",
    projectId: "project_001",
    recommendedPaymentMethods: ["카드결제", "간편결제", "가상계좌", "무통장 입금"],
    pgChecklist: ["사업자 정보 확인", "정산 계좌 검증", "구매 완료 페이지 테스트"],
    approvalRequirements: ["간편결제 심사", "카드사 심사", "취소/환불 정책 고지"],
    conversionRisks: ["모바일 결제 단계가 길어질 경우 이탈 가능성이 있습니다."],
    testPlan: ["1,000원 테스트 결제", "부분 취소", "영수증 발행", "구매 이벤트 value 확인"],
    createdAt: "2026-05-06T07:20:00.000Z",
  },
];
