import type { ApprovalStatus, RiskFlag } from "@/types";

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  features: string[];
  targetCustomer: string;
  barriers: string[];
  reviewSummary: string;
  differentiators: string[];
  cautionExpressions: string[];
}

export interface DetailPageInput {
  productId: string;
  productName: string;
  price: number;
  category: string;
  features: string;
  targetCustomer: string;
  purchaseBarriers: string;
  reviewSummary: string;
  differentiators: string;
  cautionExpressions: string;
}

export interface DetailPageGeneration {
  id: string;
  projectId: string;
  productId: string;
  uspSummary: string[];
  targetCustomer: string[];
  conversionBarriers: string[];
  headline: string;
  subHeadline: string;
  sectionStructure: string[];
  faq: string[];
  cta: string[];
  adCopyVariants: string[];
  offerStack?: string[];
  evidenceBlocks?: string[];
  sectionWireframe?: string[];
  complianceRewrites?: string[];
  cafe24ApplyChecklist?: string[];
  riskFlags: RiskFlag[];
  approvalStatus: ApprovalStatus;
  createdAt: string;
}
