import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CodeSnippetCard() {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>SlipAI install snippet</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
{`<script
  async
  src="https://YOUR_SLIPAI_PROJECT.vercel.app/widget/v1.js?v=0.3.2-context-cors-20260521"
  data-project-key="pk_brand_key"
  data-mall-id="brand_mall_id"
  data-widget-token="optional_secret"
  data-dwell-seconds="30"
></script>`}
        </pre>
      </CardContent>
    </Card>
  );
}
