import { NextResponse } from "next/server";
import type { CommandAIOutput } from "@/lib/ai/schemas";
import { mockCommandResponse } from "@/lib/ai/mock-responses";
import { prompts } from "@/lib/ai/prompts";
import { commandParseInputSchema, commandParseOutputSchema } from "@/lib/ai/schemas";
import { generateStructuredOutput } from "@/lib/ai/service";

function guessCommand(command: string): CommandAIOutput {
  if (command.includes("홈페이지") || command.includes("구조")) {
    return {
      intent: "website_structure",
      title: "홈페이지 구조 생성",
      summary: "브랜드몰 메인, 카테고리, CTA, FAQ 구조를 생성합니다.",
      steps: ["브랜드 정보 확인", "페이지 구성안 생성", "CTA 검토", "승인 대기열 등록"],
      targetModule: "website",
      riskNotes: ["브랜드 효능이나 성과를 과장하지 않도록 검토합니다."],
      requiresApproval: true,
    };
  }

  if (command.includes("상세")) {
    return {
      intent: command.includes("리스크") ? "risk_review" : "detail_page_copy",
      title: command.includes("리스크") ? "상세페이지 리스크 점검" : "상세페이지 초안 생성",
      summary: "상품 USP와 구매장벽을 기준으로 상세페이지 초안을 생성합니다.",
      steps: ["상품 정보 확인", "전환 구조 생성", "금지 표현 점검", "승인 대기열 등록"],
      targetModule: "detail-pages",
      riskNotes: ["완치, 100% 효과, 보장 같은 단정 표현은 제외합니다."],
      requiresApproval: true,
    };
  }

  if (command.includes("CS") || command.includes("답변") || command.includes("상담")) {
    return {
      intent: "cs_templates",
      title: "AI CS 템플릿 생성",
      summary: "상담원 보조형 FAQ와 답변 초안을 생성합니다.",
      steps: ["정책 입력 확인", "FAQ 생성", "상담원 연결 기준 생성", "승인 대기열 등록"],
      targetModule: "ai-cs",
      riskNotes: ["고객 직접 자동응답이 아니라 상담원 보조 초안으로만 사용합니다."],
      requiresApproval: true,
    };
  }

  if (command.includes("GA4") || command.includes("Meta") || command.includes("스크립트")) {
    return {
      intent: "marketing_scripts",
      title: "마케팅 스크립트 설치 점검",
      summary: "필수 스크립트와 구매 이벤트 테스트 계획을 생성합니다.",
      steps: ["필수 매체 확인", "이벤트 매핑", "value/currency 검증", "승인 대기열 등록"],
      targetModule: "marketing-scripts",
      riskNotes: ["중복 전환과 purchase 이벤트 누락을 확인해야 합니다."],
      requiresApproval: true,
    };
  }

  if (command.includes("페이먼츠") || command.includes("결제") || command.includes("PG")) {
    return {
      intent: "payment_recommendation",
      title: "페이먼츠 구성 추천",
      summary: "객단가와 결제 방식 기준으로 페이먼츠 구성을 추천합니다.",
      steps: ["거래 구조 확인", "결제수단 후보 정리", "승인 체크리스트 생성", "승인 대기열 등록"],
      targetModule: "payments",
      riskNotes: ["간편결제 심사와 모바일 결제 이탈 리스크를 확인합니다."],
      requiresApproval: true,
    };
  }

  if (command.includes("이전") || command.includes("체크리스트")) {
    return mockCommandResponse;
  }

  return {
    intent: "unknown",
    title: "작업 분류 필요",
    summary: "명령을 어느 모듈에서 실행할지 명확하지 않습니다.",
    steps: ["작업 목적 확인", "대상 모듈 선택", "필요 입력값 정리"],
    targetModule: "unknown",
    riskNotes: ["불명확한 명령은 자동 실행하지 않습니다."],
    requiresApproval: true,
  };
}

export async function POST(request: Request) {
  try {
    const payload = commandParseInputSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json({ message: "명령을 입력해 주세요." }, { status: 400 });
    }

    const result = await generateStructuredOutput({
      taskName: "command_parse",
      prompt: prompts.command,
      input: payload.data,
      schema: commandParseOutputSchema,
      mock: guessCommand(payload.data.command),
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { message: "명령 해석 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
