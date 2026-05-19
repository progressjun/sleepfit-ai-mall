import { CheckCircle2Icon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MigrationChecklist({
  items,
  title = "작업 체크리스트",
}: {
  items: string[];
  title?: string;
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-2">
        {(items.length ? items : ["생성 후 세부 항목이 표시됩니다."]).map((item) => (
          <div key={item} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <CheckCircle2Icon className="text-emerald-600" />
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
