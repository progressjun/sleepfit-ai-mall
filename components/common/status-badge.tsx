import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ApprovalStatus, WorkStatus } from "@/types";

const labels: Record<ApprovalStatus | WorkStatus, string> = {
  draft: "초안",
  pending_review: "승인 대기",
  approved: "승인됨",
  rejected: "반려",
  applied: "적용됨",
  blocked_by_risk: "리스크 차단",
  not_started: "미진행",
  in_progress: "진행중",
  ready_to_apply: "적용 준비",
  failed: "실패",
};

const tone: Record<ApprovalStatus | WorkStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending_review: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  applied: "bg-green-100 text-green-800",
  blocked_by_risk: "bg-red-100 text-red-800",
  not_started: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-800",
  ready_to_apply: "bg-violet-100 text-violet-800",
  failed: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: ApprovalStatus | WorkStatus }) {
  return (
    <Badge variant="secondary" className={cn("border-transparent", tone[status])}>
      {labels[status]}
    </Badge>
  );
}
