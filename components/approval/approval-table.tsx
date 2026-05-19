"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/common/risk-badge";
import { StatusBadge } from "@/components/common/status-badge";
import type { ApprovalItem, ApprovalStatus, RiskLevel } from "@/types";

export function ApprovalTable({
  items,
  onSelect,
}: {
  items: ApprovalItem[];
  onSelect: (item: ApprovalItem) => void;
}) {
  const [status, setStatus] = useState<ApprovalStatus | "all">("all");
  const [risk, setRisk] = useState<RiskLevel | "all">("all");
  const filtered = useMemo(
    () =>
      items.filter(
        (item) => (status === "all" || item.status === status) && (risk === "all" || item.riskLevel === risk),
      ),
    [items, risk, status],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {(["all", "pending_review", "approved", "rejected", "ready_to_apply"] as const).map((value) => (
          <Button key={value} variant={status === value ? "default" : "outline"} size="sm" onClick={() => setStatus(value)}>
            {value}
          </Button>
        ))}
        {(["all", "low", "medium", "high"] as const).map((value) => (
          <Button key={value} variant={risk === value ? "default" : "outline"} size="sm" onClick={() => setRisk(value)}>
            {value}
          </Button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-3">작업물</th>
              <th className="px-4 py-3">유형</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">리스크</th>
              <th className="px-4 py-3">상세</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-4">
                  <p className="font-medium text-slate-950">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.summary}</p>
                </td>
                <td className="px-4 py-4 text-slate-600">{item.type}</td>
                <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-4"><RiskBadge level={item.riskLevel} /></td>
                <td className="px-4 py-4">
                  <Button variant="outline" size="sm" onClick={() => onSelect(item)}>열기</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
