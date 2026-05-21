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

  return NextResponse.json(
    {
      data: {
        ...result.data,
        products: sanitizeProducts(result.data.products, allowedCatalog),
      },
      source: result.source,
      conversationId,
    },
    { headers: { ...corsHeaders(request), ...rateLimitHeaders(rateLimit) } },
  );
}
