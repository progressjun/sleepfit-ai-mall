import { NextResponse } from "next/server";
import { mockDetailPageResponse } from "@/lib/ai/mock-responses";
import { prompts } from "@/lib/ai/prompts";
import {
  detailPageInputSchema,
  detailPageOutputSchema,
} from "@/lib/ai/schemas";
import { generateStructuredOutput } from "@/lib/ai/service";
import { detectRiskFlagsFromObject } from "@/lib/risk/risk-rules";

export async function POST(request: Request) {
  try {
    const payload = detailPageInputSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json({ message: "입력값을 확인해 주세요." }, { status: 400 });
    }

    const result = await generateStructuredOutput({
      taskName: "detail_page_generation",
      prompt: prompts.detailPage,
      input: payload.data,
      schema: detailPageOutputSchema,
      mock: mockDetailPageResponse,
    });

    const detectedFlags = detectRiskFlagsFromObject(result.data);
    return NextResponse.json({
      ...result,
      data: {
        ...result.data,
        riskFlags: [...result.data.riskFlags, ...detectedFlags],
      },
    });
  } catch {
    return NextResponse.json(
      { message: "상세페이지 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
