import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PageSectionCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {(items.length ? items : ["생성 후 세부 항목이 표시됩니다."]).map((item) => (
          <div key={item} className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
