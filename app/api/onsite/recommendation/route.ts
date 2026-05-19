import { NextResponse } from "next/server";
import { onsiteRecommendationOutputSchema } from "@/lib/ai/schemas";
import { generateStructuredOutput } from "@/lib/ai/service";
import { corsHeaders, optionsResponse } from "@/lib/onsite/cors";
import { createMockRecommendation } from "@/lib/onsite/mock";
import { onsiteRecommendationPrompt } from "@/lib/onsite/prompts";
import { onsiteRecommendationRequestSchema } from "@/lib/onsite/schemas";
import { applyOnsiteRateLimit, rateLimitHeaders } from "@/lib/onsite/rate-limit";
import {
  getOnsiteKnowledge,
  getRelatedOnsiteProducts,
  recordRecommendationLog,
  validateOnsiteWidgetAuth,
} from "@/lib/onsite/storage";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

function normalizeText(value: string | undefined | null) {
  return value ? value.trim().toLowerCase() : "";
}

function buildAllowedCatalog(products: Array<{ productNo?: string | number | null; name?: string | null }>) {
  const allowedNo = new Set<string>();
  const allowedName = new Set<string>();

  for (const product of products) {
    if (product.productNo != null && `${product.productNo}`.trim()) {
      allowedNo.add(`${product.productNo}`.trim());
    }
    if (product.name) {
      allowedName.add(normalizeText(product.name));
    }
  }

  return { allowedNo, allowedName };
}

function isAllowedProduct(
  product: { productNo?: string | null; name?: string | null },
  allowed: ReturnType<typeof buildAllowedCatalog>,
) {
  if (product.productNo != null && allowed.allowedNo.has(`${product.productNo}`.trim())) return true;
  if (product.name && allowed.allowedName.has(normalizeText(product.name))) return true;
  return false;
}

function sanitizeRecommendedProducts(
  products: Array<{ productNo?: string | null; name?: string | null }>,
  allowed: ReturnType<typeof buildAllowedCatalog>,
  fallback: typeof products,
) {
  const filtered = products.filter((product) => isAllowedProduct(product, allowed));
  return filtered.length > 0 ? filtered.slice(0, 3) : fallback.slice(0, 3);
}

export async function POST(request: Request) {
  const parsed = onsiteRecommendationRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid recommendation request." },
      { status: 400, headers: corsHeaders(request) },
    );
  }

  const rateLimit = applyOnsiteRateLimit({
    route: "recommendation",
    request,
    projectKey: parsed.data.projectKey,
    mallId: parsed.data.mallId,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { message: "Too many recommendation requests. Please try again shortly." },
      { status: 429, headers: { ...corsHeaders(request), ...rateLimitHeaders(rateLimit) } },
    );
  }

  const auth = await validateOnsiteWidgetAuth({
    projectKey: parsed.data.projectKey,
    mallId: parsed.data.mallId,
    widgetToken: parsed.data.widgetToken,
    requestOrigin: request.headers.get("origin"),
  });

  if (!auth.ok) {
    return NextResponse.json(
      { message: `Unauthorized: ${auth.reason}` },
      { status: 401, headers: { ...corsHeaders(request), ...rateLimitHeaders(rateLimit) } },
    );
  }

  const knowledge = await getOnsiteKnowledge({
    projectKey: parsed.data.projectKey,
    mallId: parsed.data.mallId,
    product: parsed.data.product,
  });
  const relatedProducts = await getRelatedOnsiteProducts({
    projectKey: parsed.data.projectKey,
    mallId: parsed.data.mallId,
    currentProduct: knowledge,
  });
  const fallbackRecommendation = createMockRecommendation(knowledge, relatedProducts);
  const allowedCatalog = buildAllowedCatalog([knowledge, ...relatedProducts]);

  const result = await generateStructuredOutput({
    taskName: "onsite_recommendation",
    prompt: onsiteRecommendationPrompt,
    input: {
      request: parsed.data,
      product: knowledge,
      relatedProducts,
      reviewPolicy:
        "Only use supplied product, related product candidates, and review evidence. Recommend similar products when possible. Do not invent discounts, inventory, medical claims, or personal data.",
    },
    schema: onsiteRecommendationOutputSchema,
    mock: fallbackRecommendation,
    model: process.env.ONSITE_OPENAI_MODEL?.trim() || undefined,
    maxOutputTokens: Number(process.env.ONSITE_OPENAI_MAX_OUTPUT_TOKENS || "240"),
    reasoningEffort: process.env.ONSITE_OPENAI_REASONING_EFFORT,
  });

  const currentProductNo = knowledge.productNo == null ? "" : String(knowledge.productNo);
  const sanitizedProducts = sanitizeRecommendedProducts(
    result.data.products,
    allowedCatalog,
    fallbackRecommendation.products,
  ).filter((product) => !currentProductNo || product.productNo !== currentProductNo);

  const normalizedResult = {
    ...result,
    data: {
      ...result.data,
      reviewHighlights:
        result.data.reviewHighlights.length > 0
          ? result.data.reviewHighlights.slice(0, 6)
          : fallbackRecommendation.reviewHighlights,
      products: sanitizedProducts.length > 0 ? sanitizedProducts : fallbackRecommendation.products,
    },
  };

  await recordRecommendationLog(parsed.data, {
    ...normalizedResult.data,
    usage: normalizedResult.usage,
  });

  return NextResponse.json(
    { data: normalizedResult.data, source: normalizedResult.source },
    { headers: { ...corsHeaders(request), ...rateLimitHeaders(rateLimit) } },
  );
}
