import OpenAI from "openai";
import type { ReasoningEffort } from "openai/resources/shared";

const reasoningEfforts: ReasoningEffort[] = ["none", "minimal", "low", "medium", "high", "xhigh"];

export function hasOpenAIKey() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export function getOpenAIFallbackModel() {
  return (
    process.env.ONSITE_OPENAI_FALLBACK_MODEL ||
    process.env.OPENAI_FALLBACK_MODEL ||
    "gpt-4.1-mini"
  );
}

export function getOnsiteOpenAIModel() {
  return process.env.ONSITE_OPENAI_MODEL || getOpenAIModel();
}

function supportsNoReasoning(model: string) {
  const match = model.match(/^gpt-5\.(\d+)/);
  return Boolean(match && Number(match[1]) >= 1);
}

function modelSupportsReasoning(model: string) {
  const normalized = model.toLowerCase();
  if (normalized.startsWith("gpt-5")) return true;
  if (normalized.startsWith("o4-") || normalized.startsWith("o3-")) return true;
  return false;
}

export function getOpenAIReasoningEffort(model = getOpenAIModel()): ReasoningEffort | undefined {
  const effort = process.env.OPENAI_REASONING_EFFORT;
  const normalizedEffort = normalizeReasoningEffort(effort);
  return resolveReasoningEffort(normalizedEffort, model);
}

export function getOpenAIReasoningEffortFromString(
  model: string,
  value?: string,
): ReasoningEffort | undefined {
  const normalizedEffort = normalizeReasoningEffort(value);
  return resolveReasoningEffort(normalizedEffort, model);
}

function normalizeReasoningEffort(value?: string) {
  if (!value) return undefined;
  if (!reasoningEfforts.includes(value as ReasoningEffort)) return undefined;
  return value as ReasoningEffort;
}

function resolveReasoningEffort(
  effort: ReasoningEffort | undefined,
  model: string,
): ReasoningEffort | undefined {
  if (!modelSupportsReasoning(model)) return undefined;
  const normalizedEffort = effort;
  const fallbackEffort = supportsNoReasoning(model) ? "none" : "minimal";
  const selectedEffort = normalizedEffort && reasoningEfforts.includes(normalizedEffort) ? normalizedEffort : fallbackEffort;

  if (selectedEffort === "none" && !supportsNoReasoning(model)) {
    return "minimal";
  }

  return selectedEffort;
}

export function getOpenAIMaxOutputTokens() {
  const value = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 360);
  return Number.isFinite(value) && value > 0 ? Math.min(Math.floor(value), 2000) : 360;
}

export function getOpenAIPromptCacheRetention() {
  return process.env.OPENAI_PROMPT_CACHE_RETENTION === "24h" ? "24h" : "in_memory";
}

export function createOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}
