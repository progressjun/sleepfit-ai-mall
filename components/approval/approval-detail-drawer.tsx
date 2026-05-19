"use client";

import { ApprovalActionBar } from "./approval-action-bar";
import { RiskBadge } from "@/components/common/risk-badge";
import { StatusBadge } from "@/components/common/status-badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ApprovalItem } from "@/types";

export function ApprovalDetailDrawer({
  item,
  open,
  onOpenChange,
}: {
  item?: ApprovalItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{item?.title ?? "승인 항목"}</SheetTitle>
          <SheetDescription>{item?.summary}</SheetDescription>
        </SheetHeader>
        {item && (
          <div className="flex flex-1 flex-col gap-4 overflow-auto px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={item.status} />
              <RiskBadge level={item.riskLevel} />
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="mb-2 text-sm font-semibold text-slate-950">Payload</p>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-700">
                {JSON.stringify(item.payload, null, 2)}
              </pre>
            </div>
            <ApprovalActionBar item={item} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
