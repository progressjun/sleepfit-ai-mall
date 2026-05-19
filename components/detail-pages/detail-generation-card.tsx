import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DetailPageGeneration } from "@/types";

export function DetailGenerationCard({ generation }: { generation?: DetailPageGeneration }) {
  return (
    <Card className="border-slate-200 bg-gradient-to-br from-white to-violet-50 shadow-sm">
      <CardHeader>
        <CardTitle>생성 결과 요약</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm leading-6 text-slate-700">
        <p>{generation?.headline ?? "아직 생성된 초안이 없습니다."}</p>
        {generation && <p className="text-slate-500">{generation.cta.join(" · ")}</p>}
      </CardContent>
    </Card>
  );
}
