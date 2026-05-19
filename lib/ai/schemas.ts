import { z } from "zod";

const riskFlagSchema = z.object({
  level: z.enum(["low", "medium", "high"]),
  title: z.string(),
  description: z.string(),
});

export const migrationInputSchema = z.object({
  currentSiteUrl: z.string().url(),
  targetSiteUrl: z.string().url(),
  currentPlatform: z.enum([
    "Cafe24",
    "Legacy Mall",
    "Hosted Mall",
    "Custom Mall",
    "WordPress",
    "Shopify",
    "Other",
  ]),
  monthlyOrders: z.coerce.number().min(0),
  productCount: z.coerce.number().min(0),
  needsMemberMigration: z.boolean(),
  needsOrderMigration: z.boolean(),
  needsReviewMigration: z.boolean(),
  needsUrlPreservation: z.boolean(),
  needsAdScriptReinstall: z.boolean(),
  needsPaymentRebuild: z.boolean(),
  scope: z.array(z.string()),
});

export const migrationOutputSchema = z.object({
  complexityScore: z.number().min(0).max(100),
  summary: z.string(),
  riskFlags: z.array(riskFlagSchema),
  checklist: z.array(z.string()),
  estimatedSteps: z.array(z.string()),
  cafe24DataObjects: z.array(z.string()),
  cafe24AdminChecks: z.array(z.string()),
  cafe24IntegrationTasks: z.array(z.string()),
  redirectPlan: z.array(z.string()),
  scriptReinstallPlan: z.array(z.string()),
});

export const websiteInputSchema = z.object({
  brandName: z.string().min(1),
  industry: z.string().min(1),
  productGroups: z.string().min(1),
  coreCustomers: z.string().min(1),
  brandTone: z.string().min(1),
  mainCtaGoal: z.enum(["구매 유도", "상담 문의", "회원가입", "이벤트 참여"]),
  requiredPages: z.array(z.string()),
});

export const websiteOutputSchema = z.object({
  mainSections: z.array(z.string()),
  brandCopy: z.string(),
  categoryStructure: z.array(z.string()),
  campaignPages: z.array(z.string()),
  ctaCopy: z.array(z.string()),
  trustSections: z.array(z.string()),
  faqSections: z.array(z.string()),
  mobileChecklist: z.array(z.string()),
  pageBlueprints: z.array(z.string()),
  seoMetaPlan: z.array(z.string()),
  measurementPlan: z.array(z.string()),
  cafe24ThemeTasks: z.array(z.string()),
  conversionHypotheses: z.array(z.string()),
});

export const detailPageInputSchema = z.object({
  productId: z.string(),
  productName: z.string().min(1),
  price: z.coerce.number().min(0),
  category: z.string().min(1),
  features: z.string().min(1),
  targetCustomer: z.string().min(1),
  purchaseBarriers: z.string().min(1),
  reviewSummary: z.string().min(1),
  differentiators: z.string().min(1),
  cautionExpressions: z.string(),
});

export const detailPageOutputSchema = z.object({
  uspSummary: z.array(z.string()),
  targetCustomer: z.array(z.string()),
  conversionBarriers: z.array(z.string()),
  headline: z.string(),
  subHeadline: z.string(),
  sectionStructure: z.array(z.string()),
  faq: z.array(z.string()),
  cta: z.array(z.string()),
  adCopyVariants: z.array(z.string()),
  offerStack: z.array(z.string()),
  evidenceBlocks: z.array(z.string()),
  sectionWireframe: z.array(z.string()),
  complianceRewrites: z.array(z.string()),
  cafe24ApplyChecklist: z.array(z.string()),
  riskFlags: z.array(riskFlagSchema),
});

export const csInputSchema = z.object({
  shippingPolicy: z.string().min(1),
  exchangePolicy: z.string().min(1),
  returnPolicy: z.string().min(1),
  refundPolicy: z.string().min(1),
  productInquiryRule: z.string().min(1),
  prohibitedExpressions: z.string(),
  escalationCriteria: z.string().min(1),
  responseTone: z.enum(["친절한", "간결한", "프리미엄", "사무적인", "공감형"]),
});

export const csOutputSchema = z.object({
  faq: z.array(z.string()),
  replyTemplates: z.array(z.string()),
  escalationRules: z.array(z.string()),
  prohibitedClaims: z.array(z.string()),
  intentRouting: z.array(z.string()),
  macroTemplates: z.array(z.string()),
  qualityChecklist: z.array(z.string()),
  cafe24IntegrationNotes: z.array(z.string()),
  riskFlags: z.array(riskFlagSchema),
});

export const scriptsInputSchema = z.object({
  selectedScripts: z.array(z.string()).default([]),
  requiredEvents: z.array(z.string()).default([]),
  commerceGoal: z.string().default("광고 성과 측정"),
});

export const scriptsOutputSchema = z.object({
  requiredScripts: z.array(z.string()),
  requiredEvents: z.array(z.string()),
  dataLayerRequirements: z.array(z.string()),
  testPlan: z.array(z.string()),
  riskFlags: z.array(riskFlagSchema),
});

const onsiteRecommendedProductSchema = z.object({
  productNo: z.string().nullable(),
  name: z.string(),
  reason: z.string(),
  priceText: z.string().nullable(),
  imageUrl: z.string().nullable(),
  url: z.string().nullable(),
});

const onsiteCtaSchema = z.object({
  label: z.string(),
  action: z.enum(["go_to_purchase", "add_to_cart", "open_chat", "stay_on_page"]),
});

export const onsiteRecommendationOutputSchema = z.object({
  surface: z.enum(["banner"]),
  message: z.string(),
  reviewHighlights: z.array(z.string()).max(6),
  products: z.array(onsiteRecommendedProductSchema).min(1).max(3),
  cta: onsiteCtaSchema,
  disclosure: z.string(),
});

export const onsiteChatOutputSchema = z.object({
  message: z.string(),
  suggestedQuestions: z.array(z.string()).max(4),
  products: z.array(onsiteRecommendedProductSchema).max(3),
  cta: onsiteCtaSchema.nullable(),
  disclosure: z.string(),
});

export const paymentsInputSchema = z.object({
  averageOrderValue: z.coerce.number().min(0),
  expectedMonthlyVolume: z.coerce.number().min(0),
  expectedMonthlyOrders: z.coerce.number().min(0),
  needsSubscription: z.boolean(),
  needsEasyPay: z.boolean(),
  needsGlobalPayment: z.boolean(),
  needsNaverPay: z.boolean(),
  needsKakaoPay: z.boolean(),
  needsTossPay: z.boolean(),
  cardPayment: z.boolean(),
  virtualAccount: z.boolean(),
  bankTransfer: z.boolean(),
  productType: z.enum(["배송상품", "디지털상품", "혼합"]),
});

export const paymentsOutputSchema = z.object({
  recommendedPaymentMethods: z.array(z.string()),
  pgChecklist: z.array(z.string()),
  approvalRequirements: z.array(z.string()),
  conversionRisks: z.array(z.string()),
  testPlan: z.array(z.string()),
});

export const commandParseInputSchema = z.object({
  command: z.string().min(1),
});

export const commandParseOutputSchema = z.object({
  intent: z.enum([
    "migration_checklist",
    "website_structure",
    "detail_page_copy",
    "cs_templates",
    "marketing_scripts",
    "payment_recommendation",
    "risk_review",
    "unknown",
  ]),
  title: z.string(),
  summary: z.string(),
  steps: z.array(z.string()),
  targetModule: z.string(),
  riskNotes: z.array(z.string()),
  requiresApproval: z.boolean(),
});

const commandIntentSchema = z.enum([
  "migration_checklist",
  "website_structure",
  "detail_page_copy",
  "cs_templates",
  "marketing_scripts",
  "payment_recommendation",
  "risk_review",
  "unknown",
]);

const approvalTypeSchema = z.enum([
  "migration",
  "website",
  "detail_page",
  "ai_cs",
  "marketing_script",
  "payments",
  "ad_copy",
]);

export const workflowPlanInputSchema = z.object({
  command: z.string().min(1),
});

export const workflowPlanOutputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  assumptions: z.array(z.string()),
  riskNotes: z.array(z.string()),
  successCriteria: z.array(z.string()),
  tasks: z.array(
    z.object({
      id: z.string(),
      intent: commandIntentSchema,
      title: z.string(),
      targetModule: z.string(),
      summary: z.string(),
      steps: z.array(z.string()),
      riskLevel: z.enum(["low", "medium", "high"]),
      approvalType: approvalTypeSchema,
    }),
  ),
});

export type MigrationAIOutput = z.infer<typeof migrationOutputSchema>;
export type WebsiteAIOutput = z.infer<typeof websiteOutputSchema>;
export type DetailPageAIOutput = z.infer<typeof detailPageOutputSchema>;
export type CsAIOutput = z.infer<typeof csOutputSchema>;
export type ScriptsAIOutput = z.infer<typeof scriptsOutputSchema>;
export type OnsiteRecommendationAIOutput = z.infer<typeof onsiteRecommendationOutputSchema>;
export type OnsiteChatAIOutput = z.infer<typeof onsiteChatOutputSchema>;
export type PaymentsAIOutput = z.infer<typeof paymentsOutputSchema>;
export type CommandAIOutput = z.infer<typeof commandParseOutputSchema>;
export type WorkflowPlanAIOutput = z.infer<typeof workflowPlanOutputSchema>;
