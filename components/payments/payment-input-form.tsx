"use client";

import { useState } from "react";
import { Loader2Icon, WandSparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postJson } from "@/lib/client-api";
import { useDemoStore } from "@/lib/store/use-demo-store";
import type { PaymentsAIOutput } from "@/lib/ai/schemas";

const productTypes = ["배송상품", "디지털상품", "혼합"] as const;

export function PaymentInputForm() {
  const store = useDemoStore();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    averageOrderValue: 52000,
    expectedMonthlyVolume: 70000000,
    expectedMonthlyOrders: 1300,
    needsSubscription: true,
    needsEasyPay: true,
    needsGlobalPayment: false,
    needsNaverPay: true,
    needsKakaoPay: true,
    needsTossPay: true,
    cardPayment: true,
    virtualAccount: true,
    bankTransfer: true,
    productType: "배송상품" as (typeof productTypes)[number],
  });

  async function submit() {
    setIsLoading(true);
    try {
      const result = await postJson<PaymentsAIOutput>("/api/ai/payments", form);
      const recommendation = store.createPaymentRecommendation(result.data);
      store.createApprovalItem({
        type: "payments",
        title: "페이먼츠 구성 추천안",
        summary: result.data.recommendedPaymentMethods.join(", "),
        status: "pending_review",
        riskLevel: "low",
        payload: { recommendationId: recommendation.id },
      });
      store.addAuditLog({
        actor: "AI Assistant",
        action: "ai_generated",
        target: "페이먼츠 구성 추천",
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
        <CardTitle>판매 구조 입력</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["averageOrderValue", "객단가"],
            ["expectedMonthlyVolume", "월 예상 거래액"],
            ["expectedMonthlyOrders", "월 예상 주문 수"],
          ].map(([key, label]) => (
            <label key={key} className="flex flex-col gap-2">
              <Label>{label}</Label>
              <Input
                type="number"
                value={Number(form[key as keyof typeof form])}
                onChange={(event) => setForm({ ...form, [key]: Number(event.target.value) })}
              />
            </label>
          ))}
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {[
            ["needsSubscription", "정기결제 필요"],
            ["needsEasyPay", "간편결제 필요"],
            ["needsGlobalPayment", "해외결제 필요"],
            ["needsNaverPay", "네이버페이 필요"],
            ["needsKakaoPay", "카카오페이 필요"],
            ["needsTossPay", "토스페이 필요"],
            ["cardPayment", "카드결제"],
            ["virtualAccount", "가상계좌"],
            ["bankTransfer", "무통장"],
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
        <label className="flex flex-col gap-2">
          <Label>배송상품/디지털상품 여부</Label>
          <select
            value={form.productType}
            onChange={(event) => setForm({ ...form, productType: event.target.value as (typeof productTypes)[number] })}
            className="h-9 rounded-lg border border-input bg-white px-3 text-sm"
          >
            {productTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <Button onClick={submit} disabled={isLoading} className="self-start bg-gradient-to-r from-violet-600 to-blue-600 text-white">
          {isLoading ? <Loader2Icon className="animate-spin" /> : <WandSparklesIcon />}
          페이먼츠 구성 추천
        </Button>
      </CardContent>
    </Card>
  );
}
