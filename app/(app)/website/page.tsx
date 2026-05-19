"use client";

import { SectionHeader } from "@/components/common/section-header";
import { Cafe24ReadinessPanel } from "@/components/cafe24/cafe24-readiness-panel";
import { WebsiteBriefForm } from "@/components/website/website-brief-form";
import { WebsiteStructurePreview } from "@/components/website/website-structure-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoStore } from "@/lib/store/use-demo-store";

export default function WebsitePage() {
  const latest = useDemoStore((state) => state.websiteGenerations[0]);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="홈페이지 제작 지원"
        description="브랜드몰 구조, 핵심 페이지, CTA, 신뢰 요소를 광고 유입 고객 기준으로 설계합니다."
      />
      <Cafe24ReadinessPanel />
      <div className="grid gap-6 2xl:grid-cols-[520px_minmax(0,1fr)]">
        <WebsiteBriefForm />
        <div className="flex flex-col gap-4">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>브랜드 소개 카피</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-slate-700">
              {latest?.brandCopy ?? "생성된 브랜드 소개 카피가 여기에 표시됩니다."}
            </CardContent>
          </Card>
          <WebsiteStructurePreview generation={latest} />
        </div>
      </div>
    </div>
  );
}
