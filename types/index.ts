export type ApprovalStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "applied"
  | "ready_to_apply"
  | "blocked_by_risk";

export type WorkStatus =
  | "not_started"
  | "in_progress"
  | "pending_review"
  | "approved"
  | "ready_to_apply"
  | "applied"
  | "failed";

export type RiskLevel = "low" | "medium" | "high";

export interface RiskFlag {
  level: RiskLevel;
  title: string;
  description: string;
}

export interface MarketingEventStatus {
  eventName: string;
  status: "not_started" | "pending_test" | "tested";
}

export interface MarketingScript {
  id: string;
  projectId: string;
  name: string;
  status: "not_started" | "installed" | "active";
  events: MarketingEventStatus[];
  notes: string;
  required: boolean;
}

export interface PaymentInput {
  averageOrderValue: number;
  expectedMonthlyVolume: number;
  expectedMonthlyOrders: number;
  needsSubscription: boolean;
  needsEasyPay: boolean;
  needsGlobalPayment: boolean;
  needsNaverPay: boolean;
  needsKakaoPay: boolean;
  needsTossPay: boolean;
  cardPayment: boolean;
  virtualAccount: boolean;
  bankTransfer: boolean;
  productType: "배송상품" | "디지털상품" | "혼합";
}

export interface PaymentRecommendation {
  id: string;
  projectId: string;
  recommendedPaymentMethods: string[];
  pgChecklist: string[];
  approvalRequirements: string[];
  conversionRisks: string[];
  testPlan: string[];
  createdAt: string;
}

export type JsonRecord = Record<string, unknown>;

export * from "./ai";
export * from "./approval";
export * from "./commerce";
export * from "./logs";
export * from "./migration";
export * from "./product";
export * from "./project";
export * from "./website";
