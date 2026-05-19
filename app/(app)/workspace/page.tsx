"use client";

import { Cafe24ReadinessPanel } from "@/components/cafe24/cafe24-readiness-panel";
import { SectionHeader } from "@/components/common/section-header";
import { NaturalLanguageWorkbench } from "@/components/workbench/natural-language-workbench";

export default function WorkspacePage() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="AI 작업실"
        description="러버블처럼 자연어 요구사항을 입력하면 Cafe24 이전, 홈페이지, 상세페이지, AI CS, 마케팅 스크립트 작업으로 분해하고 선택 실행합니다."
      />
      <Cafe24ReadinessPanel />
      <NaturalLanguageWorkbench />
    </div>
  );
}
