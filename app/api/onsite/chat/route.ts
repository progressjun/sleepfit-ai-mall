import { NextResponse } from "next/server";
import { onsiteChatOutputSchema } from "@/lib/ai/schemas";
import { generateStructuredOutput } from "@/lib/ai/service";
import { corsHeaders, optionsResponse } from "@/lib/onsite/cors";
import { createMockChatReply } from "@/lib/onsite/mock";
import { onsiteChatPrompt } from "@/lib/onsite/prompts";
import { onsiteChatRequestSchema } from "@/lib/onsite/schemas";
import { createScopedChatRefusal, evaluateOnsiteChatScope } from "@/lib/onsite/scope-guard";
import { getOnsiteKnowledge, getRelatedOnsiteProducts, recordChatExchange, validateOnsiteWidgetAuth } from "@/lib/onsite/storage";
import { applyOnsiteRateLimit, rateLimitHeaders } from "@/lib/onsite/rate-limit";

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
    reason: product.reviewSummary || "현재 상품과 함께 비교하기 좋은 같은 쇼핑몰 상품입니다.",
    priceText: product.priceText ?? null,
    imageUrl: product.imageUrl ?? null,
    url: product.url ?? null,
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
    relatedProducts.filter((product) => !sameProductIdentity(product, knowledge)).map(toChatProduct),
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
  const allowedCatalog = buildAllowedCatalog([knowledge, ...relatedProducts]);
  const scope = evaluateOnsiteChatScope(parsed.data.message, parsed.data.product);

  if (!scope.allowed) {
    const refusal = createScopedChatRefusal(knowledge);
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

  const result = await generateStructuredOutput({
    taskName: "onsite_chat_reply",
    prompt: onsiteChatPrompt,
    input: {
      request: parsed.data,
      product: knowledge,
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
        "Write shopper-facing copy in Korean. Use only anonymous session signals and supplied product/review context. Answer only about the installed brand, current mall products, reviews, options, and purchase decision support. Refuse coding, general knowledge, and other-brand questions. Never claim access to orders, membership, inventory, coupons, sales rank, or private data.",
    },
    schema: onsiteChatOutputSchema,
    mock: createMockChatReply({ message: parsed.data.message, product: knowledge }),
    model: process.env.ONSITE_OPENAI_MODEL?.trim() || undefined,
    maxOutputTokens: Number(process.env.ONSITE_OPENAI_MAX_OUTPUT_TOKENS || "220"),
    reasoningEffort: process.env.ONSITE_OPENAI_REASONING_EFFORT,
  });

  const conversationId = await recordChatExchange(parsed.data, result.data.message);
  const products = resolveChatProducts({
    aiProducts: result.data.products,
    relatedProducts,
    knowledge,
    allowedCatalog,
  });

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
