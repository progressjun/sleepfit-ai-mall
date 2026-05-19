import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { agentChatRequestSchema, memoryExtractionSchema } from "@/lib/agent/schemas";
import { agentToolDefinitions, executeAgentTool } from "@/lib/agent/toolbox";
import type { AgentToolEvent } from "@/lib/agent/types";

export const runtime = "nodejs";

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function safeJsonParse(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function buildDeveloperPrompt(memories: string[], accessMode: string) {
  return [
    "You are Hermes, a private local AI agent for the owner and their team only.",
    "Treat this as an internal workstation tool, not a public SaaS product.",
    "Answer in the user's language. Be direct, practical, and concise.",
    "Use long-term memory to personalize responses, but never reveal API keys or secrets.",
    "You can call local computer tools when they materially help the task.",
    "When the owner clearly asks you to act, act. Avoid accidental destructive changes unless they are explicitly requested.",
    `Computer access mode: ${accessMode}.`,
    memories.length > 0 ? `Long-term memory:\n${memories.map((memory) => `- ${memory}`).join("\n")}` : "Long-term memory: none yet.",
  ].join("\n\n");
}

async function extractMemories({
  client,
  model,
  messages,
  answer,
}: {
  client: OpenAI;
  model: string;
  messages: { role: string; content: string }[];
  answer: string;
}) {
  try {
    const response = await client.responses.create({
      model,
      instructions:
        "Extract durable memory from the conversation. Save only stable user goals, preferences, recurring constraints, project facts, and collaboration style. Do not save secrets, API keys, passwords, or one-off transient details.",
      input: JSON.stringify({ recentMessages: messages.slice(-8), assistantAnswer: answer }),
      text: {
        format: zodTextFormat(memoryExtractionSchema, "hermes_memory_extraction"),
      },
      store: false,
    });
    return memoryExtractionSchema.parse(JSON.parse(response.output_text)).memories;
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  const parsed = agentChatRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid agent request." }, { status: 400 });
  }

  const { apiKey, model, accessMode, messages, memories, maxToolSteps, workingDirectory } = parsed.data;
  const client = new OpenAI({ apiKey });
  const toolEvents: AgentToolEvent[] = [];
  const memoryText = memories
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 40)
    .map((memory) => memory.text);

  const chatMessages: ChatCompletionMessageParam[] = [
    { role: "developer", content: buildDeveloperPrompt(memoryText, accessMode) },
    ...messages.slice(-36).map((message) => ({
      role: message.role,
      content: message.content,
    })) as ChatCompletionMessageParam[],
  ];

  try {
    let answer = "";

    for (let step = 0; step <= maxToolSteps; step += 1) {
      const completion = await client.chat.completions.create({
        model,
        messages: chatMessages,
        tools: accessMode === "auto" ? [...agentToolDefinitions] : undefined,
        tool_choice: accessMode === "auto" ? "auto" : "none",
        parallel_tool_calls: false,
      });

      const assistantMessage = completion.choices[0]?.message;
      if (!assistantMessage) break;

      chatMessages.push(assistantMessage as ChatCompletionMessageParam);

      if (!assistantMessage.tool_calls?.length) {
        answer = assistantMessage.content || "";
        break;
      }

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function") continue;
        const args = safeJsonParse(toolCall.function.arguments || "{}");
        const executed = await executeAgentTool(toolCall.function.name, args, workingDirectory);
        const event: AgentToolEvent = {
          id: createId("tool"),
          name: toolCall.function.name,
          args,
          status: executed.ok ? "success" : "error",
          result: executed.output,
          createdAt: new Date().toISOString(),
        };
        toolEvents.push(event);
        chatMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: executed.output,
        });
      }
    }

    if (!answer) {
      answer = "작업 도구를 실행했지만 최종 답변을 만들지 못했습니다. 마지막 도구 로그를 확인해 주세요.";
    }

    const memoryCandidates = await extractMemories({
      client,
      model,
      messages,
      answer,
    });

    return NextResponse.json({
      message: {
        id: createId("msg"),
        role: "assistant",
        content: answer,
        createdAt: new Date().toISOString(),
      },
      memoryCandidates,
      toolEvents,
      source: "success",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent request failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
