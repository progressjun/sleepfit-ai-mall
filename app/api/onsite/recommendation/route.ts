import { NextResponse } from "next/server";
import { onsiteRecommendationOutputSchema } from "@/lib/ai/schemas";
import { generateStructuredOutput } from "@/lib/ai/service";
import { corsHeaders, optionsResponse } from "@/lib/onsite/cors";
import { createMockRecommendation } from "@/lib/onsite/mock";
import { onsiteRecommendationPrompt } from "@/lib/onsite/prompts";
import { applyOnsiteRateLimit, rateLimitHeaders } from "@/lib/onsite/rate-limit";
import { onsiteRecommendationRequestSchema } from "@/lib/onsite/schemas";
import {
  getFeaturedOnsiteProducts,
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

function isHomeRecommendationTrigger(trigger: string) {
  return trigger === "home_first_visit" || trigger === "home_returning_visit";
}

function homeGreeting(trigger: string) {
  return trigger === "home_first_visit"
    ? "첫 방문이시군요. 많이 살펴보는 상품부터 보여드릴게요."
    : "다시 오셨네요. 어떤 부분이 고민되세요?";
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

  const isHomeTrigger = isHomeRecommendationTrigger(parsed.data.trigger);
  const knowledge = await getOnsiteKnowledge({
    projectKey: parsed.data.projectKey,
    mallId: parsed.data.mallId,
    product: parsed.data.product,
  });
  const relatedProducts = isHomeTrigger
    ? await getFeaturedOnsiteProducts({
        projectKey: parsed.data.projectKey,
        mallId: parsed.data.mallId,
        limit: 3,
      })
    : await getRelatedOnsiteProducts({
        projectKey: parsed.data.projectKey,
        mallId: parsed.data.mallId,
        currentProduct: knowledge,
      });
  const fallbackRecommendation = {
    ...createMockRecommendation(knowledge, relatedProducts),
    ...(isHomeTrigger
      ? {
          message: homeGreeting(parsed.data.trigger),
          cta: {
            label: "상품 추천 받기",
            action: "open_chat" as const,
          },
          disclosure: "SlipAI가 이 쇼핑몰의 상품과 리뷰 정보를 바탕으로 추천합니다.",
        }
      : {}),
  };
  const allowedCatalog = buildAllowedCatalog(isHomeTrigger ? relatedProducts : [knowledge, ...relatedProducts]);

  const result = await generateStructuredOutput({
    taskName: "onsite_recommendation",
    prompt: onsiteRecommendationPrompt,
    input: {
      request: parsed.data,
      product: knowledge,
      relatedProducts,
      trigger: parsed.data.trigger,
      reviewPolicy:
        "Answer in Korean. Only use supplied product, related product candidates, and review evidence. For home_first_visit or home_returning_visit, act as a friendly shopping guide and recommend featured products from the same mall. Do not claim best-selling or sales rank unless explicit order/sales data is supplied. Use phrases like 많이 살펴보는 상품, 리뷰 반응이 좋은 상품, 함께 비교하기 좋은 상품. For dwell_30s, prioritize positive review highlights and then similar products. For cart_click, focus on comparison confidence. For exit_intent, lead with review proof and a low-pressure chat CTA. Do not invent discounts, inventory, medical claims, private customer data, or cross-brand products.",
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
