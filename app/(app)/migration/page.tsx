"use client";

import { SectionHeader } from "@/components/common/section-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Cafe24ReadinessPanel } from "@/components/cafe24/cafe24-readiness-panel";
import { MigrationChecklist } from "@/components/migration/migration-checklist";
import { MigrationComplexityScore } from "@/components/migration/migration-complexity-score";
import { MigrationRiskPanel } from "@/components/migration/migration-risk-panel";
import { MigrationScopeForm } from "@/components/migration/migration-scope-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoStore } from "@/lib/store/use-demo-store";

export default function MigrationPage() {
  const { migrationDiagnostics } = useDemoStore();
  const latest = migrationDiagnostics[0];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="서버 이전 진단"
        description="기존 쇼핑몰 이전 범위와 리스크를 진단하고 실행 체크리스트를 생성합니다."
      />
      <Cafe24ReadinessPanel />
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <MigrationScopeForm />
        <div className="flex flex-col gap-4">
          <MigrationComplexityScore score={latest?.complexityScore ?? 0} />
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>승인 상태</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <StatusBadge status={latest?.approvalStatus ?? "draft"} />
              <p className="text-sm leading-6 text-slate-600">
                생성된 진단은 승인 대기열에서 검토 후 적용 준비 상태로 이동합니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      {latest && (
        <>
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>진단 요약</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-slate-700">{latest.summary}</CardContent>
          </Card>
          <MigrationRiskPanel flags={latest.riskFlags} />
          <MigrationChecklist title="이전 실행 체크리스트" items={latest.checklist} />
          <div className="grid gap-4 xl:grid-cols-2">
            <MigrationChecklist title="Cafe24 데이터 객체" items={latest.cafe24DataObjects ?? []} />
            <MigrationChecklist title="Cafe24 관리자/스킨 체크" items={latest.cafe24AdminChecks ?? []} />
            <MigrationChecklist title="URL 리다이렉트 계획" items={latest.redirectPlan ?? []} />
            <MigrationChecklist title="스크립트 재설치 계획" items={latest.scriptReinstallPlan ?? []} />
          </div>
        </>
      )}
    </div>
  );
}
