import { NextResponse } from "next/server";
import { prompts } from "@/lib/ai/prompts";
import {
  workflowPlanInputSchema,
  workflowPlanOutputSchema,
  type WorkflowPlanAIOutput,
} from "@/lib/ai/schemas";
import { generateStructuredOutput } from "@/lib/ai/service";

function hasAny(command: string, words: string[]) {
  return words.some((word) => command.includes(word));
}

function makeTask(
  id: string,
  intent: WorkflowPlanAIOutput["tasks"][number]["intent"],
  approvalType: WorkflowPlanAIOutput["tasks"][number]["approvalType"],
  targetModule: string,
  title: string,
  summary: string,
  riskLevel: "low" | "medium" | "high",
  steps: string[],
): WorkflowPlanAIOutput["tasks"][number] {
  return { id, intent, approvalType, targetModule, title, summary, riskLevel, steps };
}

function guessWorkflowPlan(command: string): WorkflowPlanAIOutput {
  const tasks: WorkflowPlanAIOutput["tasks"] = [];
  const broadRequest = hasAny(command, ["전체", "한번에", "한 번에", "다", "러버블", "Lovable"]);

  if (broadRequest || hasAny(command, ["이전", "Cafe24", "카페24", "서버"])) {
    tasks.push(
      makeTask(
        "task_migration",
        "migration_checklist",
        "migration",
        "migration",
        "Cafe24 이전 진단 전면 체크",
        "관리자 권한, 데이터 객체, 스킨, 리다이렉트, 스크립트 재설치 범위를 진단합니다.",
        "high",
        ["Cafe24 권한/스킨 백업 확인", "이전 데이터 객체 분류", "URL/스크립트 리스크 산정", "승인 대기열 등록"],
      ),
    );
  }

  if (broadRequest || hasAny(command, ["홈페이지", "메인", "브랜드몰", "랜딩"])) {
    tasks.push(
      makeTask(
        "task_website",
        "website_structure",
        "website",
        "website",
        "광고 유입용 홈페이지 구조 설계",
        "페이지별 설계안, CTA, SEO, 측정 이벤트, Cafe24 스킨 적용 작업을 생성합니다.",
        "medium",
        ["브랜드 브리프 정리", "페이지별 blueprint 생성", "SEO/측정 이벤트 설계", "승인 대기열 등록"],
      ),
    );
  }

  if (broadRequest || hasAny(command, ["상세", "상품", "상세페이지"])) {
    tasks.push(
      makeTask(
        "task_detail",
        "detail_page_copy",
        "detail_page",
        "detail-pages",
        "핵심 상품 상세페이지 3종 생성",
        "USP, 오퍼, 근거 블록, 표현 교정안, Cafe24 적용 체크리스트를 상품별로 생성합니다.",
        "medium",
        ["상위 상품 3개 선택", "전환 구조 생성", "금지 표현 교정", "상품별 승인 항목 등록"],
      ),
    );
  }

  if (broadRequest || hasAny(command, ["CS", "AICS", "상담", "답변", "고객센터"])) {
    tasks.push(
      makeTask(
        "task_cs",
        "cs_templates",
        "ai_cs",
        "ai-cs",
        "상담원 보조형 AI CS 세팅",
        "FAQ, 답변 매크로, intent routing, 상담원 연결 기준, Cafe24 게시판 적용 메모를 생성합니다.",
        "high",
        ["정책 기준 정리", "문의 intent 분류", "답변 매크로 생성", "고위험 문의 자동응답 차단"],
      ),
    );
  }

  if (broadRequest || hasAny(command, ["GA4", "Meta", "픽셀", "스크립트", "전환", "마케팅"])) {
    tasks.push(
      makeTask(
        "task_scripts",
        "marketing_scripts",
        "marketing_script",
        "marketing-scripts",
        "마케팅 스크립트 설치/테스트 계획",
        "GTM, GA4, Meta, Naver, purchase value/currency, 중복 전환 방지 체크를 생성합니다.",
        "medium",
        ["필수 스크립트 목록화", "이벤트 dataLayer 요구사항 작성", "테스트 플랜 생성", "승인 대기열 등록"],
      ),
    );
  }

  if (broadRequest || hasAny(command, ["페이먼츠", "결제", "PG", "네이버페이", "카카오페이", "토스"])) {
    tasks.push(
      makeTask(
        "task_payments",
        "payment_recommendation",
        "payments",
        "payments",
        "페이먼츠 구성 추천",
        "객단가와 판매 구조 기준으로 결제수단, 심사 항목, 테스트 계획을 생성합니다.",
        "low",
        ["결제수단 요구사항 정리", "PG/간편결제 후보 추천", "승인/테스트 체크리스트 생성", "승인 대기열 등록"],
      ),
    );
  }

  if (tasks.length === 0) {
    tasks.push(
      makeTask(
        "task_unknown",
        "unknown",
        "ad_copy",
        "approval",
        "요구사항 정리 필요",
        "어느 모듈에서 실행할지 불명확해 작업 목적과 입력값을 먼저 정리합니다.",
        "medium",
        ["요구사항 재정리", "대상 모듈 선택", "실행 전 승인 여부 확인"],
      ),
    );
  }

  return {
    title: "자연어 작업 계획",
    summary: "입력한 요구사항을 실행 가능한 콘솔 작업으로 분해했습니다. 선택한 작업만 실행할 수 있습니다.",
    assumptions: [
      "외부 Cafe24 API는 실제 호출하지 않고 MVP의 승인/적용 준비 흐름으로 처리합니다.",
      "AI 생성 결과는 바로 적용하지 않고 승인 대기열에 등록합니다.",
      "개인정보와 주문번호는 OpenAI 요청 전에 마스킹합니다.",
    ],
    riskNotes: [
      "회원/주문 데이터와 구매 이벤트는 개인정보 및 중복 전환 리스크 검토가 필요합니다.",
      "건강/뷰티 상품 표현은 효능 단정 문구를 자동으로 risk flag 처리합니다.",
    ],
    successCriteria: [
      "선택 작업이 승인 대기열에 등록됨",
      "작업 로그에 생성/실행 이력이 남음",
      "Dashboard 전체 판단 카드에서 blocker가 줄어듦",
    ],
    tasks,
  };
}

export async function POST(request: Request) {
  try {
    const payload = workflowPlanInputSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json({ message: "작업 요청을 입력해 주세요." }, { status: 400 });
    }

    const result = await generateStructuredOutput({
      taskName: "workflow_plan",
      prompt: prompts.workflow,
      input: payload.data,
      schema: workflowPlanOutputSchema,
      mock: guessWorkflowPlan(payload.data.command),
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { message: "자연어 작업 계획 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
