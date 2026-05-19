import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/common/risk-badge";
import type { RiskFlag } from "@/types";

export function RiskFlagPanel({ flags }: { flags: RiskFlag[] }) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>리스크 플래그</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {flags.length === 0 && <p className="text-sm text-slate-500">감지된 리스크가 없습니다.</p>}
        {flags.map((flag) => (
          <div key={flag.title} className="rounded-xl border bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-950">{flag.title}</p>
              <RiskBadge level={flag.level} />
            </div>
            <p className="text-xs leading-5 text-slate-600">{flag.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
