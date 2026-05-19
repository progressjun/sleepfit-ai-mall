"use client";

import { SectionHeader } from "@/components/common/section-header";
import { Cafe24ReadinessPanel } from "@/components/cafe24/cafe24-readiness-panel";
import { SolutionOperationsPanel } from "@/components/solution/solution-operations-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const auditFindings = [
  "기존 기능은 AI 생성물 중심이라 쇼핑몰 솔루션사의 운영 모듈 관점이 약했습니다.",
  "상품/주문/회원/스킨/도메인/PG/마케팅/CS/승인 거버넌스를 하나의 커버리지로 묶어야 합니다.",
  "Cafe24 실제 API 호출은 placeholder로 유지하되, 화면에서는 관리자 권한과 운영 체크리스트가 보여야 합니다.",
];

const priorityRoadmap = [
  "상품/옵션/진열분류와 상세 HTML 적용 전 검수 흐름 고도화",
  "주문완료 purchase 이벤트와 PG 테스트 결과를 같은 화면에서 연결",
  "게시판/상품문의 답변 매크로와 개인정보 마스킹 로그 연결",
  "승인된 작업만 적용 준비로 이동하는 릴리즈 체크리스트 추가",
];

export default function SolutionAuditPage() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="솔루션 기능 점검"
        description="Cafe24형 쇼핑몰 솔루션사가 제공하는 운영 모듈 기준으로 현재 MVP의 기능 커버리지와 보강 우선순위를 확인합니다."
      />
      <SolutionOperationsPanel />
      <Cafe24ReadinessPanel />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>점검 결과</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {auditFindings.map((item) => (
              <div key={item} className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>다음 개발 우선순위</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {priorityRoadmap.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
