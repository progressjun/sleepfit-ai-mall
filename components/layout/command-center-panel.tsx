"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  BotIcon,
  CheckCircle2Icon,
  Loader2Icon,
  PlayIcon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { postJson } from "@/lib/client-api";
import { useDemoStore } from "@/lib/store/use-demo-store";
import type {
  CommandAIOutput,
  CsAIOutput,
  DetailPageAIOutput,
  MigrationAIOutput,
  PaymentsAIOutput,
  ScriptsAIOutput,
  WebsiteAIOutput,
} from "@/lib/ai/schemas";
import type { ApprovalItemType, RiskLevel } from "@/types";

const examples = [
  "이 쇼핑몰 서버 이전 체크리스트 만들어줘",
  "상세페이지 제작에 필요한 입력 항목 정리해줘",
  "AI CS 답변을 상담원 보조형으로 생성해줘",
  "GA4, Meta, Naver 전환 스크립트 설치 항목을 점검해줘",
  "객단가 5만 원대 브랜드에 적합한 페이먼츠 구성을 추천해줘",
  "상세페이지 문구에서 과장 표현 리스크를 줄여줘",
];

function riskFromFlags(flags: { level: RiskLevel }[] = []): RiskLevel {
  if (flags.some((flag) => flag.level === "high")) return "high";
  if (flags.some((flag) => flag.level === "medium")) return "medium";
  return "low";
}

export function CommandCenterPanel() {
  const pathname = usePathname();
  const [command, setCommand] = useState("");
  const [plan, setPlan] = useState<CommandAIOutput | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const store = useDemoStore();
  const firstProduct = store.products[0];

  if (pathname === "/hermes") {
    return null;
  }

  async function parseCommand(value = command) {
    if (!value.trim()) return;
    setIsParsing(true);
    store.addCommandMessage({ role: "user", content: value });
    try {
      const result = await postJson<CommandAIOutput>("/api/command/parse", {
        command: value,
      });
      setPlan(result.data);
      store.addCommandMessage({
        role: "assistant",
        content: result.data.summary,
        plan: result.data,
      });
    } finally {
      setIsParsing(false);
    }
  }

  async function executePlan() {
    if (!plan) return;
    setIsExecuting(true);
    try {
      if (plan.intent === "migration_checklist") {
        const result = await postJson<MigrationAIOutput>("/api/ai/migration", {
          currentSiteUrl: "https://old-example.co.kr",
          targetSiteUrl: "https://new-example.co.kr",
          currentPlatform: "Cafe24",
          monthlyOrders: 1200,
          productCount: 160,
          needsMemberMigration: true,
          needsOrderMigration: true,
          needsReviewMigration: true,
          needsUrlPreservation: true,
          needsAdScriptReinstall: true,
          needsPaymentRebuild: true,
          scope: ["상품 데이터", "회원 데이터", "URL 리다이렉트", "광고 스크립트", "결제 모듈"],
        });
        const item = store.createMigrationDiagnostic(result.data);
        createApproval("migration", plan.title, result.data.summary, riskFromFlags(result.data.riskFlags), {
          diagnosticId: item.id,
        });
        log(plan.title, riskFromFlags(result.data.riskFlags), result.source);
      } else if (plan.intent === "website_structure") {
        const result = await postJson<WebsiteAIOutput>("/api/ai/website", {
          brandName: "Nutriblend",
          industry: "헬스케어 커머스",
          productGroups: "유산균, 단백질, 건강 루틴 상품",
          coreCustomers: "건강 루틴을 만들고 싶은 3040 고객",
          brandTone: "신뢰감 있고 간결한",
          mainCtaGoal: "구매 유도",
          requiredPages: ["메인", "브랜드 소개", "상품 리스트", "리뷰", "FAQ"],
        });
        const item = store.createWebsiteGeneration(result.data);
        createApproval("website", plan.title, result.data.brandCopy, "low", { websiteId: item.id });
        log(plan.title, "low", result.source);
      } else if (plan.intent === "cs_templates") {
        const result = await postJson<CsAIOutput>("/api/ai/cs", {
          shippingPolicy: "결제 완료 후 영업일 기준 1~3일 내 출고",
          exchangePolicy: "미사용 상품 7일 이내 교환 가능",
          returnPolicy: "개봉 상품 반품 제한",
          refundPolicy: "회수 확인 후 영업일 기준 3일 내 환불",
          productInquiryRule: "효능 단정 문의는 일반 정보 중심으로 응대",
          prohibitedExpressions: "완치, 100% 효과, 부작용 없음",
          escalationCriteria: "결제 오류, 배송 사고, 의학적 문의",
          responseTone: "친절한",
        });
        const item = store.createCsPolicyGeneration(result.data);
        createApproval("ai_cs", plan.title, result.data.replyTemplates[0], riskFromFlags(result.data.riskFlags), {
          policyId: item.id,
        });
        log(plan.title, riskFromFlags(result.data.riskFlags), result.source);
      } else if (plan.intent === "marketing_scripts") {
        const result = await postJson<ScriptsAIOutput>("/api/ai/scripts", {
          selectedScripts: ["GA4", "GTM", "Meta Pixel", "Naver Ads"],
          requiredEvents: ["page_view", "view_item", "purchase"],
          commerceGoal: "광고 구매 전환 측정",
        });
        store.saveScriptGuide(result.data);
        createApproval("marketing_script", plan.title, result.data.testPlan[0], riskFromFlags(result.data.riskFlags), {
          guide: result.data,
        });
        log(plan.title, riskFromFlags(result.data.riskFlags), result.source);
      } else if (plan.intent === "payment_recommendation") {
        const result = await postJson<PaymentsAIOutput>("/api/ai/payments", {
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
          productType: "배송상품",
        });
        const item = store.createPaymentRecommendation(result.data);
        createApproval("payments", plan.title, result.data.recommendedPaymentMethods.join(", "), "low", {
          recommendationId: item.id,
        });
        log(plan.title, "low", result.source);
      } else {
        const result = await postJson<DetailPageAIOutput>("/api/ai/detail-page", {
          productId: firstProduct.id,
          productName: firstProduct.name,
          price: firstProduct.price,
          category: firstProduct.category,
          features: firstProduct.features.join(", "),
          targetCustomer: firstProduct.targetCustomer,
          purchaseBarriers: firstProduct.barriers.join(", "),
          reviewSummary: firstProduct.reviewSummary,
          differentiators: firstProduct.differentiators.join(", "),
          cautionExpressions: firstProduct.cautionExpressions.join(", "),
        });
        const item = store.createDetailPageGeneration(firstProduct.id, result.data);
        createApproval("detail_page", plan.title, result.data.headline, riskFromFlags(result.data.riskFlags), {
          detailId: item.id,
        });
        log(plan.title, riskFromFlags(result.data.riskFlags), result.source);
      }
      store.addCommandMessage({
        role: "assistant",
        content: "작업 결과를 생성하고 승인 대기열에 등록했습니다.",
      });
    } finally {
      setIsExecuting(false);
    }
  }

  function createApproval(
    type: ApprovalItemType,
    title: string,
    summary: string,
    riskLevel: RiskLevel,
    payload: Record<string, unknown>,
  ) {
    store.createApprovalItem({
      type,
      title,
      summary,
      riskLevel,
      payload,
      status: riskLevel === "high" ? "pending_review" : "pending_review",
    });
  }

  function log(title: string, riskLevel: RiskLevel, source: "mock" | "success") {
    store.addAuditLog({
      actor: "AI Command Center",
      action: "command_executed",
      target: title,
      nextStatus: "pending_review",
      riskLevel,
      apiStatus: source,
    });
  }

  return (
    <aside className="sticky top-0 hidden h-dvh w-[360px] shrink-0 border-l border-slate-200 bg-white xl:flex xl:flex-col">
      <div className="flex h-20 items-center gap-3 border-b px-5">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          <BotIcon />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">AI Command Center</p>
          <p className="text-xs text-slate-500">계획 생성 후 승인 흐름으로 실행</p>
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon />
                자연어 명령
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Textarea
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="예: GA4, Meta 전환 스크립트 점검해줘"
                className="min-h-24 resize-none"
              />
              <Button
                onClick={() => parseCommand()}
                disabled={isParsing || !command.trim()}
                className="bg-gradient-to-r from-violet-600 to-blue-600 text-white"
              >
                {isParsing ? <Loader2Icon className="animate-spin" /> : <SparklesIcon />}
                명령 해석
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-500">예시 명령</p>
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setCommand(example);
                  void parseCommand(example);
                }}
                className="rounded-xl border bg-slate-50 px-3 py-2 text-left text-xs leading-5 text-slate-700 transition-colors hover:bg-slate-100"
              >
                {example}
              </button>
            ))}
          </div>

          {plan && (
            <Card className="border-violet-200 bg-violet-50/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">{plan.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm leading-6 text-slate-700">{plan.summary}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{plan.targetModule}</Badge>
                  <Badge variant="outline">승인 필요</Badge>
                </div>
                <ol className="flex list-decimal flex-col gap-2 pl-4 text-sm text-slate-700">
                  {plan.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                {plan.riskNotes.map((note) => (
                  <p key={note} className="rounded-xl bg-white p-3 text-xs leading-5 text-slate-600">
                    {note}
                  </p>
                ))}
                <Button onClick={executePlan} disabled={isExecuting}>
                  {isExecuting ? <Loader2Icon className="animate-spin" /> : <PlayIcon />}
                  실행하기
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2Icon />
                최근 메시지
              </CardTitle>
            </CardHeader>
            <CardContent className="flex max-h-64 flex-col gap-2 overflow-auto">
              {store.commandCenterMessages.slice(-5).map((message) => (
                <div
                  key={message.id}
                  className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-700"
                >
                  <span className="font-semibold">
                    {message.role === "user" ? "사용자" : "AI"}
                  </span>
                  <p>{message.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </aside>
  );
}
