"use client";

import {
  CheckCircle2Icon,
  CircleDashedIcon,
  Loader2Icon,
  PlayIcon,
  XCircleIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/common/risk-badge";
import type { WorkbenchTask } from "@/types";

const statusLabel: Record<WorkbenchTask["status"], string> = {
  planned: "계획됨",
  running: "실행 중",
  completed: "완료",
  failed: "실패",
  skipped: "건너뜀",
};

const statusIcon = {
  planned: CircleDashedIcon,
  running: Loader2Icon,
  completed: CheckCircle2Icon,
  failed: XCircleIcon,
  skipped: CircleDashedIcon,
};

export function WorkbenchTaskCard({
  task,
  selected,
  disabled,
  onToggle,
  onRun,
}: {
  task: WorkbenchTask;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
  onRun: () => void;
}) {
  const Icon = statusIcon[task.status];

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{task.title}</CardTitle>
            <RiskBadge level={task.riskLevel} />
          </div>
          <p className="text-sm leading-6 text-slate-600">{task.summary}</p>
        </div>
        <label className="flex shrink-0 items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            disabled={disabled || task.status === "completed"}
          />
          선택
        </label>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{task.targetModule}</Badge>
          <Badge variant="outline">{task.approvalType}</Badge>
          <Badge variant="outline" className="gap-1">
            <Icon className={task.status === "running" ? "animate-spin" : ""} />
            {statusLabel[task.status]}
          </Badge>
        </div>
        <ol className="grid list-decimal gap-2 pl-5 text-sm leading-6 text-slate-700 md:grid-cols-2">
          {task.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <Button
          variant="outline"
          size="sm"
          onClick={onRun}
          disabled={disabled || task.status === "running" || task.status === "completed"}
          className="self-start"
        >
          <PlayIcon />
          이 작업만 실행
        </Button>
      </CardContent>
    </Card>
  );
}
