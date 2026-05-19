"use client";

import { useState } from "react";
import { Loader2Icon, WandSparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { postJson } from "@/lib/client-api";
import { useDemoStore } from "@/lib/store/use-demo-store";
import type { WebsiteAIOutput } from "@/lib/ai/schemas";

const pageOptions = ["메인", "브랜드 소개", "상품 리스트", "기획전", "리뷰", "FAQ", "고객센터"];
const ctaOptions = ["구매 유도", "상담 문의", "회원가입", "이벤트 참여"] as const;

export function WebsiteBriefForm() {
  const store = useDemoStore();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    brandName: "Nutriblend",
    industry: "헬스케어 커머스",
    productGroups: "유산균, 단백질, 건강 루틴 상품",
    coreCustomers: "건강 루틴을 만들고 싶은 3040 고객",
    brandTone: "신뢰감 있고 간결한",
    mainCtaGoal: "구매 유도" as (typeof ctaOptions)[number],
    requiredPages: ["메인", "브랜드 소개", "상품 리스트", "리뷰", "FAQ"],
  });

  function togglePage(page: string) {
    setForm((current) => ({
      ...current,
      requiredPages: current.requiredPages.includes(page)
        ? current.requiredPages.filter((item) => item !== page)
        : [...current.requiredPages, page],
    }));
  }

  async function submit() {
    setIsLoading(true);
    try {
      const result = await postJson<WebsiteAIOutput>("/api/ai/website", form);
      const generation = store.createWebsiteGeneration(result.data);
      store.createApprovalItem({
        type: "website",
        title: "홈페이지 구조",
        summary: result.data.brandCopy,
        status: "pending_review",
        riskLevel: "low",
        payload: { websiteId: generation.id },
      });
      store.addAuditLog({
        actor: "AI Assistant",
        action: "ai_generated",
        target: "홈페이지 구조 생성",
        nextStatus: "pending_review",
        riskLevel: "low",
        apiStatus: result.source,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>브랜드 브리프</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <Label>브랜드명</Label>
            <Input value={form.brandName} onChange={(event) => setForm({ ...form, brandName: event.target.value })} />
          </label>
          <label className="flex flex-col gap-2">
            <Label>업종</Label>
            <Input value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} />
          </label>
        </div>
        <label className="flex flex-col gap-2">
          <Label>주요 상품군</Label>
          <Textarea value={form.productGroups} onChange={(event) => setForm({ ...form, productGroups: event.target.value })} />
        </label>
        <label className="flex flex-col gap-2">
          <Label>핵심 고객</Label>
          <Textarea value={form.coreCustomers} onChange={(event) => setForm({ ...form, coreCustomers: event.target.value })} />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <Label>브랜드 톤</Label>
            <Input value={form.brandTone} onChange={(event) => setForm({ ...form, brandTone: event.target.value })} />
          </label>
          <label className="flex flex-col gap-2">
            <Label>메인 CTA 목적</Label>
            <select
              value={form.mainCtaGoal}
              onChange={(event) => setForm({ ...form, mainCtaGoal: event.target.value as (typeof ctaOptions)[number] })}
              className="h-9 rounded-lg border border-input bg-white px-3 text-sm"
            >
              {ctaOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-col gap-2">
          <Label>필요한 페이지</Label>
          <div className="grid gap-2 md:grid-cols-2">
            {pageOptions.map((page) => (
              <label key={page} className="flex items-center gap-2 rounded-xl border bg-slate-50 p-3 text-sm text-slate-700">
                <input type="checkbox" checked={form.requiredPages.includes(page)} onChange={() => togglePage(page)} />
                {page}
              </label>
            ))}
          </div>
        </div>
        <Button onClick={submit} disabled={isLoading} className="self-start bg-gradient-to-r from-violet-600 to-blue-600 text-white">
          {isLoading ? <Loader2Icon className="animate-spin" /> : <WandSparklesIcon />}
          홈페이지 구조 생성
        </Button>
      </CardContent>
    </Card>
  );
}
