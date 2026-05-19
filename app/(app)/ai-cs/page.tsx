"use client";

import { SectionHeader } from "@/components/common/section-header";
import { RiskFlagPanel } from "@/components/detail-pages/risk-flag-panel";
import { CsPolicyForm } from "@/components/ai-cs/cs-policy-form";
import { EscalationRuleCard } from "@/components/ai-cs/escalation-rule-card";
import { FaqGeneratorCard } from "@/components/ai-cs/faq-generator-card";
import { ReplyTemplateCard } from "@/components/ai-cs/reply-template-card";
import { Cafe24ReadinessPanel } from "@/components/cafe24/cafe24-readiness-panel";
import { PageSectionCard } from "@/components/website/page-section-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoStore } from "@/lib/store/use-demo-store";

export default function AiCsPage() {
  const latest = useDemoStore((state) => state.csPolicies[0]);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="AI CS 지원"
        description="OpenAI 기반으로 상담원 답변 초안, FAQ, 반복 문의 대응 템플릿을 생성합니다."
      />
      <Cafe24ReadinessPanel />
      <div className="grid gap-6 2xl:grid-cols-[520px_minmax(0,1fr)]">
        <CsPolicyForm />
        <div className="grid gap-4 xl:grid-cols-2">
          <FaqGeneratorCard items={latest?.faq ?? []} />
          <ReplyTemplateCard items={latest?.replyTemplates ?? []} />
          <EscalationRuleCard items={latest?.escalationRules ?? []} />
          <PageSectionCard title="문의 Intent Routing" items={latest?.intentRouting ?? []} />
          <PageSectionCard title="상담원 매크로" items={latest?.macroTemplates ?? []} />
          <PageSectionCard title="품질 검수 체크리스트" items={latest?.qualityChecklist ?? []} />
          <PageSectionCard title="Cafe24 게시판/상품문의 적용 메모" items={latest?.cafe24IntegrationNotes ?? []} />
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>금지 표현</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(latest?.prohibitedClaims ?? []).map((claim) => (
                <span key={claim} className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">{claim}</span>
              ))}
            </CardContent>
          </Card>
          <div className="xl:col-span-2">
            <RiskFlagPanel flags={latest?.riskFlags ?? []} />
          </div>
        </div>
      </div>
    </div>
  );
}
