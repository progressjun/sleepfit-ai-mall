import { CheckCircle2Icon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScriptsAIOutput } from "@/lib/ai/schemas";

export function EventChecklist({ guide }: { guide?: ScriptsAIOutput }) {
  const events = guide?.requiredEvents ?? [
    "page_view",
    "dwell_30s",
    "scroll",
    "cart_click",
    "chat_open",
    "chat_message",
    "banner_cta_click",
  ];
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>이벤트 체크리스트</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-2">
        {events.map((event) => (
          <div key={event} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <CheckCircle2Icon className="text-blue-600" />
            {event}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
