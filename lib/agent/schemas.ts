import { z } from "zod";

export const agentMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(60_000),
  createdAt: z.string().optional(),
});

export const agentMemorySchema = z.object({
  id: z.string(),
  text: z.string().max(2_000),
  weight: z.number().min(1).max(5).default(3),
  createdAt: z.string().optional(),
  lastUsedAt: z.string().optional(),
});

export const agentChatRequestSchema = z.object({
  apiKey: z.string().min(1),
  model: z.string().min(1).default("gpt-5.4-mini"),
  accessMode: z.enum(["chat", "auto"]).default("auto"),
  workingDirectory: z.string().optional().default(""),
  maxToolSteps: z.number().int().min(0).max(8).default(5),
  messages: z.array(agentMessageSchema).min(1).max(80),
  memories: z.array(agentMemorySchema).max(120).default([]),
});

export const memoryExtractionSchema = z.object({
  memories: z
    .array(
      z.object({
        text: z.string().min(1).max(500),
        importance: z.number().int().min(1).max(5),
      }),
    )
    .max(6),
});

export const agentReviewRequestSchema = z.object({
  apiKey: z.string().min(1),
  model: z.string().min(1).default("gpt-5.4-mini"),
  messages: z.array(agentMessageSchema).min(1).max(120),
  memories: z.array(agentMemorySchema).max(120).default([]),
});

export const dailyReviewSchema = z.object({
  summary: z.string().min(1).max(1_500),
  wins: z.array(z.string().min(1).max(300)).max(6),
  blindSpots: z.array(z.string().min(1).max(300)).max(6),
  improvedOperatingNotes: z.array(z.string().min(1).max(300)).max(8),
  nextSuggestions: z.array(z.string().min(1).max(300)).max(8),
  memoryUpdates: z.array(z.string().min(1).max(500)).max(8),
});
