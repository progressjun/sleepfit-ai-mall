import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProjectProgress({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>프로젝트 진행률</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="text-slate-500">{item.value}%</span>
            </div>
            <Progress value={item.value} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
