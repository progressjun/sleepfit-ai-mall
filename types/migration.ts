import type { ApprovalStatus, RiskFlag } from "@/types";
import type { CommercePlatform } from "./project";

export interface MigrationInput {
  currentSiteUrl: string;
  targetSiteUrl: string;
  currentPlatform: CommercePlatform;
  monthlyOrders: number;
  productCount: number;
  needsMemberMigration: boolean;
  needsOrderMigration: boolean;
  needsReviewMigration: boolean;
  needsUrlPreservation: boolean;
  needsAdScriptReinstall: boolean;
  needsPaymentRebuild: boolean;
  scope: string[];
}

export interface MigrationDiagnostic {
  id: string;
  projectId: string;
  complexityScore: number;
  summary: string;
  riskFlags: RiskFlag[];
  checklist: string[];
  estimatedSteps: string[];
  cafe24DataObjects?: string[];
  cafe24AdminChecks?: string[];
  cafe24IntegrationTasks?: string[];
  redirectPlan?: string[];
  scriptReinstallPlan?: string[];
  approvalStatus: ApprovalStatus;
  createdAt: string;
}
