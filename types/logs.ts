import type { RiskLevel } from "@/types";

export type AuditAction =
  | "project_created"
  | "ai_generated"
  | "approved"
  | "rejected"
  | "ready_to_apply"
  | "applied"
  | "script_tested"
  | "command_executed";

export interface AuditLog {
  id: string;
  projectId: string;
  createdAt: string;
  actor: string;
  action: AuditAction;
  target: string;
  previousStatus?: string;
  nextStatus?: string;
  riskLevel?: RiskLevel;
  failureReason?: string;
  apiStatus?: "mock" | "success" | "failed";
}
