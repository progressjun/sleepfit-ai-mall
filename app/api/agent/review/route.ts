import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { agentReviewRequestSchema, dailyReviewSchema } from "@/lib/agent/schemas";

export const runtime = "nodejs";

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function POST(request: Request) {
  const parsed = agentReviewRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid review request." }, { status: 400 });
  }

  const { apiKey, model, messages, memories } = parsed.data;
  const client = new OpenAI({ apiKey });

  try {
    const response = await client.responses.create({
      model,
      instructions:
        "You are doing a daily review for a local AI agent. Analyze the conversation history and memory. Produce practical improvements the agent should use tomorrow. Do not include secrets.",
      input: JSON.stringify({
        messages: messages.slice(-80),
        memories: memories.slice(0, 80),
        localDate: new Date().toISOString(),
      }),
      text: {
        format: zodTextFormat(dailyReviewSchema, "hermes_daily_review"),
      },
      store: false,
    });

    const review = dailyReviewSchema.parse(JSON.parse(response.output_text));
    return NextResponse.json({
      review: {
        id: createId("review"),
        createdAt: new Date().toISOString(),
        ...review,
      },
      source: "success",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Daily review failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
