import { NextResponse } from "next/server";
import { mockPaymentsResponse } from "@/lib/ai/mock-responses";
import { prompts } from "@/lib/ai/prompts";
import { paymentsInputSchema, paymentsOutputSchema } from "@/lib/ai/schemas";
import { generateStructuredOutput } from "@/lib/ai/service";

export async function POST(request: Request) {
  try {
    const payload = paymentsInputSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json({ message: "입력값을 확인해 주세요." }, { status: 400 });
    }

    const result = await generateStructuredOutput({
      taskName: "payment_recommendation",
      prompt: prompts.payments,
      input: payload.data,
      schema: paymentsOutputSchema,
      mock: mockPaymentsResponse,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { message: "페이먼츠 추천 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
