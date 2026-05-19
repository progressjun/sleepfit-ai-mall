import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CodeSnippetCard() {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Data Layer 예시</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
{`window.dataLayer.push({
  event: "purchase",
  transaction_id: "ORDER_ID",
  value: 59000,
  currency: "KRW",
  items: [{ item_id: "product_001", item_name: "상품명" }]
});`}
        </pre>
      </CardContent>
    </Card>
  );
}
