import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FaqGeneratorCard({ items }: { items: string[] }) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>FAQ 카드</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item} className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{item}</div>
        ))}
      </CardContent>
    </Card>
  );
}
