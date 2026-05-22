import { NextResponse } from "next/server";
import { onsiteChatOutputSchema } from "@/lib/ai/schemas";
import { generateStructuredOutput } from "@/lib/ai/service";
import { corsHeaders, optionsResponse } from "@/lib/onsite/cors";
import { createMockChatReply } from "@/lib/onsite/mock";
import { onsiteChatPrompt } from "@/lib/onsite/prompts";
import { applyOnsiteRateLimit, rateLimitHeaders } from "@/lib/onsite/rate-limit";
import { onsiteChatRequestSchema } from "@/lib/onsite/schemas";
import { createScopedChatRefusal, evaluateOnsiteChatScope } from "@/lib/onsite/scope-guard";
import {
  getFeaturedOnsiteProducts,
  getOnsiteKnowledge,
  getRelatedOnsiteProducts,
  recordChatExchange,
  validateOnsiteWidgetAuth,
} from "@/lib/onsite/storage";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

function normalizeText(value: string | undefined | null) {
  return value ? value.trim().toLowerCase() : "";
}

function compactText(value: string | number | undefined | null) {
  return normalizeText(value == null ? "" : String(value)).replace(/[^0-9a-z가-힣ㄱ-ㅎㅏ-ㅣ]+/g, "");
}

const productCategoryTerms = [
  "멀티비타민",
  "비타민",
  "유산균",
  "프로바이오틱스",
  "오메가",
  "마그네슘",
  "칼슘",
  "루테인",
  "콜라겐",
  "홍삼",
  "단백질",
  "프로틴",
  "효소",
  "티셔츠",
  "셔츠",
  "원피스",
  "자켓",
  "재킷",
  "스니커즈",
  "신발",
  "가방",
];

const generatedFallbackNames = new Set(["리뷰 반응 좋은 비교 상품", "함께 보기 좋은 추천 상품", "구매 전 비교 옵션"]);

function isGeneratedFallbackProduct(product: { productNo?: string | number | null; name?: string | null }) {
  const productNo = product.productNo == null ? "" : String(product.productNo);
  return productNo.startsWith("related-") || Boolean(product.name && generatedFallbackNames.has(product.name));
}

function realCatalogProducts<T extends { productNo?: string | number | null; name?: string | null }>(products: T[]) {
  return products.filter((product) => product.name && !isGeneratedFallbackProduct(product));
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

function sanitizeProducts<
  T extends { productNo?: string | null; name?: string | null },
>(products: T[], allowed: ReturnType<typeof buildAllowedCatalog>) {
  return products.filter((product) => isAllowedProduct(product, allowed)).slice(0, 3);
}

function sameProductIdentity(
  product: { productNo?: string | number | null; name?: string | null },
  current: { productNo?: string | number | null; name?: string | null },
) {
  const productNo = product.productNo == null ? "" : String(product.productNo).trim();
  const currentNo = current.productNo == null ? "" : String(current.productNo).trim();
  if (productNo && currentNo && productNo === currentNo) return true;
  return Boolean(product.name && current.name && normalizeText(product.name) === normalizeText(current.name));
}

function toChatProduct(product: {
  productNo?: string | number | null;
  name?: string | null;
  reviewSummary?: string | null;
  priceText?: string | null;
  imageUrl?: string | null;
  url?: string | null;
}) {
  return {
    productNo: product.productNo == null ? null : String(product.productNo),
    name: product.name || "추천 상품",
    reason: product.reviewSummary || "현재 상품과 함께 비교하기 좋은 이 쇼핑몰 상품입니다.",
    priceText: product.priceText ?? null,
    imageUrl: product.imageUrl ?? null,
    url: product.url ?? null,
  };
}

function productEvidence(products: Array<{ name?: string | null; reviewSummary?: string | null; productNo?: string | number | null }>) {
  return products
    .map((product) => compactText([product.name, product.reviewSummary, product.productNo == null ? "" : String(product.productNo)].join(" ")))
    .filter(Boolean)
    .join(" ");
}

function unsupportedCatalogTerms(
  message: string,
  products: Array<{ name?: string | null; reviewSummary?: string | null; productNo?: string | number | null }>,
) {
  const compactMessage = compactText(message);
  if (!compactMessage) return [];

  const evidence = productEvidence(products);
  const missing = new Set<string>();

  for (const term of productCategoryTerms) {
    const compactTerm = compactText(term);
    if (!compactTerm || !compactMessage.includes(compactTerm)) continue;
    if (!evidence.includes(compactTerm)) missing.add(term);
  }

  return [...missing];
}

function createUnsupportedProductReply({
  mallId,
  terms,
  products,
}: {
  mallId: string;
  terms: string[];
  products: Array<{
    productNo?: string | number | null;
    name?: string | null;
    reviewSummary?: string | null;
    priceText?: string | null;
    imageUrl?: string | null;
    url?: string | null;
  }>;
}) {
  const termText = terms.length > 0 ? `‘${terms[0]}’` : "말씀하신 상품";
  const productCards = realCatalogProducts(products).slice(0, 3).map(toChatProduct);

  return {
    message: `현재 수집된 ${mallId} 상품 정보에서 ${termText} 상품을 확인하지 못했어요. 저는 이 쇼핑몰의 실제 상품과 후기 기준으로만 답변할 수 있어서 일반 구매 체크리스트는 안내하지 않을게요. 정확한 상품 페이지나 상품명을 알려주시면 그 상품 기준으로 비교해드릴게요.`,
    suggestedQuestions:
      productCards.length > 0
        ? productCards.map((product) => `${product.name} 후기는 어떤가요?`).slice(0, 3)
        : ["현재 보고 있는 상품 후기는 어떤가요?", "이 쇼핑몰에서 비교 가능한 상품이 있나요?"],
    products: productCards,
    cta: {
      label: "상품 기준으로 다시 상담하기",
      action: "open_chat" as const,
    },
    disclosure: "SlipAI는 설치된 쇼핑몰에서 확인된 상품과 후기 범위 안에서만 답변합니다.",
  };
}

function resolveChatProducts({
  aiProducts,
  relatedProducts,
  knowledge,
  allowedCatalog,
}: {
  aiProducts: Array<{
    productNo?: string | null;
    name?: string | null;
    reason?: string | null;
    priceText?: string | null;
    imageUrl?: string | null;
    url?: string | null;
  }>;
  relatedProducts: Awaited<ReturnType<typeof getRelatedOnsiteProducts>>;
  knowledge: Awaited<ReturnType<typeof getOnsiteKnowledge>>;
  allowedCatalog: ReturnType<typeof buildAllowedCatalog>;
}) {
  const sanitizedAi = sanitizeProducts(aiProducts, allowedCatalog);
  const hasAlternative = sanitizedAi.some((product) => !sameProductIdentity(product, knowledge));
  if (sanitizedAi.length > 0 && hasAlternative) return sanitizedAi;

  const fallback = sanitizeProducts(
    realCatalogProducts(relatedProducts)
      .filter((product) => !sameProductIdentity(product, knowledge))
      .map(toChatProduct),
    allowedCatalog,
  );

  return fallback.length > 0 ? fallback : sanitizedAi;
}

export async function POST(request: Request) {
  const parsed = onsiteChatRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid chat request." },
      { status: 400, headers: corsHeaders(request) },
    );
  }

  const rateLimit = applyOnsiteRateLimit({
    route: "chat",
    request,
    projectKey: parsed.data.projectKey,
    mallId: parsed.data.mallId,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { message: "Too many chat requests. Please try again shortly." },
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
    limit: 6,
  });
  const featuredProducts = await getFeaturedOnsiteProducts({
    projectKey: parsed.data.projectKey,
    mallId: parsed.data.mallId,
    limit: 6,
  });
  const catalogProducts = [knowledge, ...relatedProducts, ...featuredProducts];
  const allowedCatalog = buildAllowedCatalog(catalogProducts);
  const scope = evaluateOnsiteChatScope(parsed.data.message, parsed.data.product);

  if (!scope.allowed) {
    const refusal = createScopedChatRefusal(knowledge, realCatalogProducts(featuredProducts));
    const conversationId = await recordChatExchange(parsed.data, refusal.message, {
      blockedByScope: true,
    });

    return NextResponse.json(
      {
        data: {
          ...refusal,
          products: sanitizeProducts(refusal.products, allowedCatalog),
        },
        source: "mock",
        conversationId,
      },
      { headers: { ...corsHeaders(request), ...rateLimitHeaders(rateLimit) } },
    );
  }

  const unsupportedTerms = unsupportedCatalogTerms(parsed.data.message, catalogProducts);
  if (unsupportedTerms.length > 0) {
    const refusal = createUnsupportedProductReply({
      mallId: parsed.data.mallId,
      terms: unsupportedTerms,
      products: featuredProducts.filter((product) => !sameProductIdentity(product, knowledge)),
    });
    const conversationId = await recordChatExchange(parsed.data, refusal.message, {
      blockedByScope: true,
    });

    return NextResponse.json(
      {
        data: {
          ...refusal,
          products: sanitizeProducts(refusal.products, allowedCatalog),
        },
        source: "guard",
        conversationId,
      },
      { headers: { ...corsHeaders(request), ...rateLimitHeaders(rateLimit) } },
    );
  }

  const result = await generateStructuredOutput({
    taskName: "onsite_chat_reply",
    prompt: onsiteChatPrompt,
    input: {
      request: parsed.data,
      product: knowledge,
      relatedProducts,
      featuredProducts,
      scope: {
        allowedTopics: [
          "installed brand",
          "current mall products",
          "product options",
          "product reviews",
          "purchase decision support",
          "shipping/exchange/return guidance only when supplied by the mall",
        ],
        blockedTopics: ["coding", "general knowledge", "news", "politics", "investment", "other brands"],
      },
      policy:
        "Write shopper-facing copy in Korean. Use only anonymous session signals and supplied product/review context. Answer only about the installed brand, current mall products, reviews, options, and purchase decision support. Never give generic category buying checklists. If the requested product/category is not present in supplied same-mall products, say it is not currently confirmed in this mall data and ask for the exact product page/name. Refuse coding, general knowledge, and other-brand questions. Never claim access to orders, membership, inventory, coupons, sales rank, or private data.",
    },
    schema: onsiteChatOutputSchema,
    mock: createMockChatReply({ message: parsed.data.message, product: knowledge }),
    model: process.env.ONSITE_OPENAI_MODEL?.trim() || undefined,
    maxOutputTokens: Number(process.env.ONSITE_OPENAI_MAX_OUTPUT_TOKENS || "220"),
    reasoningEffort: process.env.ONSITE_OPENAI_REASONING_EFFORT,
  });

  const products = resolveChatProducts({
    aiProducts: result.data.products,
    relatedProducts,
    knowledge,
    allowedCatalog,
  });
  const answerUnsupportedTerms = unsupportedCatalogTerms(result.data.message, catalogProducts);

  if (answerUnsupportedTerms.length > 0) {
    const refusal = createUnsupportedProductReply({
      mallId: parsed.data.mallId,
      terms: answerUnsupportedTerms,
      products: featuredProducts.filter((product) => !sameProductIdentity(product, knowledge)),
    });
    const conversationId = await recordChatExchange(parsed.data, refusal.message, {
      blockedByScope: true,
    });

    return NextResponse.json(
      {
        data: {
          ...refusal,
          products: sanitizeProducts(refusal.products, allowedCatalog),
        },
        source: "guard",
        conversationId,
      },
      { headers: { ...corsHeaders(request), ...rateLimitHeaders(rateLimit) } },
    );
  }

  const conversationId = await recordChatExchange(parsed.data, result.data.message);

  return NextResponse.json(
    {
      data: {
        ...result.data,
        products,
      },
      source: result.source,
      conversationId,
    },
    { headers: { ...corsHeaders(request), ...rateLimitHeaders(rateLimit) } },
  );
}
