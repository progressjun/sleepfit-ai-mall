import { NextResponse } from "next/server";
import { mockWebsiteResponse } from "@/lib/ai/mock-responses";
import { prompts } from "@/lib/ai/prompts";
import { websiteInputSchema, websiteOutputSchema } from "@/lib/ai/schemas";
import { generateStructuredOutput } from "@/lib/ai/service";

export async function POST(request: Request) {
  try {
    const payload = websiteInputSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json({ message: "입력값을 확인해 주세요." }, { status: 400 });
    }

    const result = await generateStructuredOutput({
      taskName: "website_structure",
      prompt: prompts.website,
      input: payload.data,
      schema: websiteOutputSchema,
      mock: mockWebsiteResponse,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { message: "홈페이지 구조 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
