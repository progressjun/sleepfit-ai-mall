"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mockApprovalItems } from "@/data/mock/approval-items";
import { mockAuditLogs } from "@/data/mock/audit-logs";
import { mockMigrationDiagnostics } from "@/data/mock/migration";
import { mockPaymentRecommendations } from "@/data/mock/payments";
import { mockProducts } from "@/data/mock/products";
import { mockProjects } from "@/data/mock/projects";
import { mockMarketingScripts } from "@/data/mock/scripts";
import type {
  ApprovalItem,
  AuditLog,
  CommandMessage,
  CsPolicyGeneration,
  DetailPageGeneration,
  MarketingScript,
  MigrationDiagnostic,
  PaymentRecommendation,
  Project,
  WebsiteGeneration,
  WorkbenchRun,
  WorkbenchTaskStatus,
} from "@/types";
import type {
  CsAIOutput,
  DetailPageAIOutput,
  MigrationAIOutput,
  PaymentsAIOutput,
  ScriptsAIOutput,
  WebsiteAIOutput,
} from "@/lib/ai/schemas";

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: "owner" | "member";
}

const defaultCurrentUser: DemoUser = {
  id: "user_koms7099",
  email: "koms7099@gmail.com",
  name: "koms7099",
  role: "owner",
};

const initialDetailGenerations: DetailPageGeneration[] = [
  {
    id: "detail_001",
    projectId: "project_001",
    productId: "product_001",
    uspSummary: ["간편한 루틴", "개별 포장", "선물형 구성"],
    targetCustomer: ["건강 루틴을 시작하려는 고객"],
    conversionBarriers: ["건강 효능 단정 표현 주의"],
    headline: "매일 챙기기 쉬운 프리미엄 루틴 세트",
    subHeadline: "꾸준함을 돕는 구성으로 첫 구매 장벽을 낮춥니다.",
    sectionStructure: ["문제 공감", "USP", "루틴 안내", "리뷰", "FAQ", "CTA"],
    faq: ["언제 섭취하나요? 개인 루틴에 맞춰 일정하게 섭취해 주세요."],
    cta: ["내 루틴으로 시작하기"],
    adCopyVariants: ["바쁜 일상에도 간편하게 챙기는 데일리 루틴"],
    offerStack: [
      "첫 구매 10% 혜택 + 3만원 이상 무료배송",
      "정기구매 전환을 위한 2회차 리마인드 쿠폰",
      "리뷰 작성 시 적립금 지급 구조",
    ],
    evidenceBlocks: [
      "휴대성과 섭취 편의성 중심의 실제 리뷰 요약",
      "성분 효능 단정 대신 원료 기준과 섭취 루틴 안내",
      "교환/반품 기준을 구매 전 FAQ에 노출",
    ],
    sectionWireframe: [
      "Hero: 상품명, 가격, 핵심 혜택, sticky CTA",
      "Problem: 고객의 루틴 실패 원인 3가지",
      "Solution: 제품 구성과 섭취 편의성",
      "Proof: 리뷰/원료/배송 신뢰 요소",
      "FAQ: 섭취, 배송, 교환/반품",
    ],
    complianceRewrites: [
      "'장 건강을 치료합니다' -> '장 건강 루틴을 꾸준히 챙기고 싶은 분께 적합합니다'",
      "'100% 효과 보장' -> '개인 루틴과 섭취 환경에 따라 만족도는 달라질 수 있습니다'",
    ],
    cafe24ApplyChecklist: [
      "상품 상세 HTML 백업 후 신규 섹션 단위로 삽입",
      "모바일 상세 이미지 폭 860px 이하, lazy loading 확인",
      "상품 옵션/품목명과 광고 소재명 불일치 여부 검수",
    ],
    riskFlags: [
      {
        level: "medium",
        title: "효능 단정 표현 주의",
        description: "건강 관련 문구는 편의성과 루틴 중심으로 유지해야 합니다.",
      },
    ],
    approvalStatus: "pending_review",
    createdAt: "2026-05-05T05:20:00.000Z",
  },
];

const initialCsPolicies: CsPolicyGeneration[] = [
  {
    id: "cs_001",
    projectId: "project_001",
    faq: ["배송은 결제 완료 후 영업일 기준 1~3일 내 출고됩니다."],
    replyTemplates: ["문의 주셔서 감사합니다. 확인 후 상담원이 순차적으로 안내드리겠습니다."],
    escalationRules: ["결제 오류, 배송 사고, 의학적 문의는 상담원에게 즉시 연결"],
    prohibitedClaims: ["완치", "100% 효과", "부작용 없음"],
    intentRouting: [
      "배송/교환/반품은 정책형 답변으로 1차 분류",
      "효능, 부작용, 섭취 제한 문의는 상담원 확인 필요로 분류",
      "주문번호, 전화번호가 포함된 문의는 개인정보 마스킹 후 처리",
    ],
    macroTemplates: [
      "배송 지연: 현재 출고 상태 확인 후 예상 출고일과 보상 기준을 안내",
      "상품 문의: 단정 효능 대신 사용 방법, 원료 기준, 주의사항 중심으로 안내",
    ],
    qualityChecklist: [
      "환불/반품 가능 여부를 단정하기 전 주문 상태 확인",
      "의학적 판단으로 보일 수 있는 표현 제거",
      "상담원 연결 기준에 해당하면 자동 답변 금지",
    ],
    cafe24IntegrationNotes: [
      "Cafe24 게시판/상품문의 답변 매크로로 복사 가능한 톤 유지",
      "주문/회원 개인정보는 AI 입력 전 마스킹",
      "상담원용 초안만 생성하고 고객 자동 발송은 비활성",
    ],
    riskFlags: [
      {
        level: "high",
        title: "직접 자동응답 금지",
        description: "초기 MVP에서는 상담원 보조 초안으로만 사용합니다.",
      },
    ],
    createdAt: "2026-05-05T09:00:00.000Z",
  },
];

interface DemoStore {
  currentUser: DemoUser;
  projects: Project[];
  activeProjectId: string;
  migrationDiagnostics: MigrationDiagnostic[];
  websiteGenerations: WebsiteGeneration[];
  products: typeof mockProducts;
  detailPageGenerations: DetailPageGeneration[];
  csPolicies: CsPolicyGeneration[];
  marketingScripts: MarketingScript[];
  paymentRecommendations: PaymentRecommendation[];
  approvalItems: ApprovalItem[];
  auditLogs: AuditLog[];
  commandCenterMessages: CommandMessage[];
  workbenchRuns: WorkbenchRun[];
  latestScriptGuide?: ScriptsAIOutput;
  setActiveProject: (projectId: string) => void;
  createMigrationDiagnostic: (data: MigrationAIOutput) => MigrationDiagnostic;
  createWebsiteGeneration: (data: WebsiteAIOutput) => WebsiteGeneration;
  createDetailPageGeneration: (
    productId: string,
    data: DetailPageAIOutput,
  ) => DetailPageGeneration;
  createCsPolicyGeneration: (data: CsAIOutput) => CsPolicyGeneration;
  updateMarketingScriptStatus: (scriptId: string, eventName?: string) => void;
  saveScriptGuide: (data: ScriptsAIOutput) => void;
  createPaymentRecommendation: (data: PaymentsAIOutput) => PaymentRecommendation;
  createApprovalItem: (
    item: Omit<ApprovalItem, "id" | "projectId" | "createdAt" | "updatedAt">,
  ) => ApprovalItem;
  approveItem: (itemId: string) => void;
  rejectItem: (itemId: string) => void;
  markItemAsApplied: (itemId: string) => void;
  addAuditLog: (log: Omit<AuditLog, "id" | "projectId" | "createdAt">) => AuditLog;
  addCommandMessage: (
    message: Omit<CommandMessage, "id" | "createdAt">,
  ) => CommandMessage;
  createWorkbenchRun: (
    run: Omit<WorkbenchRun, "id" | "projectId" | "createdAt" | "updatedAt">,
  ) => WorkbenchRun;
  updateWorkbenchTaskStatus: (
    runId: string,
    taskId: string,
    status: WorkbenchTaskStatus,
  ) => void;
}

export const useDemoStore = create<DemoStore>()(
  persist(
    (set, get) => ({
      currentUser: defaultCurrentUser,
      projects: mockProjects,
      activeProjectId: "project_001",
      migrationDiagnostics: mockMigrationDiagnostics,
      websiteGenerations: [],
      products: mockProducts,
      detailPageGenerations: initialDetailGenerations,
      csPolicies: initialCsPolicies,
      marketingScripts: mockMarketingScripts,
      paymentRecommendations: mockPaymentRecommendations,
      approvalItems: mockApprovalItems,
      auditLogs: mockAuditLogs,
      commandCenterMessages: [
        {
          id: "cmd_001",
          role: "assistant",
          content: "자연어로 작업을 요청하면 실행 전 계획과 승인 흐름으로 정리해드릴게요.",
          createdAt: "2026-05-07T01:00:00.000Z",
        },
      ],
      workbenchRuns: [],
      setActiveProject: (projectId) => set({ activeProjectId: projectId }),
      createMigrationDiagnostic: (data) => {
        const diagnostic: MigrationDiagnostic = {
          id: id("migration"),
          projectId: get().activeProjectId,
          approvalStatus: "pending_review",
          createdAt: now(),
          ...data,
        };
        set((state) => ({
          migrationDiagnostics: [diagnostic, ...state.migrationDiagnostics],
        }));
        return diagnostic;
      },
      createWebsiteGeneration: (data) => {
        const generation: WebsiteGeneration = {
          id: id("website"),
          projectId: get().activeProjectId,
          approvalStatus: "pending_review",
          createdAt: now(),
          ...data,
        };
        set((state) => ({
          websiteGenerations: [generation, ...state.websiteGenerations],
        }));
        return generation;
      },
      createDetailPageGeneration: (productId, data) => {
        const generation: DetailPageGeneration = {
          id: id("detail"),
          projectId: get().activeProjectId,
          productId,
          approvalStatus: "pending_review",
          createdAt: now(),
          ...data,
        };
        set((state) => ({
          detailPageGenerations: [generation, ...state.detailPageGenerations],
        }));
        return generation;
      },
      createCsPolicyGeneration: (data) => {
        const policy: CsPolicyGeneration = {
          id: id("cs"),
          projectId: get().activeProjectId,
          createdAt: now(),
          ...data,
        };
        set((state) => ({
          csPolicies: [policy, ...state.csPolicies],
        }));
        return policy;
      },
      updateMarketingScriptStatus: (scriptId, eventName) => {
        set((state) => ({
          marketingScripts: state.marketingScripts.map((script) => {
            if (script.id !== scriptId) return script;
            return {
              ...script,
              status: "active",
              events: script.events.map((event) =>
                !eventName || event.eventName === eventName
                  ? { ...event, status: "tested" }
                  : event,
              ),
            };
          }),
        }));
      },
      saveScriptGuide: (data) => set({ latestScriptGuide: data }),
      createPaymentRecommendation: (data) => {
        const recommendation: PaymentRecommendation = {
          id: id("payment"),
          projectId: get().activeProjectId,
          createdAt: now(),
          ...data,
        };
        set((state) => ({
          paymentRecommendations: [recommendation, ...state.paymentRecommendations],
        }));
        return recommendation;
      },
      createApprovalItem: (item) => {
        const approvalItem: ApprovalItem = {
          id: id("approval"),
          projectId: get().activeProjectId,
          createdAt: now(),
          updatedAt: now(),
          ...item,
        };
        set((state) => ({
          approvalItems: [approvalItem, ...state.approvalItems],
        }));
        return approvalItem;
      },
      approveItem: (itemId) => {
        set((state) => ({
          approvalItems: state.approvalItems.map((item) =>
            item.id === itemId
              ? { ...item, status: "approved", updatedAt: now() }
              : item,
          ),
        }));
      },
      rejectItem: (itemId) => {
        set((state) => ({
          approvalItems: state.approvalItems.map((item) =>
            item.id === itemId
              ? { ...item, status: "rejected", updatedAt: now() }
              : item,
          ),
        }));
      },
      markItemAsApplied: (itemId) => {
        set((state) => ({
          approvalItems: state.approvalItems.map((item) =>
            item.id === itemId
              ? { ...item, status: "ready_to_apply", updatedAt: now() }
              : item,
          ),
        }));
      },
      addAuditLog: (log) => {
        const entry: AuditLog = {
          id: id("log"),
          projectId: get().activeProjectId,
          createdAt: now(),
          ...log,
        };
        set((state) => ({
          auditLogs: [entry, ...state.auditLogs],
        }));
        return entry;
      },
      addCommandMessage: (message) => {
        const entry: CommandMessage = {
          id: id("cmd"),
          createdAt: now(),
          ...message,
        };
        set((state) => ({
          commandCenterMessages: [...state.commandCenterMessages, entry],
        }));
        return entry;
      },
      createWorkbenchRun: (run) => {
        const entry: WorkbenchRun = {
          id: id("run"),
          projectId: get().activeProjectId,
          createdAt: now(),
          updatedAt: now(),
          ...run,
        };
        set((state) => ({
          workbenchRuns: [entry, ...state.workbenchRuns],
        }));
        return entry;
      },
      updateWorkbenchTaskStatus: (runId, taskId, status) => {
        set((state) => ({
          workbenchRuns: state.workbenchRuns.map((run) =>
            run.id === runId
              ? {
                  ...run,
                  updatedAt: now(),
                  tasks: run.tasks.map((task) =>
                    task.id === taskId ? { ...task, status } : task,
                  ),
                }
              : run,
          ),
        }));
      },
    }),
    {
      name: "commerce-migration-console-demo",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
