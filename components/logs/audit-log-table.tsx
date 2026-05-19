"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/common/risk-badge";
import type { AuditAction, AuditLog } from "@/types";

const filters: (AuditAction | "all")[] = [
  "all",
  "ai_generated",
  "approved",
  "rejected",
  "ready_to_apply",
  "script_tested",
];

export function AuditLogTable({ logs }: { logs: AuditLog[] }) {
  const [filter, setFilter] = useState<AuditAction | "all">("all");
  const filtered = useMemo(
    () => logs.filter((log) => filter === "all" || log.action === filter),
    [filter, logs],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {filters.map((value) => (
          <Button key={value} variant={filter === value ? "default" : "outline"} size="sm" onClick={() => setFilter(value)}>
            {value}
          </Button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-3">시간</th>
              <th className="px-4 py-3">작업자</th>
              <th className="px-4 py-3">작업 유형</th>
              <th className="px-4 py-3">대상</th>
              <th className="px-4 py-3">상태 변경</th>
              <th className="px-4 py-3">리스크</th>
              <th className="px-4 py-3">API</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-4 text-slate-600">{new Date(log.createdAt).toLocaleString("ko-KR")}</td>
                <td className="px-4 py-4 text-slate-700">{log.actor}</td>
                <td className="px-4 py-4 text-slate-700">{log.action}</td>
                <td className="px-4 py-4 font-medium text-slate-950">{log.target}</td>
                <td className="px-4 py-4 text-slate-600">{log.previousStatus ?? "-"} → {log.nextStatus ?? "-"}</td>
                <td className="px-4 py-4">{log.riskLevel ? <RiskBadge level={log.riskLevel} /> : "-"}</td>
                <td className="px-4 py-4 text-slate-600">{log.apiStatus ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
