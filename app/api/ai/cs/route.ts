import { NextResponse } from "next/server";
import { mockCsResponse } from "@/lib/ai/mock-responses";
import { prompts } from "@/lib/ai/prompts";
import { csInputSchema, csOutputSchema } from "@/lib/ai/schemas";
import { generateStructuredOutput } from "@/lib/ai/service";

export async function POST(request: Request) {
  try {
    const payload = csInputSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json({ message: "입력값을 확인해 주세요." }, { status: 400 });
    }

    const result = await generateStructuredOutput({
      taskName: "cs_policy_generation",
      prompt: prompts.cs,
      input: payload.data,
      schema: csOutputSchema,
      mock: mockCsResponse,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { message: "AI CS 템플릿 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
