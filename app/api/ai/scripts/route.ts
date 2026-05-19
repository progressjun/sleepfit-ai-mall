import { NextResponse } from "next/server";
import { mockScriptsResponse } from "@/lib/ai/mock-responses";
import { prompts } from "@/lib/ai/prompts";
import { scriptsInputSchema, scriptsOutputSchema } from "@/lib/ai/schemas";
import { generateStructuredOutput } from "@/lib/ai/service";

export async function POST(request: Request) {
  try {
    const payload = scriptsInputSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json({ message: "입력값을 확인해 주세요." }, { status: 400 });
    }

    const result = await generateStructuredOutput({
      taskName: "marketing_script_guide",
      prompt: prompts.scripts,
      input: payload.data,
      schema: scriptsOutputSchema,
      mock: mockScriptsResponse,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { message: "마케팅 스크립트 가이드 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
