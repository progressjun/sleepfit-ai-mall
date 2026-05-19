"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  BotIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  CreditCardIcon,
  FileTextIcon,
  GaugeIcon,
  LayoutTemplateIcon,
  Loader2Icon,
  MegaphoneIcon,
  MonitorCogIcon,
  PlayIcon,
  SendIcon,
  ShoppingBagIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { postJson } from "@/lib/client-api";
import { solutionModuleDefinitions, type SolutionModuleDefinition } from "@/lib/commerce/solution-modules";
import { useDemoStore } from "@/lib/store/use-demo-store";
import type { RiskLevel, WorkbenchTaskStatus } from "@/types";
import type { WorkflowPlanAIOutput } from "@/lib/ai/schemas";

type ModuleStatus = "ready" | "working" | "review" | "blocked";

interface CockpitModule extends SolutionModuleDefinition {
  status: ModuleStatus;
  score: number;
  signal: string;
  blocker: string;
}

const quickCommands = [
  "Cafe24 이전부터 스킨, 상세페이지, CS, 전환 스크립트, 결제 테스트까지 운영 패키지로 정리해줘",
  "광고 집행 전 차단 요소만 우선순위로 뽑고 승인 대기열에 올려줘",
  "상품상세 3개와 게시판 답변 매크로를 과장 표현 없이 다시 생성해줘",
];

const statusLabel: Record<ModuleStatus, string> = {
  ready: "운영 가능",
  working: "작업 중",
  review: "검수 필요",
  blocked: "차단",
};

const statusStyles: Record<ModuleStatus, string> = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  working: "border-blue-200 bg-blue-50 text-blue-700",
  review: "border-amber-200 bg-amber-50 text-amber-800",
  blocked: "border-red-200 bg-red-50 text-red-700",
};

const moduleIcons: Record<string, typeof ShoppingBagIcon> = {
  "store-foundation": ShoppingBagIcon,
  "migration-data": MonitorCogIcon,
  "design-skin": LayoutTemplateIcon,
  "product-detail": FileTextIcon,
  "cs-board": UsersIcon,
  "marketing-tracking": MegaphoneIcon,
  "payments-fulfillment": CreditCardIcon,
  "approval-governance": ClipboardCheckIcon,
};

function riskFromFlags(flags: { level: RiskLevel }[] = []): RiskLevel {
  if (flags.some((flag) => flag.level === "high")) return "high";
  if (flags.some((flag) => flag.level === "medium")) return "medium";
  return "low";
}

function runStatus(tasks: { status: WorkbenchTaskStatus }[]) {
  if (!tasks.length) return "작업 계획 없음";
  const completed = tasks.filter((task) => task.status === "completed").length;
  const running = tasks.some((task) => task.status === "running");
  if (running) return "실행 중";
  return `${completed}/${tasks.length} 완료`;
}

export function CommerceCockpit() {
  const store = useDemoStore();
  const [command, setCommand] = useState(quickCommands[0]);
  const [isPlanning, setIsPlanning] = useState(false);
  const activeProjectId = store.activeProjectId;
  const project = store.projects.find((item) => item.id === activeProjectId);
  const migration = store.migrationDiagnostics.find((item) => item.projectId === activeProjectId);
  const website = store.websiteGenerations.find((item) => item.projectId === activeProjectId);
  const detailCount = store.detailPageGenerations.filter((item) => item.projectId === activeProjectId).length;
  const csPolicy = store.csPolicies.find((item) => item.projectId === activeProjectId);
  const payment = store.paymentRecommendations.find((item) => item.projectId === activeProjectId);
  const pendingApprovals = store.approvalItems.filter((item) => item.projectId === activeProjectId && item.status === "pending_review");
  const highRisk = pendingApprovals.filter((item) => item.riskLevel === "high").length;
  const testedEvents = store.marketingScripts.flatMap((script) => script.events).filter((event) => event.status === "tested").length;
  const totalEvents = store.marketingScripts.flatMap((script) => script.events).length;
  const scriptScore = totalEvents ? Math.round((testedEvents / totalEvents) * 100) : 0;
  const latestRun = store.workbenchRuns[0];

  const modules: CockpitModule[] = useMemo(
    () =>
      solutionModuleDefinitions.map((definition) => {
        if (definition.id === "store-foundation") {
          return {
            ...definition,
            status: migration ? "working" : "review",
            score: migration ? 58 : 22,
            signal: migration ? "상품/옵션/진열분류 데이터 객체 확인됨" : "상품 운영 기준 미정",
            blocker: "쿠폰/혜택, 재고/판매상태 연결 필요",
          };
        }
        if (definition.id === "migration-data") {
          return {
            ...definition,
            status: migration?.redirectPlan?.length ? "review" : "blocked",
            score: migration?.redirectPlan?.length ? 66 : 30,
            signal: migration?.summary ?? "이전 진단 없음",
            blocker: "회원/주문 개인정보 이전 범위 승인 필요",
          };
        }
        if (definition.id === "design-skin") {
          return {
            ...definition,
            status: website ? "working" : "review",
            score: website ? 62 : 18,
            signal: website?.cafe24ThemeTasks?.[0] ?? "스킨 설계 생성 전",
            blocker: "주문완료 템플릿과 모바일 CTA QA 필요",
          };
        }
        if (definition.id === "product-detail") {
          return {
            ...definition,
            status: detailCount >= 3 ? "ready" : "review",
            score: Math.min(35 + detailCount * 18, 92),
            signal: `상세페이지 초안 ${detailCount}개`,
            blocker: "광고 집행 상품 최소 3개 검수 필요",
          };
        }
        if (definition.id === "cs-board") {
          return {
            ...definition,
            status: csPolicy ? "review" : "blocked",
            score: csPolicy ? 56 : 20,
            signal: csPolicy?.macroTemplates?.[0] ?? "상담원 매크로 미생성",
            blocker: "직접 자동응답 금지, 상담원 보조형 승인 필요",
          };
        }
        if (definition.id === "marketing-tracking") {
          return {
            ...definition,
            status: scriptScore >= 80 ? "ready" : "blocked",
            score: scriptScore,
            signal: `이벤트 테스트 ${testedEvents}/${totalEvents}`,
            blocker: "purchase value/currency와 중복 전환 방지 확인 필요",
          };
        }
        if (definition.id === "payments-fulfillment") {
          return {
            ...definition,
            status: payment ? "working" : "review",
            score: payment ? 64 : 20,
            signal: payment?.recommendedPaymentMethods?.join(" · ") ?? "결제 구성 추천 전",
            blocker: "PG 심사, 소액 결제, 부분 취소 테스트 필요",
          };
        }
        return {
          ...definition,
          status: highRisk ? "blocked" : pendingApprovals.length ? "review" : "working",
          score: pendingApprovals.length ? 68 : 42,
          signal: `승인 대기 ${pendingApprovals.length}건`,
          blocker: highRisk ? "high risk 승인 경고 확인 필요" : "승인 후 적용 준비로 이동",
        };
      }),
    [csPolicy, detailCount, highRisk, migration, payment, pendingApprovals.length, scriptScore, testedEvents, totalEvents, website],
  );

  const coverageScore = Math.round(modules.reduce((total, item) => total + item.score, 0) / modules.length);
  const blockedCount = modules.filter((module) => module.status === "blocked").length;
  const readyCount = modules.filter((module) => module.status === "ready").length;
  const riskFlags = [
    ...store.migrationDiagnostics.flatMap((item) => item.riskFlags),
    ...store.detailPageGenerations.flatMap((item) => item.riskFlags),
    ...store.csPolicies.flatMap((item) => item.riskFlags),
  ];

  async function createPlan(value = command) {
    if (!value.trim()) return;
    setIsPlanning(true);
    try {
      const result = await postJson<WorkflowPlanAIOutput>("/api/command/workflow", { command: value });
      const run = store.createWorkbenchRun({
        title: result.data.title,
        originalCommand: value,
        summary: result.data.summary,
        assumptions: result.data.assumptions,
        riskNotes: result.data.riskNotes,
        successCriteria: result.data.successCriteria,
        tasks: result.data.tasks.map((task) => ({ ...task, status: "planned" })),
      });
      store.addAuditLog({
        actor: "AI Control Tower",
        action: "command_executed",
        target: "운영 패키지 작업 계획 생성",
        nextStatus: "planned",
        riskLevel: riskFromFlags(riskFlags),
        apiStatus: result.source,
      });
      setCommand(run.originalCommand);
    } finally {
      setIsPlanning(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Provider: {project?.currentPlatform ?? "Mock"}</Badge>
                <Badge className="bg-slate-950 text-white hover:bg-slate-950">Mock-safe MVP</Badge>
                <Badge variant="secondary" className="hidden sm:inline-flex">외부 자동 적용 차단</Badge>
              </div>
              <h1 className="mt-5 text-2xl font-semibold leading-tight text-slate-950 sm:hidden">
                AI 운영 관제
              </h1>
              <h1 className="mt-5 hidden max-w-3xl break-words text-2xl font-semibold leading-tight text-slate-950 sm:block md:text-3xl">
                Cafe24형 쇼핑몰 운영을 AI 작업 큐로 재구성합니다
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:hidden">
                이전, 스킨, 상세, CS, 전환, 결제를 한 화면에서 관리합니다.
              </p>
              <p className="mt-3 hidden max-w-3xl break-words text-sm leading-6 text-slate-600 sm:block">
                서버 이전, 스킨, 상품상세, CS 게시판, 광고 전환 측정, 페이먼츠, 승인 로그를 하나의 운영 관제 화면에서 판단하고 실행합니다.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-4">
                {[
                  { label: "운영 커버리지", value: `${coverageScore}%` },
                  { label: "차단 모듈", value: blockedCount },
                  { label: "준비 모듈", value: `${readyCount}/${modules.length}` },
                  { label: "승인 대기", value: pendingApprovals.length },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-950 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">광고 집행 준비도</p>
                  <p className="mt-2 text-5xl font-semibold">{coverageScore}</p>
                </div>
                <GaugeIcon className="hidden size-10 text-emerald-300 sm:block" />
              </div>
              <Progress value={coverageScore} className="mt-6 [&_[data-slot=progress-indicator]]:bg-emerald-400 [&_[data-slot=progress-track]]:bg-white/15" />
              <p className="mt-5 text-sm leading-6 text-slate-300 sm:hidden">
                {blockedCount ? `${blockedCount}개 모듈 검수 필요` : "차단 요소 없음"}
              </p>
              <p className="mt-5 hidden text-sm leading-6 text-slate-300 sm:block">
                {blockedCount
                  ? `${blockedCount}개 모듈은 테스트 또는 승인 전까지 적용 준비가 차단됩니다.`
                  : "핵심 차단 요소 없이 적용 준비 단계로 이동할 수 있습니다."}
              </p>
              <Link
                href="/workspace"
                className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-sm font-medium text-slate-950"
              >
                자연어 작업실 열기
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
          </div>
        </div>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SparklesIcon />
              운영 지시 입력
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Textarea
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              className="min-h-28 resize-none text-sm leading-6"
            />
            <Button onClick={() => createPlan()} disabled={isPlanning || !command.trim()} className="bg-slate-950 text-white hover:bg-slate-800">
              {isPlanning ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
              작업 계획 생성
            </Button>
            <div className="flex flex-col gap-2">
              {quickCommands.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCommand(item)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs leading-5 text-slate-700 hover:bg-white"
                >
                  {item}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
          {modules.map((module) => {
            const Icon = moduleIcons[module.id] ?? ShoppingBagIcon;
            return (
              <Link
                key={module.id}
                href={module.route}
                className="flex min-h-64 flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-950">{module.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{module.owner}</p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-xs font-medium ${statusStyles[module.status]}`}>
                    {statusLabel[module.status]}
                  </span>
                </div>
                <p className="mt-4 min-h-10 text-sm leading-6 text-slate-600">{module.description}</p>
                <Progress value={module.score} className="mt-3" />
                <div className="mt-4 flex flex-wrap gap-2">
                  {module.capabilities.slice(0, 3).map((capability) => (
                    <span key={capability} className="rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600">
                      {capability}
                    </span>
                  ))}
                </div>
                <div className="mt-auto pt-4">
                  <p className="text-xs font-semibold text-slate-500">현재 신호</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-700">{module.signal}</p>
                  <p className="mt-3 text-xs font-semibold text-slate-500">차단 요소</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-700">{module.blocker}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col gap-4">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BotIcon />
                최신 AI 작업 큐
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {latestRun ? (
                <>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="font-semibold text-slate-950">{latestRun.title}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-600">{latestRun.summary}</p>
                    <p className="mt-3 text-xs font-medium text-slate-500">{runStatus(latestRun.tasks)}</p>
                  </div>
                  {latestRun.tasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{task.title}</p>
                        <p className="text-xs text-slate-500">{task.status}</p>
                      </div>
                      <PlayIcon className="size-4 text-slate-400" />
                    </div>
                  ))}
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  아직 자연어 작업 계획이 없습니다. 운영 지시를 입력해 작업 큐를 먼저 생성하세요.
                </div>
              )}
              <Link href="/workspace" className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50">
                작업 큐 상세 보기
                <ArrowRightIcon className="size-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangleIcon />
                검수 우선순위
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {[
                "purchase 이벤트 value/currency 테스트",
                "회원/주문 데이터 개인정보 이전 범위 승인",
                "상품상세 건강/효능 단정 표현 제거",
                "PG 심사와 모바일 결제 테스트",
              ].map((item, index) => (
                <div key={item} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="border-slate-200 bg-white shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2Icon />
              최근 승인/로그
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden rounded-lg border border-slate-200 p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-3 py-2">작업</th>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2">리스크</th>
                  <th className="px-3 py-2">시간</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {store.auditLogs.slice(0, 6).map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-3 font-medium text-slate-800">{log.target}</td>
                    <td className="px-3 py-3 text-slate-600">{log.nextStatus ?? "-"}</td>
                    <td className="px-3 py-3 text-slate-600">{log.riskLevel ?? "-"}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>운영 원칙</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm leading-6 text-slate-700">
            <p className="rounded-lg bg-slate-50 p-3">외부 쇼핑몰 API는 MVP에서 실제 호출하지 않습니다.</p>
            <p className="rounded-lg bg-slate-50 p-3">AI 생성 결과는 승인 대기열을 거친 뒤 적용 준비 상태로만 이동합니다.</p>
            <p className="rounded-lg bg-slate-50 p-3">고객 개인정보는 OpenAI 요청 전 마스킹합니다.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
