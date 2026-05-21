import { zodTextFormat } from "openai/helpers/zod";
import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import type { z } from "zod";
import { maskPIIInObject } from "@/lib/security/pii";
import {
  createOpenAIClient,
  getOpenAIFallbackModel,
  getOpenAIMaxOutputTokens,
  getOpenAIPromptCacheRetention,
  getOpenAIReasoningEffortFromString,
  getOnsiteOpenAIModel,
} from "./openai";
import { systemPrompt } from "./prompts";

export type AiSource = "mock" | "success";

export interface AiServiceResult<T> {
  data: T;
  source: AiSource;
  usage?: {
    inputTokens: number;
    cachedInputTokens: number;
    outputTokens: number;
    reasoningTokens: number;
    totalTokens: number;
  };
}

interface OpenAIUsage {
  input_tokens: number;
  input_tokens_details: { cached_tokens: number };
  output_tokens: number;
  output_tokens_details: { reasoning_tokens: number };
  total_tokens: number;
}

export async function generateStructuredOutput<TSchema extends z.ZodType>({
  taskName,
  prompt,
  input,
  schema,
  mock,
  model: overrideModel,
  maxOutputTokens: overrideMaxOutputTokens,
  reasoningEffort: overrideReasoningEffort,
}: {
  taskName: string;
  prompt: string;
  input: unknown;
  schema: TSchema;
  mock: z.infer<TSchema>;
  model?: string;
  maxOutputTokens?: number;
  reasoningEffort?: string;
}): Promise<AiServiceResult<z.infer<TSchema>>> {
  const client = createOpenAIClient();
  const maskedInput = maskPIIInObject(input);
  const requestedModel = (overrideModel || getOnsiteOpenAIModel()).trim() as ResponseCreateParamsNonStreaming["model"];
  const fallbackModel = getOpenAIFallbackModel()?.trim();
  const candidateModels = Array.from(
    new Set(
      [requestedModel, fallbackModel, getOnsiteOpenAIModel()]
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ) as ResponseCreateParamsNonStreaming["model"][];

  const maxOutputTokens =
    overrideMaxOutputTokens == null || !Number.isFinite(overrideMaxOutputTokens)
      ? getOpenAIMaxOutputTokens()
      : Math.min(Math.floor(overrideMaxOutputTokens), 1000);

  if (!client) {
    return { data: mock, source: "mock" };
  }

  const normalizeUsage = (usage?: OpenAIUsage) => {
    if (!usage) return undefined;
    return {
      inputTokens: usage.input_tokens,
      cachedInputTokens: usage.input_tokens_details.cached_tokens,
      outputTokens: usage.output_tokens,
      reasoningTokens: usage.output_tokens_details.reasoning_tokens,
      totalTokens: usage.total_tokens,
    };
  };

  const taskSystemPrompt = taskName.startsWith("onsite_")
    ? [
        "You are SlipAI, an onsite AI shopping advisor for one installed Korean commerce mall.",
        "Return only valid JSON that matches the provided schema.",
        "Write shopper-facing text in concise natural Korean.",
        "Use only the supplied mall product, review, option, shipping, return, and purchase context.",
        "Do not answer coding, finance, news, politics, general knowledge, competitors, or unrelated brand questions.",
      ].join(" ")
    : systemPrompt;

  const buildRequest = (model: string, withReasoning: boolean) => {
    const supportsTemperature = !/^gpt-5/i.test(String(model));
    const reasoningEffort = getOpenAIReasoningEffortFromString(model, overrideReasoningEffort) || undefined;

    const base = {
      model: model as ResponseCreateParamsNonStreaming["model"],
      instructions: taskSystemPrompt,
      input: `${prompt}\n\nInput: ${JSON.stringify(maskedInput)}`,
      max_output_tokens: maxOutputTokens,
      prompt_cache_key: taskName,
      prompt_cache_retention: getOpenAIPromptCacheRetention(),
      text: {
        format: zodTextFormat(schema, taskName),
      },
      ...(supportsTemperature ? { temperature: 0.2 } : {}),
      store: false,
    } as ResponseCreateParamsNonStreaming;

    if (withReasoning && reasoningEffort) {
      base.reasoning = { effort: reasoningEffort };
    }

    return base;
  };

  const parseStructured = (response: { output_text: string; usage?: unknown; status?: string; incomplete_details?: unknown }) => {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(response.output_text);
    } catch (error) {
      throw new Error(
        [
          error instanceof Error ? error.message : String(error),
          `status=${response.status || "unknown"}`,
          `outputChars=${response.output_text.length}`,
          `usage=${JSON.stringify(response.usage || null)}`,
          `incomplete=${JSON.stringify(response.incomplete_details || null)}`,
        ].join(" "),
      );
    }

    const payload = schema.parse(parsedJson);
    return { data: payload, usage: normalizeUsage(response.usage as OpenAIUsage | undefined) };
  };

  for (const model of candidateModels) {
    const normalizedModel = String(model);
    const supportsReasoning = Boolean(getOpenAIReasoningEffortFromString(normalizedModel, overrideReasoningEffort));
    const attempts = supportsReasoning ? [true, false] : [false];

    for (const withReasoning of attempts) {
      try {
        const response = await client.responses.create(buildRequest(normalizedModel, withReasoning));
        const { data, usage } = parseStructured(response);
        return { data, source: "success", usage };
      } catch (error) {
        const effort = supportsReasoning ? (withReasoning ? "withReasoning" : "withoutReasoning") : "withoutReasoning";
        console.error(
          `AI generation failed for model=${model} (${effort}). Trying next option.`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  console.error("AI generation failed on all configured models. Falling back to mock.");
  return { data: mock, source: "mock" };
}
