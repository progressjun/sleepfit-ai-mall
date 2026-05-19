"use client";

import { useState } from "react";
import { Loader2Icon, WandSparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { postJson } from "@/lib/client-api";
import { useDemoStore } from "@/lib/store/use-demo-store";
import type { CsAIOutput } from "@/lib/ai/schemas";
import type { RiskLevel } from "@/types";

const tones = ["친절한", "간결한", "프리미엄", "사무적인", "공감형"] as const;

function riskFromFlags(flags: { level: RiskLevel }[]): RiskLevel {
  if (flags.some((flag) => flag.level === "high")) return "high";
  if (flags.some((flag) => flag.level === "medium")) return "medium";
  return "low";
}

export function CsPolicyForm() {
  const store = useDemoStore();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    shippingPolicy: "결제 완료 후 영업일 기준 1~3일 내 출고됩니다.",
    exchangePolicy: "미사용 상품은 수령 후 7일 이내 교환 가능합니다.",
    returnPolicy: "개봉 또는 사용 흔적이 있는 상품은 반품이 제한됩니다.",
    refundPolicy: "회수 확인 후 영업일 기준 3일 내 환불 처리합니다.",
    productInquiryRule: "효능 단정 문의는 일반 정보와 사용 안내 중심으로 답변합니다.",
    prohibitedExpressions: "완치, 100% 효과, 부작용 없음, 무조건 보장",
    escalationCriteria: "결제 오류, 배송 사고, 개인정보, 의학적 문의는 상담원 연결",
    responseTone: "친절한" as (typeof tones)[number],
  });

  async function submit() {
    setIsLoading(true);
    try {
      const result = await postJson<CsAIOutput>("/api/ai/cs", form);
      const policy = store.createCsPolicyGeneration(result.data);
      const riskLevel = riskFromFlags(result.data.riskFlags);
      store.createApprovalItem({
        type: "ai_cs",
        title: "AI CS 답변 템플릿",
        summary: result.data.replyTemplates[0],
        status: "pending_review",
        riskLevel,
        payload: { policyId: policy.id },
      });
      store.addAuditLog({
        actor: "AI Assistant",
        action: "ai_generated",
        target: "AI CS 템플릿 생성",
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
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>CS 정책 입력</CardTitle>
        <Badge variant="secondary" className="bg-amber-100 text-amber-800">자동응답 Coming Soon</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {[
          ["shippingPolicy", "배송 정책"],
          ["exchangePolicy", "교환 정책"],
          ["returnPolicy", "반품 정책"],
          ["refundPolicy", "환불 정책"],
          ["productInquiryRule", "상품 문의 응대 기준"],
          ["prohibitedExpressions", "금지 표현"],
          ["escalationCriteria", "상담원 연결 기준"],
        ].map(([key, label]) => (
          <label key={key} className="flex flex-col gap-2">
            <Label>{label}</Label>
            <Textarea
              value={String(form[key as keyof typeof form])}
              onChange={(event) => setForm({ ...form, [key]: event.target.value })}
            />
          </label>
        ))}
        <label className="flex flex-col gap-2">
          <Label>응대 톤</Label>
          <select
            value={form.responseTone}
            onChange={(event) => setForm({ ...form, responseTone: event.target.value as (typeof tones)[number] })}
            className="h-9 rounded-lg border border-input bg-white px-3 text-sm"
          >
            {tones.map((tone) => (
              <option key={tone}>{tone}</option>
            ))}
          </select>
        </label>
        <Button onClick={submit} disabled={isLoading} className="self-start bg-gradient-to-r from-violet-600 to-blue-600 text-white">
          {isLoading ? <Loader2Icon className="animate-spin" /> : <WandSparklesIcon />}
          AI CS 템플릿 생성
        </Button>
      </CardContent>
    </Card>
  );
}
