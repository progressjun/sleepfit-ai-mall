import { z } from "zod";

const optionalUrlString = z.union([z.string().url(), z.literal("")]).optional();
const metadataSchema = z.record(z.string(), z.unknown()).default({});

export const sleepfitAbGroupSchema = z.enum(["A", "B"]);

export const sleepfitPageTypeSchema = z.enum([
  "home",
  "collection",
  "product_detail",
  "cart",
  "checkout",
  "purchase_complete",
  "other",
]);

export const sleepfitDeviceTypeSchema = z.enum(["mobile", "tablet", "desktop", "unknown"]);

export const sleepfitPageContextSchema = z.object({
  url: z.string().url(),
  referrer: optionalUrlString,
  title: z.string().max(240).optional(),
  pageType: sleepfitPageTypeSchema.optional(),
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
  url: optionalUrlString,
});

export const sleepfitAnswersSchema = z.object({
  posture: z.enum(["side", "back", "stomach", "mixed"]),
  heightPreference: z.enum(["low", "medium", "high", "unsure"]),
  bodyFrame: z.enum(["small", "average", "large"]),
  heatSensitivity: z.enum(["low", "medium", "high"]),
  budget: z.enum(["value", "mid", "premium", "flexible"]),
  giftIntent: z.enum(["yes", "no", "unsure"]).default("unsure"),
  firstPurchase: z.enum(["yes", "no", "unsure"]).default("unsure"),
});

export const sleepfitRecommendRequestSchema = z.object({
  mallId: z.string().min(2).max(80).default("sleepnsleepmall"),
  visitorId: z.string().min(8).max(120),
  sessionId: z.string().min(8).max(120),
  anonymousId: z.string().min(8).max(120).optional(),
  abGroup: sleepfitAbGroupSchema.optional(),
  page: sleepfitPageContextSchema,
  pageType: sleepfitPageTypeSchema.optional(),
  product: sleepfitProductContextSchema.optional(),
  currentProductNo: z.union([z.string(), z.number()]).optional(),
  cart: z
    .object({
      productNos: z.array(z.union([z.string(), z.number()])).max(50).default([]),
      subtotal: z.coerce.number().min(0).optional(),
    })
    .optional(),
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
  proofCopy: z.string(),
  ctaLabel: z.string(),
});

export const sleepfitAlternativeProductSchema = z.object({
  productNo: z.string(),
  name: z.string(),
  url: z.string().url(),
  imageUrl: z.string().url(),
  reason: z.string(),
  differencePoint: z.string(),
});

export const sleepfitCrossSellProductSchema = z.object({
  productNo: z.string(),
  name: z.string(),
  url: z.string().url(),
  imageUrl: z.string().url(),
  reason: z.string(),
});

export const sleepfitRecommendationResponseSchema = z.object({
  primaryProduct: sleepfitRecommendedProductSchema,
  alternatives: z.array(sleepfitAlternativeProductSchema).max(2),
  crossSellProducts: z.array(sleepfitCrossSellProductSchema).max(2),
  scenarioMessage: z.string(),
  reviewProof: z.array(z.string()).min(1).max(3),
  cta: z.object({
    label: z.string(),
    action: z.enum(["scroll_to_option", "open_product"]),
  }),
  abGroup: sleepfitAbGroupSchema,
});

export const sleepfitEventTypeSchema = z.enum([
  "widget_view",
  "widget_open",
  "widget_close",
  "quiz_start",
  "answer_select",
  "quiz_complete",
  "recommendation_shown",
  "product_impression",
  "product_click",
  "cta_click",
  "cross_sell_click",
  "chat_open",
  "ab_assigned",
  "error",
  "impression",
  "recommendation_view",
  "add_to_cart_click",
]);

export const sleepfitEventRequestSchema = z
  .object({
    eventId: z.string().min(6).max(160).optional(),
    event_id: z.string().min(6).max(160).optional(),
    eventType: sleepfitEventTypeSchema.optional(),
    event_type: sleepfitEventTypeSchema.optional(),
    eventName: sleepfitEventTypeSchema.optional(),
    timestamp: z.string().datetime().optional(),
    occurredAt: z.string().datetime().optional(),
    mallId: z.string().min(2).max(80).default("sleepnsleepmall"),
    mall_id: z.string().min(2).max(80).optional(),
    visitorId: z.string().min(8).max(120),
    anonymousId: z.string().min(8).max(120).optional(),
    anonymous_id: z.string().min(8).max(120).optional(),
    sessionId: z.string().min(8).max(120),
    session_id: z.string().min(8).max(120).optional(),
    pageUrl: z.string().url().optional(),
    page_url: z.string().url().optional(),
    pageType: sleepfitPageTypeSchema.optional(),
    page_type: sleepfitPageTypeSchema.optional(),
    referrer: optionalUrlString,
    deviceType: sleepfitDeviceTypeSchema.optional(),
    device_type: sleepfitDeviceTypeSchema.optional(),
    userAgent: z.string().max(600).optional(),
    user_agent: z.string().max(600).optional(),
    currentProductNo: z.union([z.string(), z.number()]).optional(),
    current_product_no: z.union([z.string(), z.number()]).optional(),
    recommendedProductNo: z.union([z.string(), z.number()]).optional(),
    recommended_product_no: z.union([z.string(), z.number()]).optional(),
    scenario: z.string().max(120).optional(),
    abGroup: sleepfitAbGroupSchema.optional(),
    ab_group: sleepfitAbGroupSchema.optional(),
    quizAnswers: sleepfitAnswersSchema.partial().optional(),
    quiz_answers: sleepfitAnswersSchema.partial().optional(),
    page: sleepfitPageContextSchema.optional(),
    product: sleepfitProductContextSchema.optional(),
    answers: sleepfitAnswersSchema.partial().optional(),
    recommendation: sleepfitRecommendationResponseSchema.partial().optional(),
    metadata: metadataSchema,
  })
  .superRefine((value, ctx) => {
    if (!value.eventType && !value.event_type && !value.eventName) {
      ctx.addIssue({
        code: "custom",
        message: "eventType is required.",
        path: ["eventType"],
      });
    }
  });

export type SleepfitAbGroup = z.infer<typeof sleepfitAbGroupSchema>;
export type SleepfitDeviceType = z.infer<typeof sleepfitDeviceTypeSchema>;
export type SleepfitPageType = z.infer<typeof sleepfitPageTypeSchema>;
export type SleepfitAnswers = z.infer<typeof sleepfitAnswersSchema>;
export type SleepfitProductContext = z.infer<typeof sleepfitProductContextSchema>;
export type SleepfitRecommendRequest = z.infer<typeof sleepfitRecommendRequestSchema>;
export type SleepfitRecommendationResponse = z.infer<typeof sleepfitRecommendationResponseSchema>;
export type SleepfitEventRequest = z.infer<typeof sleepfitEventRequestSchema>;
export type SleepfitEventType = z.infer<typeof sleepfitEventTypeSchema>;
