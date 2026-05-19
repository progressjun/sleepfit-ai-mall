"use client";

import { useState } from "react";
import { Loader2Icon, WandSparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postJson } from "@/lib/client-api";
import { useDemoStore } from "@/lib/store/use-demo-store";
import type { MigrationAIOutput } from "@/lib/ai/schemas";
import type { CommercePlatform, RiskLevel } from "@/types";

const scopeOptions = [
  "상품 데이터",
  "상세페이지 HTML",
  "상세페이지 이미지",
  "회원 데이터",
  "주문 데이터",
  "리뷰 데이터",
  "게시판/FAQ",
  "도메인",
  "SSL",
  "URL 리다이렉트",
  "광고 스크립트",
  "결제 모듈",
  "CS 정책",
  "SEO 메타태그",
];

const platforms: CommercePlatform[] = [
  "Cafe24",
  "Legacy Mall",
  "Hosted Mall",
  "Custom Mall",
  "WordPress",
  "Shopify",
  "Other",
];

function riskFromFlags(flags: { level: RiskLevel }[]): RiskLevel {
  if (flags.some((flag) => flag.level === "high")) return "high";
  if (flags.some((flag) => flag.level === "medium")) return "medium";
  return "low";
}

export function MigrationScopeForm() {
  const store = useDemoStore();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    currentSiteUrl: "https://old-example.co.kr",
    targetSiteUrl: "https://new-example.co.kr",
    currentPlatform: "Cafe24" as CommercePlatform,
    monthlyOrders: 1200,
    productCount: 160,
    needsMemberMigration: true,
    needsOrderMigration: true,
    needsReviewMigration: true,
    needsUrlPreservation: true,
    needsAdScriptReinstall: true,
    needsPaymentRebuild: true,
    scope: ["상품 데이터", "상세페이지 이미지", "회원 데이터", "주문 데이터", "URL 리다이렉트", "광고 스크립트", "결제 모듈"],
  });

  function toggleScope(value: string) {
    setForm((current) => ({
      ...current,
      scope: current.scope.includes(value)
        ? current.scope.filter((item) => item !== value)
        : [...current.scope, value],
    }));
  }

  async function submit() {
    setIsLoading(true);
    try {
      const result = await postJson<MigrationAIOutput>("/api/ai/migration", form);
      const diagnostic = store.createMigrationDiagnostic(result.data);
      const riskLevel = riskFromFlags(result.data.riskFlags);
      store.createApprovalItem({
        type: "migration",
        title: "서버 이전 진단",
        summary: result.data.summary,
        status: "pending_review",
        riskLevel,
        payload: { diagnosticId: diagnostic.id },
      });
      store.addAuditLog({
        actor: "AI Assistant",
        action: "ai_generated",
        target: "서버 이전 진단 생성",
        nextStatus: "pending_review",
        riskLevel,
        apiStatus: result.source,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>이전 진단 입력</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <Label>현재 쇼핑몰 URL</Label>
            <Input value={form.currentSiteUrl} onChange={(event) => setForm({ ...form, currentSiteUrl: event.target.value })} />
          </label>
          <label className="flex flex-col gap-2">
            <Label>이전 대상 URL</Label>
            <Input value={form.targetSiteUrl} onChange={(event) => setForm({ ...form, targetSiteUrl: event.target.value })} />
          </label>
          <label className="flex flex-col gap-2">
            <Label>현재 플랫폼</Label>
            <select
              value={form.currentPlatform}
              onChange={(event) => setForm({ ...form, currentPlatform: event.target.value as CommercePlatform })}
              className="h-9 rounded-lg border border-input bg-white px-3 text-sm"
            >
              {platforms.map((platform) => (
                <option key={platform}>{platform}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <Label>월 주문량</Label>
            <Input type="number" value={form.monthlyOrders} onChange={(event) => setForm({ ...form, monthlyOrders: Number(event.target.value) })} />
          </label>
          <label className="flex flex-col gap-2">
            <Label>상품 수</Label>
            <Input type="number" value={form.productCount} onChange={(event) => setForm({ ...form, productCount: Number(event.target.value) })} />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {[
            ["needsMemberMigration", "회원 데이터 이전 필요"],
            ["needsOrderMigration", "주문 데이터 이전 필요"],
            ["needsReviewMigration", "리뷰/게시판 이전 필요"],
            ["needsUrlPreservation", "기존 URL 유지 필요"],
            ["needsAdScriptReinstall", "광고 스크립트 재설치 필요"],
            ["needsPaymentRebuild", "결제 모듈 재구성 필요"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 rounded-xl border bg-slate-50 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(form[key as keyof typeof form])}
                onChange={(event) => setForm({ ...form, [key]: event.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Label>이전 범위</Label>
          <div className="grid gap-2 md:grid-cols-2">
            {scopeOptions.map((option) => (
              <label key={option} className="flex items-center gap-2 rounded-xl border bg-slate-50 p-3 text-sm text-slate-700">
                <input type="checkbox" checked={form.scope.includes(option)} onChange={() => toggleScope(option)} />
                {option}
              </label>
            ))}
          </div>
        </div>

        <Button onClick={submit} disabled={isLoading} className="self-start bg-gradient-to-r from-violet-600 to-blue-600 text-white">
          {isLoading ? <Loader2Icon className="animate-spin" /> : <WandSparklesIcon />}
          이전 진단 생성
        </Button>
      </CardContent>
    </Card>
  );
}
