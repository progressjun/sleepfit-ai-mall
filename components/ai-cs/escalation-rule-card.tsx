import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EscalationRuleCard({ items }: { items: string[] }) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>상담원 연결 규칙</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item} className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{item}</div>
        ))}
      </CardContent>
    </Card>
  );
}
