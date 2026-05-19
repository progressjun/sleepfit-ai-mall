"use client";

import { CheckIcon, RotateCcwIcon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoStore } from "@/lib/store/use-demo-store";
import type { ApprovalItem } from "@/types";

export function ApprovalActionBar({ item }: { item: ApprovalItem }) {
  const { approveItem, rejectItem, markItemAsApplied, addAuditLog } = useDemoStore();

  function approve() {
    if (item.riskLevel === "high" && !window.confirm("높은 리스크 항목입니다. 검토 후 승인하시겠습니까?")) {
      return;
    }
    approveItem(item.id);
    addAuditLog({
      actor: "Demo Admin",
      action: "approved",
      target: item.title,
      previousStatus: item.status,
      nextStatus: "approved",
      riskLevel: item.riskLevel,
      apiStatus: "mock",
    });
  }

  function reject() {
    rejectItem(item.id);
    addAuditLog({
      actor: "Demo Admin",
      action: "rejected",
      target: item.title,
      previousStatus: item.status,
      nextStatus: "rejected",
      riskLevel: item.riskLevel,
      apiStatus: "mock",
    });
  }

  function ready() {
    markItemAsApplied(item.id);
    addAuditLog({
      actor: "Demo Admin",
      action: "ready_to_apply",
      target: item.title,
      previousStatus: item.status,
      nextStatus: "ready_to_apply",
      riskLevel: item.riskLevel,
      apiStatus: "mock",
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={approve} disabled={item.status === "approved" || item.status === "applied"}>
        <CheckIcon />
        승인
      </Button>
      <Button variant="outline" onClick={reject} disabled={item.status === "rejected"}>
        <RotateCcwIcon />
        반려
      </Button>
      <Button
        variant="outline"
        onClick={ready}
        disabled={item.status === "blocked_by_risk" || item.status === "ready_to_apply"}
      >
        <SendIcon />
        적용 준비 완료
      </Button>
    </div>
  );
}
