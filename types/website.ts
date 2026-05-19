import type { ApprovalStatus } from "@/types";

export interface WebsiteBriefInput {
  brandName: string;
  industry: string;
  productGroups: string;
  coreCustomers: string;
  brandTone: string;
  mainCtaGoal: "구매 유도" | "상담 문의" | "회원가입" | "이벤트 참여";
  requiredPages: string[];
}

export interface WebsiteGeneration {
  id: string;
  projectId: string;
  mainSections: string[];
  brandCopy: string;
  categoryStructure: string[];
  campaignPages: string[];
  ctaCopy: string[];
  trustSections: string[];
  faqSections: string[];
  mobileChecklist: string[];
  pageBlueprints?: string[];
  seoMetaPlan?: string[];
  measurementPlan?: string[];
  cafe24ThemeTasks?: string[];
  conversionHypotheses?: string[];
  approvalStatus: ApprovalStatus;
  createdAt: string;
}
