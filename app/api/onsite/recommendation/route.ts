import { NextResponse } from "next/server";
import type { OnsiteRecommendationAIOutput } from "@/lib/ai/schemas";
import type { OnsiteProductSource } from "@/lib/onsite/mock";
import { corsHeaders, optionsResponse } from "@/lib/onsite/cors";
import { applyOnsiteRateLimit, rateLimitHeaders } from "@/lib/onsite/rate-limit";
import { onsiteRecommendationRequestSchema } from "@/lib/onsite/schemas";
import {
  getMostReviewedOnsiteProducts,
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
  excludeCurrentProduct = false,
) {
  const seen = new Set<string>();

  const candidates = [...products, ...fallback]
    .map((product) => enrichProduct(product, allowed))
    .filter((product) => isAllowedProduct(product, allowed))
    .filter((product) => !excludeCurrentProduct || !sameProductIdentity(product, currentProduct))
    .filter((product) => {
      const key = productKey(product);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return candidates.slice(0, 3);
}

function reviewCount(product: OnsiteProductSource) {
  return product.reviews.filter((review) => review.content.trim()).length;
}

function reviewHighlights(product: OnsiteProductSource) {
  const highlights = product.reviews
    .filter((review) => review.rating >= 4 && review.content.trim())
    .map((review) => review.content.trim())
    .slice(0, 6);

  return highlights.length > 0
    ? highlights
    : ["후기 데이터가 쌓이는 중이라 상품 정보와 이미지 기준으로 먼저 추천드려요."];
}

function recommendationReason(product: OnsiteProductSource, index: number) {
  const count = reviewCount(product);
  const summary = product.reviewSummary ? ` ${product.reviewSummary}` : "";
  if (count > 0) {
    return `${count}개의 리뷰가 모인 상품이라 실제 구매자가 반복해서 남긴 만족 포인트를 확인하기 좋아요.${summary}`;
  }

  return index === 0
    ? "수집된 상품 정보와 이미지가 가장 안정적이라 먼저 보여드리는 추천 상품입니다."
    : "함께 비교하면 구매 전 선택지를 좁히는 데 도움이 되는 상품입니다.";
}

function createMostReviewedRecommendation(products: OnsiteProductSource[], mallId: string): OnsiteRecommendationAIOutput {
  const topProduct = products[0];
  const topReviewCount = topProduct ? reviewCount(topProduct) : 0;
  const message =
    topProduct && topReviewCount > 0
      ? `${topProduct.name}은(는) ${mallId}에서 후기가 가장 많이 모인 상품이에요. 리뷰에서 반복되는 만족 포인트가 있어 먼저 추천드려요.`
      : topProduct
        ? `${topProduct.name}을(를) 먼저 추천드려요. 아직 리뷰 수가 충분하지 않아 상품 정보와 이미지 기준으로 안내합니다.`
        : "리뷰 반응이 좋은 상품을 찾고 있어요. 상품 데이터가 수집되면 가장 후기가 많은 상품부터 추천드릴게요.";

  return {
    surface: "banner",
    message,
    reviewHighlights: topProduct ? reviewHighlights(topProduct) : [],
    products: products.slice(0, 3).map((product, index) => ({
      productNo: product.productNo == null ? null : String(product.productNo),
      name: product.name,
      reason: recommendationReason(product, index),
      priceText: product.priceText ?? null,
      imageUrl: product.imageUrl ?? null,
      url: product.url ?? null,
    })),
    cta: {
      label: "추천 상품 보러가기",
      action: "go_to_purchase",
    },
    disclosure: "SlipAI는 이 쇼핑몰에서 수집된 상품별 리뷰 수와 리뷰 내용을 기준으로 추천합니다.",
  };
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

  const mostReviewedProducts = await getMostReviewedOnsiteProducts({
    projectKey: parsed.data.projectKey,
    mallId: parsed.data.mallId,
    limit: 3,
  });
  const allowedCatalog = buildAllowedCatalog(mostReviewedProducts);
  const recommendation = createMostReviewedRecommendation(mostReviewedProducts, parsed.data.mallId);

  const sanitizedProducts = sanitizeRecommendedProducts(
    recommendation.products,
    allowedCatalog,
    [],
    parsed.data.product,
    false,
  );

  const normalizedData = {
    ...recommendation,
    products: sanitizedProducts,
  };

  await recordRecommendationLog(parsed.data, {
    ...normalizedData,
    source: "most_reviewed_catalog",
  });

  return NextResponse.json(
    { data: normalizedData, source: "catalog" },
    { headers: { ...corsHeaders(request), ...rateLimitHeaders(rateLimit) } },
  );
}
