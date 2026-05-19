import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ReadinessScoreCard({ score }: { score: number }) {
  const label =
    score >= 80 ? "광고 집행 준비에 가깝습니다" : score >= 50 ? "핵심 준비가 진행 중입니다" : "기초 세팅이 더 필요합니다";

  return (
    <Card className="border-slate-200 bg-gradient-to-br from-white to-cyan-50 shadow-sm">
      <CardHeader>
        <CardTitle>전환 운영 준비도 점수</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end gap-2">
          <span className="text-5xl font-semibold text-slate-950">{score}</span>
          <span className="pb-2 text-sm font-medium text-slate-500">/ 100</span>
        </div>
        <Progress value={score} className="[&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-violet-600 [&_[data-slot=progress-indicator]]:to-cyan-500" />
        <p className="text-sm leading-6 text-slate-600">{label}</p>
      </CardContent>
    </Card>
  );
}
