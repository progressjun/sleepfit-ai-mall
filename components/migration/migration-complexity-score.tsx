import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function MigrationComplexityScore({ score }: { score: number }) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>이전 복잡도 점수</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end gap-2">
          <span className="text-4xl font-semibold text-slate-950">{score}</span>
          <span className="pb-1 text-sm text-slate-500">/ 100</span>
        </div>
        <Progress value={score} />
      </CardContent>
    </Card>
  );
}
