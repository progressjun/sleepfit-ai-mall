import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuditLog } from "@/types";

export function RecentActivity({ logs }: { logs: AuditLog[] }) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>최근 작업 로그</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {logs.slice(0, 6).map((log) => (
          <div key={log.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">
            <div>
              <p className="text-sm font-medium text-slate-900">{log.target}</p>
              <p className="text-xs text-slate-500">{log.actor} · {log.action}</p>
            </div>
            <time className="shrink-0 text-xs text-slate-500">
              {new Date(log.createdAt).toLocaleDateString("ko-KR")}
            </time>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
