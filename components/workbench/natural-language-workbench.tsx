"use client";

import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  Loader2Icon,
  PlayIcon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { WorkbenchRunSummary } from "./workbench-run-summary";
import { WorkbenchTaskCard } from "./workbench-task-card";
import { postJson } from "@/lib/client-api";
import { useDemoStore } from "@/lib/store/use-demo-store";
import type {
  CsAIOutput,
  DetailPageAIOutput,
  MigrationAIOutput,
  PaymentsAIOutput,
  ScriptsAIOutput,
  WebsiteAIOutput,
  WorkflowPlanAIOutput,
} from "@/lib/ai/schemas";
import type {
  ApprovalItemType,
  RiskLevel,
  WorkbenchRun,
  WorkbenchTask,
} from "@/types";

const examples = [
  "Cafe24 이전 리스크 점검하고 홈페이지, 상세페이지 3개, AI CS, GA4/Meta 전환 세팅까지 한번에 준비해줘",
  "광고 집행 전 준비 상태를 Lovable처럼 작업 계획으로 쪼개고 필요한 것만 실행해줘",
  "프리미엄 헬스케어 브랜드 기준으로 상세페이지와 AICS를 먼저 고도화해줘",
];

function riskFromFlags(flags: { level: RiskLevel }[] = []): RiskLevel {
  if (flags.some((flag) => flag.level === "high")) return "high";
  if (flags.some((flag) => flag.level === "medium")) return "medium";
  return "low";
}

export function NaturalLanguageWorkbench() {
  const store = useDemoStore();
  const [command, setCommand] = useState(examples[0]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const activeRun = useMemo(
    () => store.workbenchRuns.find((run) => run.id === activeRunId) ?? store.workbenchRuns[0],
    [activeRunId, store.workbenchRuns],
  );

  async function createPlan(value = command) {
    if (!value.trim()) return;
    setIsPlanning(true);
    try {
      const result = await postJson<WorkflowPlanAIOutput>("/api/command/workflow", {
        command: value,
      });
      const run = store.createWorkbenchRun({
        title: result.data.title,
        originalCommand: value,
        summary: result.data.summary,
        assumptions: result.data.assumptions,
        riskNotes: result.data.riskNotes,
        successCriteria: result.data.successCriteria,
        tasks: result.data.tasks.map((task) => ({
          ...task,
          status: "planned",
        })),
      });
      setActiveRunId(run.id);
      setSelectedTaskIds(run.tasks.map((task) => task.id));
      store.addAuditLog({
        actor: "AI Workbench",
        action: "command_executed",
        target: "자연어 작업 계획 생성",
        nextStatus: "planned",
        riskLevel: "low",
        apiStatus: result.source,
      });
    } finally {
      setIsPlanning(false);
    }
  }

  function toggleTask(taskId: string) {
    setSelectedTaskIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId],
    );
  }

  async function runSelectedTasks() {
    if (!activeRun) return;
    setIsRunning(true);
    try {
      for (const task of activeRun.tasks) {
        if (!selectedTaskIds.includes(task.id)) {
          store.updateWorkbenchTaskStatus(activeRun.id, task.id, "skipped");
          continue;
        }
        await runTask(activeRun, task);
      }
    } finally {
      setIsRunning(false);
    }
  }

  async function runTask(run: WorkbenchRun, task: WorkbenchTask) {
    store.updateWorkbenchTaskStatus(run.id, task.id, "running");
    try {
      if (task.intent === "migration_checklist") {
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
          scope: ["상품 데이터", "회원 데이터", "주문 데이터", "URL 리다이렉트", "광고 스크립트", "결제 모듈"],
        });
        const diagnostic = store.createMigrationDiagnostic(result.data);
        createApproval(task, result.data.summary, riskFromFlags(result.data.riskFlags), {
          diagnosticId: diagnostic.id,
          sourceRunId: run.id,
        });
        log(task, riskFromFlags(result.data.riskFlags), result.source);
      } else if (task.intent === "website_structure") {
        const result = await postJson<WebsiteAIOutput>("/api/ai/website", {
          brandName: "Nutriblend",
          industry: "헬스케어 커머스",
          productGroups: "유산균, 단백질, 건강 루틴 상품",
          coreCustomers: "건강 루틴을 만들고 싶은 3040 고객",
          brandTone: "신뢰감 있고 간결한",
          mainCtaGoal: "구매 유도",
          requiredPages: ["메인", "브랜드 소개", "상품 리스트", "기획전", "리뷰", "FAQ", "고객센터"],
        });
        const generation = store.createWebsiteGeneration(result.data);
        createApproval(task, result.data.brandCopy, "low", {
          websiteId: generation.id,
          sourceRunId: run.id,
        });
        log(task, "low", result.source);
      } else if (task.intent === "detail_page_copy" || task.intent === "risk_review") {
        const targets = store.products.slice(0, 3);
        for (const product of targets) {
          const result = await postJson<DetailPageAIOutput>("/api/ai/detail-page", {
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
          const generation = store.createDetailPageGeneration(product.id, result.data);
          createApproval(
            { ...task, title: `${product.name} 상세페이지` },
            result.data.headline,
            riskFromFlags(result.data.riskFlags),
            { detailId: generation.id, productId: product.id, sourceRunId: run.id },
          );
          log({ ...task, title: `${product.name} 상세페이지 생성` }, riskFromFlags(result.data.riskFlags), result.source);
        }
      } else if (task.intent === "cs_templates") {
        const result = await postJson<CsAIOutput>("/api/ai/cs", {
          shippingPolicy: "결제 완료 후 영업일 기준 1~3일 내 출고",
          exchangePolicy: "미사용 상품 7일 이내 교환 가능",
          returnPolicy: "개봉 상품 반품 제한",
          refundPolicy: "회수 확인 후 영업일 기준 3일 내 환불",
          productInquiryRule: "효능 단정 문의는 일반 정보 중심으로 응대",
          prohibitedExpressions: "완치, 100% 효과, 부작용 없음, 무조건 보장",
          escalationCriteria: "결제 오류, 배송 사고, 의학적 문의, 개인정보 포함 문의",
          responseTone: "친절한",
        });
        const policy = store.createCsPolicyGeneration(result.data);
        createApproval(task, result.data.replyTemplates[0], riskFromFlags(result.data.riskFlags), {
          policyId: policy.id,
          sourceRunId: run.id,
        });
        log(task, riskFromFlags(result.data.riskFlags), result.source);
      } else if (task.intent === "marketing_scripts") {
        const result = await postJson<ScriptsAIOutput>("/api/ai/scripts", {
          selectedScripts: ["GA4", "Google Tag Manager", "Google Ads", "Meta Pixel", "Naver Ads", "Kakao Pixel"],
          requiredEvents: ["page_view", "view_item", "add_to_cart", "begin_checkout", "purchase", "sign_up", "generate_lead"],
          commerceGoal: "Cafe24 이전 후 광고 구매 전환 측정",
        });
        store.saveScriptGuide(result.data);
        createApproval(task, result.data.testPlan[0], riskFromFlags(result.data.riskFlags), {
          guide: result.data,
          sourceRunId: run.id,
        });
        log(task, riskFromFlags(result.data.riskFlags), result.source);
      } else if (task.intent === "payment_recommendation") {
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
        const recommendation = store.createPaymentRecommendation(result.data);
        createApproval(task, result.data.recommendedPaymentMethods.join(", "), "low", {
          recommendationId: recommendation.id,
          sourceRunId: run.id,
        });
        log(task, "low", result.source);
      } else {
        createApproval(task, task.summary, task.riskLevel, {
          sourceRunId: run.id,
          originalCommand: run.originalCommand,
        });
        log(task, task.riskLevel, "mock");
      }
      store.updateWorkbenchTaskStatus(run.id, task.id, "completed");
    } catch {
      store.updateWorkbenchTaskStatus(run.id, task.id, "failed");
      store.addAuditLog({
        actor: "AI Workbench",
        action: "command_executed",
        target: `${task.title} 실패`,
        nextStatus: "failed",
        riskLevel: task.riskLevel,
        apiStatus: "failed",
      });
    }
  }

  function createApproval(
    task: Pick<WorkbenchTask, "approvalType" | "title">,
    summary: string,
    riskLevel: RiskLevel,
    payload: Record<string, unknown>,
  ) {
    store.createApprovalItem({
      type: task.approvalType as ApprovalItemType,
      title: task.title,
      summary,
      status: "pending_review",
      riskLevel,
      payload,
    });
  }

  function log(task: Pick<WorkbenchTask, "title">, riskLevel: RiskLevel, source: "mock" | "success") {
    store.addAuditLog({
      actor: "AI Workbench",
      action: "command_executed",
      target: task.title,
      nextStatus: "pending_review",
      riskLevel,
      apiStatus: source,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon />
            자연어 작업 요청
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="flex flex-col gap-3">
            <Textarea
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              className="min-h-32 resize-none text-sm leading-6"
              placeholder="예: Cafe24 이전부터 홈페이지/상세/AICS/마케팅 스크립트까지 한번에 준비해줘"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => createPlan()}
                disabled={isPlanning || !command.trim()}
                className="bg-gradient-to-r from-violet-600 to-blue-600 text-white"
              >
                {isPlanning ? <Loader2Icon className="animate-spin" /> : <ArrowRightIcon />}
                작업 계획 만들기
              </Button>
              <Button
                variant="outline"
                onClick={runSelectedTasks}
                disabled={!activeRun || isRunning || selectedTaskIds.length === 0}
              >
                {isRunning ? <Loader2Icon className="animate-spin" /> : <PlayIcon />}
                선택 작업 실행
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-500">예시 요청</p>
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setCommand(example)}
                className="rounded-xl border bg-slate-50 px-3 py-2 text-left text-xs leading-5 text-slate-700 transition-colors hover:bg-slate-100"
              >
                {example}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {activeRun ? (
        <>
          <WorkbenchRunSummary run={activeRun} />
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">작업 큐</h2>
              <p className="text-sm text-slate-600">필요한 작업만 선택해서 실행할 수 있습니다.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2Icon className="text-emerald-600" />
              {selectedTaskIds.length}개 선택됨
            </div>
          </div>
          <div className="grid gap-4">
            {activeRun.tasks.map((task) => (
              <WorkbenchTaskCard
                key={task.id}
                task={task}
                selected={selectedTaskIds.includes(task.id)}
                disabled={isRunning}
                onToggle={() => toggleTask(task.id)}
                onRun={() => {
                  setSelectedTaskIds([task.id]);
                  void runTask(activeRun, task);
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <Card className="border-dashed bg-white shadow-sm">
          <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
            <SparklesIcon className="text-violet-600" />
            <h2 className="text-lg font-semibold text-slate-950">아직 생성된 작업 계획이 없습니다</h2>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              자연어 요청을 입력하면 Cafe24 이전, 홈페이지 제작, 상세페이지, AI CS, 마케팅 스크립트, 페이먼츠 작업으로 분해합니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
