import { NextResponse } from "next/server";
import {
  migrationInputSchema,
  migrationOutputSchema,
} from "@/lib/ai/schemas";
import { generateStructuredOutput } from "@/lib/ai/service";
import { mockMigrationResponse } from "@/lib/ai/mock-responses";
import { prompts } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  try {
    const payload = migrationInputSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json({ message: "입력값을 확인해 주세요." }, { status: 400 });
    }

    const result = await generateStructuredOutput({
      taskName: "migration_diagnostic",
      prompt: prompts.migration,
      input: payload.data,
      schema: migrationOutputSchema,
      mock: mockMigrationResponse,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { message: "서버 이전 진단 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
