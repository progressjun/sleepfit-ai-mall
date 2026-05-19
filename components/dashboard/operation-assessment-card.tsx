import { AlertCircleIcon, CheckCircle2Icon, GaugeIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MarketingScript, MigrationDiagnostic, RiskFlag } from "@/types";

export function OperationAssessmentCard({
  score,
  migration,
  riskFlags,
  scripts,
  detailCount,
}: {
  score: number;
  migration?: MigrationDiagnostic;
  riskFlags: RiskFlag[];
  scripts: MarketingScript[];
  detailCount: number;
}) {
  const requiredScripts = scripts.filter((script) => script.required);
  const untestedPurchase = scripts.some((script) =>
    script.events.some((event) => event.eventName === "purchase" && event.status !== "tested"),
  );
  const highRisks = riskFlags.filter((flag) => flag.level === "high");
  const verdict =
    score >= 80 && highRisks.length === 0 && !untestedPurchase
      ? "광고 집행 전환 운영 가능"
      : score >= 60
        ? "실행 전 핵심 검수 필요"
        : "제안/설계 단계 보강 필요";

  const blockers = [
    ...(migration?.redirectPlan?.length ? [] : ["URL 리다이렉트 매핑표가 아직 충분하지 않습니다."]),
    ...(untestedPurchase ? ["purchase 이벤트 value/currency 테스트가 남아 있습니다."] : []),
    ...(detailCount < 3 ? ["광고 집행용 상세페이지 초안이 최소 3개 미만입니다."] : []),
    ...(highRisks.length ? ["높은 리스크 항목은 승인 전 표현/개인정보 검토가 필요합니다."] : []),
  ];

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GaugeIcon />
          전체 판단
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-2xl bg-slate-950 p-5 text-white">
          <p className="text-sm text-slate-300">현재 판정</p>
          <p className="mt-2 text-2xl font-semibold leading-8">{verdict}</p>
          <p className="mt-4 text-sm text-slate-300">준비도 {score}/100</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <CheckCircle2Icon className="text-emerald-600" />
              확인된 기반
            </div>
            <ul className="mt-3 flex flex-col gap-2 text-sm leading-6 text-slate-700">
              <li>필수 스크립트 {requiredScripts.length}개 관리 중</li>
              <li>Cafe24 데이터/스킨/리다이렉트 체크 항목 노출</li>
              <li>승인 대기열과 작업 로그로 자동 적용 차단</li>
            </ul>
          </div>
          <div className="rounded-2xl border bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
              <AlertCircleIcon />
              다음 우선순위
            </div>
            <ul className="mt-3 flex flex-col gap-2 text-sm leading-6 text-amber-900">
              {(blockers.length ? blockers : ["남은 차단 요소가 없습니다."]).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
