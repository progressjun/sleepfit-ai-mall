import { z } from "zod";

export const sleepfitPageTypeSchema = z.enum(["home", "collection", "product_detail", "cart", "checkout", "other"]);

export const sleepfitPageContextSchema = z.object({
  url: z.string().url(),
  referrer: z.string().url().optional().or(z.literal("")),
  title: z.string().max(240).optional(),
  viewport: z
    .object({
      width: z.coerce.number().int().min(0).max(10000).optional(),
      height: z.coerce.number().int().min(0).max(10000).optional(),
    })
    .optional(),
});

export const sleepfitProductContextSchema = z.object({
  pageType: sleepfitPageTypeSchema.default("other"),
  productNo: z.union([z.string(), z.number()]).optional(),
  name: z.string().max(240).optional(),
  priceText: z.string().max(80).optional(),
  imageUrl: z.string().max(1200).optional(),
  url: z.string().url().optional(),
});

export const sleepfitAnswersSchema = z.object({
  posture: z.enum(["side", "back", "stomach", "mixed"]),
  heightPreference: z.enum(["low", "medium", "high", "unsure"]),
  bodyFrame: z.enum(["small", "average", "large"]),
  heatSensitivity: z.enum(["low", "medium", "high"]),
  budget: z.enum(["value", "mid", "premium", "flexible"]),
});

export const sleepfitRecommendRequestSchema = z.object({
  mallId: z.string().min(2).max(80).default("sleepnsleepmall"),
  visitorId: z.string().min(8).max(120),
  sessionId: z.string().min(8).max(120),
  page: sleepfitPageContextSchema,
  product: sleepfitProductContextSchema.optional(),
  currentProductNo: z.union([z.string(), z.number()]).optional(),
  answers: sleepfitAnswersSchema,
});

export const sleepfitRecommendedProductSchema = z.object({
  productNo: z.string(),
  name: z.string(),
  url: z.string().url(),
  imageUrl: z.string().url(),
  priceText: z.string(),
  optionHint: z.string(),
  reason: z.string(),
});

export const sleepfitAlternativeProductSchema = z.object({
  productNo: z.string(),
  name: z.string(),
  url: z.string().url(),
  reason: z.string(),
});

export const sleepfitRecommendationResponseSchema = z.object({
  primaryProduct: sleepfitRecommendedProductSchema,
  alternatives: z.array(sleepfitAlternativeProductSchema).max(2),
  reviewProof: z.array(z.string()).min(1).max(3),
  cta: z.object({
    label: z.string(),
    action: z.enum(["scroll_to_option", "open_product"]),
  }),
});

export const sleepfitEventNameSchema = z.enum([
  "impression",
  "quiz_start",
  "answer_select",
  "recommendation_view",
  "cta_click",
  "add_to_cart_click",
]);

export const sleepfitEventRequestSchema = z.object({
  mallId: z.string().min(2).max(80).default("sleepnsleepmall"),
  visitorId: z.string().min(8).max(120),
  sessionId: z.string().min(8).max(120),
  eventName: sleepfitEventNameSchema,
  page: sleepfitPageContextSchema,
  product: sleepfitProductContextSchema.optional(),
  answers: sleepfitAnswersSchema.partial().optional(),
  recommendation: sleepfitRecommendationResponseSchema.partial().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  occurredAt: z.string().datetime().optional(),
});

export type SleepfitAnswers = z.infer<typeof sleepfitAnswersSchema>;
export type SleepfitProductContext = z.infer<typeof sleepfitProductContextSchema>;
export type SleepfitRecommendRequest = z.infer<typeof sleepfitRecommendRequestSchema>;
export type SleepfitRecommendationResponse = z.infer<typeof sleepfitRecommendationResponseSchema>;
export type SleepfitEventRequest = z.infer<typeof sleepfitEventRequestSchema>;
