import type { ApprovalStatus, RiskLevel } from "@/types";

export type ApprovalItemType =
  | "migration"
  | "website"
  | "detail_page"
  | "ai_cs"
  | "marketing_script"
  | "payments"
  | "seo_meta"
  | "ad_copy";

export interface ApprovalItem {
  id: string;
  projectId: string;
  type: ApprovalItemType;
  title: string;
  summary: string;
  status: ApprovalStatus;
  riskLevel: RiskLevel;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
