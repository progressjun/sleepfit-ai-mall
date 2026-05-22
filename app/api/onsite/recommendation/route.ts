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
  return value ? value.replace(/\s+/g, " ").trim().toLowerCase() : "";
}

function normalizeIdentity(value: string | undefined | null) {
  return normalizeText(value).replace(/[\s()[\]{}<>,./\\|_-]+/g, "");
}

function buildAllowedCatalog(
  products: Array<{
    productNo?: string | number | null;
    name?: string | null;
    reviewSummary?: string | null;
    priceText?: string | null;
    imageUrl?: string | null;
    url?: string | null;
  }>,
) {
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

  return { allowedNo, allowedName, products };
}

function isAllowedProduct(
  product: { productNo?: string | null; name?: string | null },
  allowed: ReturnType<typeof buildAllowedCatalog>,
) {
  if (product.productNo != null && allowed.allowedNo.has(`${product.productNo}`.trim())) return true;
  if (product.name && allowed.allowedName.has(normalizeText(product.name))) return true;
  return false;
}

function sameProductIdentity(
  product: { productNo?: string | null; name?: string | null },
  current: { productNo?: string | number | null; name?: string | null },
) {
  const productNo = product.productNo == null ? "" : String(product.productNo).trim();
  const currentNo = current.productNo == null ? "" : String(current.productNo).trim();
  if (productNo && currentNo && productNo === currentNo) return true;

  const productName = normalizeIdentity(product.name);
  const currentName = normalizeIdentity(current.name);
  return Boolean(productName && currentName && productName === currentName);
}

function productKey(product: {
  productNo?: string | number | null;
  name?: string | null;
  url?: string | null;
}) {
  const productNo = product.productNo == null ? "" : String(product.productNo).trim();
  if (productNo) return `no:${productNo}`;

  const url = product.url ? normalizeText(product.url) : "";
  if (url) return `url:${url}`;

  const name = normalizeIdentity(product.name);
  return name ? `name:${name}` : "";
}

function enrichProduct<
  T extends {
    productNo?: string | null;
    name?: string | null;
    reason?: string | null;
    priceText?: string | null;
    imageUrl?: string | null;
    url?: string | null;
  },
>(product: T, allowed: ReturnType<typeof buildAllowedCatalog>) {
  const match = allowed.products.find((candidate) => {
    const candidateNo = candidate.productNo == null ? "" : String(candidate.productNo).trim();
    const productNo = product.productNo == null ? "" : String(product.productNo).trim();
    if (candidateNo && productNo && candidateNo === productNo) return true;
    return Boolean(candidate.name && product.name && normalizeIdentity(candidate.name) === normalizeIdentity(product.name));
  });

  return {
    ...product,
    name: product.name || match?.name || "추천 상품",
    reason: product.reason || match?.reviewSummary || "리뷰와 상품 정보를 기준으로 함께 비교하기 좋은 상품입니다.",
    priceText: product.priceText ?? match?.priceText ?? null,
    imageUrl: product.imageUrl ?? match?.imageUrl ?? null,
    url: product.url ?? match?.url ?? null,
  };
}

function sanitizeRecommendedProducts(
  products: Array<{
    productNo?: string | null;
    name?: string | null;
    reason?: string | null;
    priceText?: string | null;
    imageUrl?: string | null;
    url?: string | null;
  }>,
  allowed: ReturnType<typeof buildAllowedCatalog>,
  fallback: typeof products,
  currentProduct: { productNo?: string | number | null; name?: string | null },
) {
  const seen = new Set<string>();

  const candidates = [...products, ...fallback]
    .map((product) => enrichProduct(product, allowed))
    .filter((product) => isAllowedProduct(product, allowed))
    .filter((product) => !sameProductIdentity(product, currentProduct))
    .filter((product) => {
      const key = productKey(product);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const imageScore = Number(Boolean(b.imageUrl)) - Number(Boolean(a.imageUrl));
      if (imageScore !== 0) return imageScore;
      const urlScore = Number(Boolean(b.url)) - Number(Boolean(a.url));
      if (urlScore !== 0) return urlScore;
      return normalizeText(a.name).localeCompare(normalizeText(b.name), "ko");
    });

  return candidates.slice(0, 3);
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
        "Answer in Korean. Only use supplied product, related product candidates, and review evidence. For home_first_visit or home_returning_visit, act as a friendly shopping guide and recommend featured products from the same mall. Do not claim best-selling or sales rank unless explicit order/sales data is supplied. Use phrases like 많이 살펴보는 상품, 리뷰 반응이 좋은 상품, 함께 비교하기 좋은 상품. For dwell_30s, prioritize positive review highlights and then similar products. For cart_click, focus on comparison confidence. For exit_intent, lead with review proof and a low-pressure chat CTA. Do not invent discounts, inventory, medical claims, private customer data, or cross-brand products. Do not recommend the current product as an alternative to itself.",
    },
    schema: onsiteRecommendationOutputSchema,
    mock: fallbackRecommendation,
    model: process.env.ONSITE_OPENAI_MODEL?.trim() || undefined,
    maxOutputTokens: Number(process.env.ONSITE_OPENAI_MAX_OUTPUT_TOKENS || "240"),
    reasoningEffort: process.env.ONSITE_OPENAI_REASONING_EFFORT,
  });

  const sanitizedProducts = sanitizeRecommendedProducts(
    result.data.products,
    allowedCatalog,
    fallbackRecommendation.products,
    knowledge,
  );

  const normalizedResult = {
    ...result,
    data: {
      ...result.data,
      reviewHighlights:
        result.data.reviewHighlights.length > 0
          ? result.data.reviewHighlights.slice(0, 6)
          : fallbackRecommendation.reviewHighlights,
      products: sanitizedProducts,
      cta:
        sanitizedProducts.length > 0
          ? result.data.cta
          : {
              label: "후기 더보기 및 상담하기",
              action: "open_chat" as const,
            },
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
