"use client";

import { SectionHeader } from "@/components/common/section-header";
import { ActivityTimeline } from "@/components/logs/activity-timeline";
import { AuditLogTable } from "@/components/logs/audit-log-table";
import { useDemoStore } from "@/lib/store/use-demo-store";

export default function LogsPage() {
  const logs = useDemoStore((state) => state.auditLogs);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="작업 로그"
        description="생성, 승인, 반려, 적용 준비, 테스트 완료 이력을 추적합니다."
      />
      <AuditLogTable logs={logs} />
      <ActivityTimeline logs={logs} />
    </div>
  );
}
