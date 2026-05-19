import { PageSectionCard } from "./page-section-card";
import type { WebsiteGeneration } from "@/types";

export function WebsiteStructurePreview({ generation }: { generation?: WebsiteGeneration }) {
  if (!generation) {
    return (
      <div className="rounded-2xl border border-dashed bg-white p-8 text-sm text-slate-500">
        홈페이지 구조를 생성하면 섹션 구성과 CTA가 여기에 표시됩니다.
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <PageSectionCard title="메인 페이지 섹션" items={generation.mainSections} />
      <PageSectionCard title="페이지별 설계안" items={generation.pageBlueprints ?? []} />
      <PageSectionCard title="카테고리 구조" items={generation.categoryStructure} />
      <PageSectionCard title="이벤트/기획전 구성안" items={generation.campaignPages} />
      <PageSectionCard title="CTA 문구" items={generation.ctaCopy} />
      <PageSectionCard title="전환 가설" items={generation.conversionHypotheses ?? []} />
      <PageSectionCard title="신뢰 요소 섹션" items={generation.trustSections} />
      <PageSectionCard title="SEO 메타 계획" items={generation.seoMetaPlan ?? []} />
      <PageSectionCard title="측정 이벤트 계획" items={generation.measurementPlan ?? []} />
      <PageSectionCard title="Cafe24 스킨 적용 작업" items={generation.cafe24ThemeTasks ?? []} />
      <PageSectionCard title="FAQ 섹션" items={generation.faqSections} />
      <PageSectionCard title="모바일 UX 체크리스트" items={generation.mobileChecklist} />
    </div>
  );
}
