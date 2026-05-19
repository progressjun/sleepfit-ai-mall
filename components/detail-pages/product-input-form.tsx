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
import type { DetailPageAIOutput } from "@/lib/ai/schemas";
import type { Product, RiskLevel } from "@/types";

function riskFromFlags(flags: { level: RiskLevel }[]): RiskLevel {
  if (flags.some((flag) => flag.level === "high")) return "high";
  if (flags.some((flag) => flag.level === "medium")) return "medium";
  return "low";
}

export function ProductInputForm({ product }: { product: Product }) {
  const store = useDemoStore();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    productId: product.id,
    productName: product.name,
    price: product.price,
    category: product.category,
    features: product.features.join(", "),
    targetCustomer: product.targetCustomer,
    purchaseBarriers: product.barriers.join(", "),
    reviewSummary: product.reviewSummary,
    differentiators: product.differentiators.join(", "),
    cautionExpressions: product.cautionExpressions.join(", "),
  });

  async function submit() {
    setIsLoading(true);
    try {
      const result = await postJson<DetailPageAIOutput>("/api/ai/detail-page", form);
      const generation = store.createDetailPageGeneration(product.id, result.data);
      const riskLevel = riskFromFlags(result.data.riskFlags);
      store.createApprovalItem({
        type: "detail_page",
        title: `${product.name} 상세페이지 문구`,
        summary: result.data.headline,
        status: "pending_review",
        riskLevel,
        payload: { detailId: generation.id, productId: product.id },
      });
      store.addAuditLog({
        actor: "AI Assistant",
        action: "ai_generated",
        target: `${product.name} 상세페이지 초안 생성`,
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
        <CardTitle>상품 입력</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <Label>상품명</Label>
          <Input value={form.productName} onChange={(event) => setForm({ ...form, productName: event.target.value })} />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <Label>가격</Label>
            <Input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
          </label>
          <label className="flex flex-col gap-2">
            <Label>카테고리</Label>
            <Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
          </label>
        </div>
        <label className="flex flex-col gap-2">
          <Label>주요 특징</Label>
          <Textarea value={form.features} onChange={(event) => setForm({ ...form, features: event.target.value })} />
        </label>
        <label className="flex flex-col gap-2">
          <Label>타겟 고객</Label>
          <Textarea value={form.targetCustomer} onChange={(event) => setForm({ ...form, targetCustomer: event.target.value })} />
        </label>
        <label className="flex flex-col gap-2">
          <Label>구매장벽</Label>
          <Textarea value={form.purchaseBarriers} onChange={(event) => setForm({ ...form, purchaseBarriers: event.target.value })} />
        </label>
        <label className="flex flex-col gap-2">
          <Label>리뷰 요약</Label>
          <Textarea value={form.reviewSummary} onChange={(event) => setForm({ ...form, reviewSummary: event.target.value })} />
        </label>
        <label className="flex flex-col gap-2">
          <Label>경쟁 제품 대비 차별점</Label>
          <Textarea value={form.differentiators} onChange={(event) => setForm({ ...form, differentiators: event.target.value })} />
        </label>
        <label className="flex flex-col gap-2">
          <Label>주의해야 할 표현</Label>
          <Input value={form.cautionExpressions} onChange={(event) => setForm({ ...form, cautionExpressions: event.target.value })} />
        </label>
        <Button onClick={submit} disabled={isLoading} className="self-start bg-gradient-to-r from-violet-600 to-blue-600 text-white">
          {isLoading ? <Loader2Icon className="animate-spin" /> : <WandSparklesIcon />}
          상세페이지 생성
        </Button>
      </CardContent>
    </Card>
  );
}
