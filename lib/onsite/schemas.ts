import { z } from "zod";

export const onsiteProjectKeySchema = z
  .string()
  .min(6)
  .max(80)
  .regex(/^pk_[A-Za-z0-9_-]+$/);

export const onsiteProductContextSchema = z.object({
  pageType: z.enum(["product_detail", "collection", "cart", "checkout", "home", "other"]).default("other"),
  productNo: z.union([z.string(), z.number()]).optional(),
  productId: z.string().optional(),
  name: z.string().max(240).optional(),
  priceText: z.string().max(80).optional(),
  category: z.string().max(160).optional(),
  imageUrl: z.string().max(1200).optional(),
  url: z.string().url().optional(),
});

export const onsitePageContextSchema = z.object({
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

export const onsiteEventNameSchema = z.enum([
  "page_view",
  "dwell_30s",
  "scroll",
  "cart_click",
  "chat_open",
  "chat_message",
  "banner_cta_click",
]);

export const onsiteEventRequestSchema = z.object({
  projectKey: onsiteProjectKeySchema,
  mallId: z.string().min(2).max(80),
  widgetToken: z.string().max(512).optional(),
  visitorId: z.string().min(8).max(120),
  sessionId: z.string().min(8).max(120),
  eventName: onsiteEventNameSchema,
  page: onsitePageContextSchema,
  product: onsiteProductContextSchema.optional(),
  dwellSeconds: z.coerce.number().min(0).max(86_400).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  occurredAt: z.string().datetime().optional(),
});

export const onsiteDiscoveryRequestSchema = z.object({
  projectKey: onsiteProjectKeySchema,
  mallId: z.string().min(2).max(80),
  widgetToken: z.string().max(512).optional(),
  visitorId: z.string().min(8).max(120),
  sessionId: z.string().min(8).max(120),
  pageUrl: z.string().url(),
  discoveredUrls: z.array(z.string().url()).max(400).default([]),
  page: onsitePageContextSchema,
});

export const onsiteRecommendationRequestSchema = z.object({
  projectKey: onsiteProjectKeySchema,
  mallId: z.string().min(2).max(80),
  widgetToken: z.string().max(512).optional(),
  visitorId: z.string().min(8).max(120),
  sessionId: z.string().min(8).max(120),
  page: onsitePageContextSchema,
  product: onsiteProductContextSchema,
  recentEvents: z.array(onsiteEventNameSchema).default([]),
});

export const onsiteChatRequestSchema = z.object({
  projectKey: onsiteProjectKeySchema,
  mallId: z.string().min(2).max(80),
  widgetToken: z.string().max(512).optional(),
  visitorId: z.string().min(8).max(120),
  sessionId: z.string().min(8).max(120),
  conversationId: z.string().max(120).optional(),
  message: z.string().min(1).max(800),
  page: onsitePageContextSchema,
  product: onsiteProductContextSchema.optional(),
});

export const cafe24OAuthStartSchema = z.object({
  mallId: z.string().min(2).max(80),
  projectKey: onsiteProjectKeySchema,
  shopNo: z.string().optional(),
});

export const cafe24SyncRequestSchema = z.object({
  projectKey: onsiteProjectKeySchema,
  mallId: z.string().min(2).max(80),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  reviewSeeds: z
    .array(
      z.object({
        productNo: z.union([z.string(), z.number()]),
        rating: z.coerce.number().min(0).max(5).default(5),
        content: z.string().min(1).max(1200),
      }),
    )
    .default([]),
});

export type OnsiteProductContext = z.infer<typeof onsiteProductContextSchema>;
export type OnsiteEventRequest = z.infer<typeof onsiteEventRequestSchema>;
export type OnsiteDiscoveryRequest = z.infer<typeof onsiteDiscoveryRequestSchema>;
export type OnsiteRecommendationRequest = z.infer<typeof onsiteRecommendationRequestSchema>;
export type OnsiteChatRequest = z.infer<typeof onsiteChatRequestSchema>;
export type Cafe24SyncRequest = z.infer<typeof cafe24SyncRequestSchema>;
