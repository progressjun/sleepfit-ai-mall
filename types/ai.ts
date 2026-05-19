import type { RiskFlag } from "@/types";

export type CommandIntent =
  | "migration_checklist"
  | "website_structure"
  | "detail_page_copy"
  | "cs_templates"
  | "marketing_scripts"
  | "payment_recommendation"
  | "risk_review"
  | "unknown";

export interface CommandParseResult {
  intent: CommandIntent;
  title: string;
  summary: string;
  steps: string[];
  targetModule: string;
  riskNotes: string[];
  requiresApproval: boolean;
}

export interface CommandMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  plan?: CommandParseResult;
}

export type WorkbenchTaskStatus =
  | "planned"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export interface WorkbenchTask {
  id: string;
  intent: CommandIntent;
  title: string;
  targetModule: string;
  summary: string;
  steps: string[];
  riskLevel: "low" | "medium" | "high";
  approvalType:
    | "migration"
    | "website"
    | "detail_page"
    | "ai_cs"
    | "marketing_script"
    | "payments"
    | "ad_copy";
  status: WorkbenchTaskStatus;
}

export interface WorkbenchRun {
  id: string;
  projectId: string;
  title: string;
  originalCommand: string;
  summary: string;
  assumptions: string[];
  riskNotes: string[];
  successCriteria: string[];
  tasks: WorkbenchTask[];
  createdAt: string;
  updatedAt: string;
}

export interface CsPolicyInput {
  shippingPolicy: string;
  exchangePolicy: string;
  returnPolicy: string;
  refundPolicy: string;
  productInquiryRule: string;
  prohibitedExpressions: string;
  escalationCriteria: string;
  responseTone: "친절한" | "간결한" | "프리미엄" | "사무적인" | "공감형";
}

export interface CsPolicyGeneration {
  id: string;
  projectId: string;
  faq: string[];
  replyTemplates: string[];
  escalationRules: string[];
  prohibitedClaims: string[];
  intentRouting?: string[];
  macroTemplates?: string[];
  qualityChecklist?: string[];
  cafe24IntegrationNotes?: string[];
  riskFlags: RiskFlag[];
  createdAt: string;
}

export interface ScriptGuideGeneration {
  requiredScripts: string[];
  requiredEvents: string[];
  dataLayerRequirements: string[];
  testPlan: string[];
  riskFlags: RiskFlag[];
}
