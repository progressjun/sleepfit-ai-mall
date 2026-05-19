"use client";

import { ShieldCheckIcon } from "lucide-react";
import { SectionHeader } from "@/components/common/section-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoStore } from "@/lib/store/use-demo-store";

export function SettingsClient({ openAIReady }: { openAIReady: boolean }) {
  const { currentUser, projects, activeProjectId } = useDemoStore();
  const project = projects.find((item) => item.id === activeProjectId);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="설정"
        description="프로젝트, AI, provider, 보안 설정 상태를 확인합니다."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Login account</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-950">Email:</span> {currentUser.email}</p>
            <p><span className="font-semibold text-slate-950">Name:</span> {currentUser.name}</p>
            <p><span className="font-semibold text-slate-950">Role:</span> {currentUser.role}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>현재 프로젝트 정보</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-950">브랜드:</span> {project?.brandName}</p>
            <p><span className="font-semibold text-slate-950">현재 URL:</span> {project?.currentSiteUrl}</p>
            <p><span className="font-semibold text-slate-950">목표 URL:</span> {project?.targetSiteUrl}</p>
            <p><span className="font-semibold text-slate-950">플랫폼:</span> {project?.currentPlatform}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>AI 연결 상태</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <StatusBadge status={openAIReady ? "ready_to_apply" : "draft"} />
            <p className="text-sm leading-6 text-slate-600">
              {openAIReady
                ? "OPENAI_API_KEY가 설정되어 API route에서 Responses API 호출 준비가 되어 있습니다."
                : "OPENAI_API_KEY가 없어 Mock AI 모드로 동일한 데모 플로우를 실행합니다."}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Commerce Provider 설정</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              "Cafe24 Adapter: OAuth, Admin API, Webhook, 스킨 편집 지점 placeholder",
              "Mock Provider: 데모 상품/스크립트 성공 응답",
              "Shopify Adapter Placeholder",
              "Custom Mall Adapter Placeholder",
            ].map((provider) => (
              <div key={provider} className="rounded-xl border bg-slate-50 p-3 text-sm leading-6 text-slate-700">{provider}</div>
            ))}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Cafe24 실제 연동 전에는 앱 권한 범위, 쇼핑몰 관리자 권한, 스킨 백업, 개인정보 처리 범위, 구매 이벤트 중복 수집 여부를 먼저 확정해야 합니다.
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Supabase 연결 상태</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-slate-600">
            NEXT_PUBLIC_SUPABASE_URL과 ANON KEY를 설정하면 schema.sql 기반 저장소로 확장할 수 있습니다. MVP는 localStorage persist로 동작합니다.
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheckIcon />
              보안 안내
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {[
              "외부 API 토큰은 클라이언트에 노출하지 않습니다.",
              "OpenAI 요청 전 이메일, 전화번호, 주소, 주문번호를 마스킹합니다.",
              "AI 생성 결과는 자동 적용하지 않고 승인 절차를 거칩니다.",
              "회원/주문 데이터 이전은 개인정보 처리 검토가 필요합니다.",
            ].map((item) => (
              <div key={item} className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{item}</div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
