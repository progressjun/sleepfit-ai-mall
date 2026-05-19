"use client";

import { useState } from "react";
import { ApprovalDetailDrawer } from "@/components/approval/approval-detail-drawer";
import { ApprovalTable } from "@/components/approval/approval-table";
import { SectionHeader } from "@/components/common/section-header";
import { useDemoStore } from "@/lib/store/use-demo-store";
import type { ApprovalItem } from "@/types";

export default function ApprovalPage() {
  const items = useDemoStore((state) => state.approvalItems);
  const [selected, setSelected] = useState<ApprovalItem | undefined>();

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="승인 대기열"
        description="AI가 생성한 문구, 체크리스트, 스크립트 가이드, 페이먼츠 추천안을 검수합니다."
      />
      <ApprovalTable items={items} onSelect={setSelected} />
      <ApprovalDetailDrawer item={selected} open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(undefined)} />
    </div>
  );
}
