"use client";

import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useDemoStore } from "@/lib/store/use-demo-store";

export function ScriptStatusTable() {
  const { marketingScripts, updateMarketingScriptStatus, addAuditLog } = useDemoStore();

  function markTested(scriptId: string, eventName: string) {
    updateMarketingScriptStatus(scriptId, eventName);
    addAuditLog({
      actor: "Demo Admin",
      action: "script_tested",
      target: `${eventName} 테스트 완료`,
      previousStatus: "pending_test",
      nextStatus: "tested",
      riskLevel: eventName === "purchase" ? "medium" : "low",
      apiStatus: "mock",
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
          <tr>
            <th className="px-4 py-3">스크립트</th>
            <th className="px-4 py-3">설치 상태</th>
            <th className="px-4 py-3">이벤트</th>
            <th className="px-4 py-3">액션</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {marketingScripts.map((script) => (
            <tr key={script.id}>
              <td className="px-4 py-4 font-medium text-slate-950">
                {script.name}
                <p className="mt-1 text-xs font-normal text-slate-500">{script.notes}</p>
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={script.status === "not_started" ? "not_started" : script.status === "installed" ? "in_progress" : "applied"} />
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  {script.events.map((event) => (
                    <span key={event.eventName} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                      {event.eventName}: {event.status}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-col gap-2">
                  {script.events.map((event) => (
                    <Button
                      key={event.eventName}
                      variant="outline"
                      size="sm"
                      disabled={event.status === "tested"}
                      onClick={() => markTested(script.id, event.eventName)}
                    >
                      <CheckIcon />
                      테스트 완료 처리
                    </Button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
