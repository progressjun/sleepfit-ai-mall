import type { AuditAction, AuditLog, RiskLevel } from "@/types";

export function createAuditLog(params: {
  projectId: string;
  action: AuditAction;
  target: string;
  previousStatus?: string;
  nextStatus?: string;
  riskLevel?: RiskLevel;
  apiStatus?: "mock" | "success" | "failed";
  actor?: string;
  failureReason?: string;
}): AuditLog {
  return {
    id: `log_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    actor: params.actor ?? "Demo Admin",
    ...params,
  };
}
