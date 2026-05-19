"use client";

import { useState } from "react";
import { Loader2Icon, WandSparklesIcon } from "lucide-react";
import { SectionHeader } from "@/components/common/section-header";
import { CodeSnippetCard } from "@/components/marketing-scripts/code-snippet-card";
import { EventChecklist } from "@/components/marketing-scripts/event-checklist";
import { ScriptStatusTable } from "@/components/marketing-scripts/script-status-table";
import { TestEventPanel } from "@/components/marketing-scripts/test-event-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { postJson } from "@/lib/client-api";
import { useDemoStore } from "@/lib/store/use-demo-store";
import type { ScriptsAIOutput } from "@/lib/ai/schemas";
import type { RiskLevel } from "@/types";

function riskFromFlags(flags: { level: RiskLevel }[]): RiskLevel {
  if (flags.some((flag) => flag.level === "high")) return "high";
  if (flags.some((flag) => flag.level === "medium")) return "medium";
  return "low";
}

export default function MarketingScriptsPage() {
  const store = useDemoStore();
  const [isLoading, setIsLoading] = useState(false);
  const dataLayerRequirements: string[] =
    store.latestScriptGuide?.dataLayerRequirements ??
    ["설치 가이드를 생성하면 dataLayer 요구사항이 표시됩니다."];

  async function generateGuide() {
    setIsLoading(true);
    try {
      const result = await postJson<ScriptsAIOutput>("/api/ai/scripts", {
        selectedScripts: store.marketingScripts.map((script) => script.name),
        requiredEvents: ["page_view", "view_item", "add_to_cart", "begin_checkout", "purchase", "sign_up", "generate_lead"],
        commerceGoal: "광고 전환 측정과 리마케팅",
      });
      store.saveScriptGuide(result.data);
      const riskLevel = riskFromFlags(result.data.riskFlags);
      store.createApprovalItem({
        type: "marketing_script",
        title: "마케팅 스크립트 설치 가이드",
        summary: result.data.testPlan[0],
        status: "pending_review",
        riskLevel,
        payload: { guide: result.data },
      });
      store.addAuditLog({
        actor: "AI Assistant",
        action: "ai_generated",
        target: "마케팅 스크립트 설치 가이드 생성",
        nextStatus: "pending_review",
        riskLevel,
        apiStatus: result.source,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="마케팅툴 스크립트 설치 지원"
        description="GA4, 광고 매체 픽셀, 구매 이벤트, 전환 value 전달 상태를 점검합니다."
        action={
          <Button onClick={generateGuide} disabled={isLoading} className="bg-gradient-to-r from-violet-600 to-blue-600 text-white">
            {isLoading ? <Loader2Icon className="animate-spin" /> : <WandSparklesIcon />}
            설치 가이드 생성
          </Button>
        }
      />
      <ScriptStatusTable />
      <div className="grid gap-4 xl:grid-cols-2">
        <EventChecklist guide={store.latestScriptGuide} />
        <TestEventPanel />
        <CodeSnippetCard />
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>AI 설치 가이드</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {dataLayerRequirements.map((item) => (
              <div key={item} className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{item}</div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
