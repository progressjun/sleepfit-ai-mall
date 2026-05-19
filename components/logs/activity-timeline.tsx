import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuditLog } from "@/types";

export function ActivityTimeline({ logs }: { logs: AuditLog[] }) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>타임라인 보기</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {logs.slice(0, 8).map((log) => (
          <div key={log.id} className="relative flex gap-3">
            <div className="mt-1 size-2 rounded-full bg-violet-600" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-slate-950">{log.target}</p>
              <p className="text-xs text-slate-500">
                {new Date(log.createdAt).toLocaleString("ko-KR")} · {log.actor}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
