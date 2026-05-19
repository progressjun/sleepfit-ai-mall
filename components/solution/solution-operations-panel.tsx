"use client";

import Link from "next/link";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  GaugeIcon,
} from "lucide-react";
import { RiskBadge } from "@/components/common/risk-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { solutionModuleDefinitions, type SolutionModuleDefinition } from "@/lib/commerce/solution-modules";
import { useDemoStore } from "@/lib/store/use-demo-store";
import { cn } from "@/lib/utils";

type ModuleStatus = "ready" | "partial" | "missing" | "blocked";

interface ModuleViewModel extends SolutionModuleDefinition {
  status: ModuleStatus;
  progress: number;
  evidence: string[];
  nextActions: string[];
}

const statusLabels: Record<ModuleStatus, string> = {
  ready: "준비됨",
  partial: "보강 필요",
  missing: "미시작",
  blocked: "리스크 검수",
};

const statusClassNames: Record<ModuleStatus, string> = {
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partial: "bg-blue-50 text-blue-700 border-blue-200",
  missing: "bg-slate-100 text-slate-600 border-slate-200",
  blocked: "bg-amber-50 text-amber-800 border-amber-200",
};

function moduleIcon(status: ModuleStatus) {
  if (status === "ready") return <CheckCircle2Icon className="text-emerald-600" />;
  if (status === "blocked") return <AlertTriangleIcon className="text-amber-600" />;
  if (status === "partial") return <GaugeIcon className="text-blue-600" />;
  return <CircleDashedIcon className="text-slate-500" />;
}

export function SolutionOperationsPanel() {
  const store = useDemoStore();
  const activeProjectId = store.activeProjectId;
  const project = store.projects.find((item) => item.id === activeProjectId);
  const migration = store.migrationDiagnostics.find((item) => item.projectId === activeProjectId);
  const website = store.websiteGenerations.find((item) => item.projectId === activeProjectId);
  const detailCount = store.detailPageGenerations.filter((item) => item.projectId === activeProjectId).length;
  const csPolicy = store.csPolicies.find((item) => item.projectId === activeProjectId);
  const payment = store.paymentRecommendations.find((item) => item.projectId === activeProjectId);
  const pendingHighRisk = store.approvalItems.filter(
    (item) => item.projectId === activeProjectId && item.status === "pending_review" && item.riskLevel === "high",
  ).length;
  const requiredScripts = store.marketingScripts.filter((script) => script.projectId === activeProjectId && script.required);
  const purchaseTested = store.marketingScripts.some((script) =>
    script.projectId === activeProjectId &&
    script.events.some((event) => event.eventName === "purchase" && event.status === "tested"),
  );
  const allRequiredScriptEventsTested =
    requiredScripts.length > 0 &&
    requiredScripts.every((script) => script.events.every((event) => event.status === "tested"));

  const modules: ModuleViewModel[] = solutionModuleDefinitions.map((definition) => {
    if (definition.id === "store-foundation") {
      return {
        ...definition,
        status: migration ? "partial" : "missing",
        progress: migration ? 55 : 20,
        evidence: migration?.cafe24DataObjects?.slice(0, 2) ?? ["상품/옵션/진열분류 점검이 아직 생성되지 않았습니다."],
        nextActions: ["상품/옵션/진열분류 데이터 객체 확정", "쿠폰/혜택 노출 위치와 운영 권한 확인"],
      };
    }
    if (definition.id === "migration-data") {
      const hasRedirect = Boolean(migration?.redirectPlan?.length);
      return {
        ...definition,
        status: migration && hasRedirect ? "partial" : "missing",
        progress: migration && hasRedirect ? 65 : migration ? 45 : 10,
        evidence: migration ? [migration.summary, ...(migration.redirectPlan ?? []).slice(0, 1)] : ["이전 진단을 먼저 생성해야 합니다."],
        nextActions: ["회원/주문 개인정보 이전 범위 승인", "상품/카테고리/게시판 URL 매핑표 작성"],
      };
    }
    if (definition.id === "design-skin") {
      return {
        ...definition,
        status: website ? "partial" : "missing",
        progress: website ? 60 : 15,
        evidence: website?.cafe24ThemeTasks?.slice(0, 2) ?? ["메인/상품목록/상세/주문완료 스킨 작업이 아직 없습니다."],
        nextActions: ["스킨 백업 후 템플릿별 수정 범위 분리", "모바일 CTA와 하단 탭바 충돌 QA"],
      };
    }
    if (definition.id === "product-detail") {
      return {
        ...definition,
        status: detailCount >= 3 ? "ready" : detailCount > 0 ? "partial" : "missing",
        progress: Math.min(detailCount * 30, 90),
        evidence: [`상세페이지 초안 ${detailCount}개 생성`, "표현 리스크와 Cafe24 적용 체크리스트 포함"],
        nextActions: ["광고 집행 상품 최소 3개 상세 초안 확보", "상품상세 HTML 백업 후 적용 QA"],
      };
    }
    if (definition.id === "cs-board") {
      return {
        ...definition,
        status: csPolicy ? "blocked" : "missing",
        progress: csPolicy ? 55 : 10,
        evidence: csPolicy?.cafe24IntegrationNotes?.slice(0, 2) ?? ["상담원 매크로와 게시판 적용 메모가 아직 없습니다."],
        nextActions: ["고객 직접 자동응답 비활성 유지", "게시판/상품문의 매크로 적용 전 금지 표현 검수"],
      };
    }
    if (definition.id === "marketing-tracking") {
      return {
        ...definition,
        status: allRequiredScriptEventsTested ? "ready" : purchaseTested ? "partial" : "blocked",
        progress: allRequiredScriptEventsTested ? 90 : purchaseTested ? 65 : 35,
        evidence: [
          `필수 스크립트 ${requiredScripts.length}개 관리`,
          purchaseTested ? "purchase 이벤트 테스트 이력 있음" : "purchase value/currency 테스트 필요",
        ],
        nextActions: ["GTM preview로 page_view/view_item/purchase 확인", "주문번호 기준 중복 전환 방지 키 확인"],
      };
    }
    if (definition.id === "payments-fulfillment") {
      return {
        ...definition,
        status: payment ? "partial" : "missing",
        progress: payment ? 65 : 20,
        evidence: payment?.recommendedPaymentMethods?.slice(0, 3) ?? ["PG/간편결제 추천안이 아직 없습니다."],
        nextActions: ["PG 심사 상태와 정산 계좌 확인", "소액 결제/부분 취소/구매 이벤트 테스트"],
      };
    }
    return {
      ...definition,
      status: pendingHighRisk ? "blocked" : store.approvalItems.length ? "partial" : "missing",
      progress: pendingHighRisk ? 45 : store.approvalItems.length ? 70 : 20,
      evidence: [
        `승인 대기 ${store.approvalItems.filter((item) => item.status === "pending_review").length}건`,
        `작업 로그 ${store.auditLogs.length}건`,
      ],
      nextActions: ["high risk 승인 전 경고 확인", "승인된 항목만 적용 준비 상태로 이동"],
    };
  });

  const coverageScore = Math.round(
    modules.reduce((total, module) => total + module.progress, 0) / modules.length,
  );
  const readyCount = modules.filter((module) => module.status === "ready").length;
  const blockedCount = modules.filter((module) => module.status === "blocked").length;

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GaugeIcon />
              쇼핑몰 솔루션 운영 커버리지
            </CardTitle>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {project?.currentPlatform ?? "Commerce provider"}형 관리자 콘솔에 필요한 상품, 주문/회원, 스킨, 결제, 마케팅, CS, 승인 거버넌스를 모듈 단위로 점검합니다.
            </p>
          </div>
          <div className="min-w-64 rounded-2xl bg-slate-950 p-4 text-white">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-slate-300">전체 커버리지</p>
                <p className="mt-1 text-3xl font-semibold">{coverageScore}%</p>
              </div>
              <Badge className="bg-white/10 text-white hover:bg-white/10">
                준비 {readyCount}/{modules.length}
              </Badge>
            </div>
            <Progress value={coverageScore} className="mt-4 bg-white/20" />
            <p className="mt-3 text-xs leading-5 text-slate-300">
              {blockedCount ? `${blockedCount}개 모듈은 승인 또는 테스트 전 차단 요소가 있습니다.` : "즉시 차단 요소 없이 보강 순서만 남았습니다."}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        {modules.map((module) => (
          <div key={module.id} className="flex min-h-80 flex-col rounded-2xl border bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {moduleIcon(module.status)}
                <div>
                  <p className="text-sm font-semibold text-slate-950">{module.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{module.owner}</p>
                </div>
              </div>
              <RiskBadge level={module.riskLevel} />
            </div>
            <p className="mt-4 min-h-12 text-sm leading-6 text-slate-600">{module.description}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClassNames[module.status]}`}>
                {statusLabels[module.status]}
              </span>
              <span className="text-xs text-slate-500">{module.progress}%</span>
            </div>
            <Progress value={module.progress} className="mt-3" />
            <div className="mt-4 flex flex-wrap gap-2">
              {module.capabilities.slice(0, 4).map((item) => (
                <span key={item} className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-1 flex-col gap-2">
              <p className="text-xs font-semibold text-slate-500">확인 근거</p>
              {module.evidence.slice(0, 2).map((item) => (
                <p key={item} className="text-xs leading-5 text-slate-700">{item}</p>
              ))}
              <p className="mt-2 text-xs font-semibold text-slate-500">다음 조치</p>
              {module.nextActions.slice(0, 2).map((item) => (
                <p key={item} className="text-xs leading-5 text-slate-700">{item}</p>
              ))}
            </div>
            <Link
              href={module.route}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 justify-between")}
            >
              {module.routeLabel}
              <ArrowRightIcon />
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
