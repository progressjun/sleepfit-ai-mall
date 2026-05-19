import type { OnsiteProductSource } from "./mock";

type ScopeCategory = "off-topic" | "safety" | "allowed";

export interface OnsiteScopeDecision {
  allowed: boolean;
  category: ScopeCategory;
  reason?: string;
}

const blockedTerms: Array<RegExp> = [
  // Development and technical topics are out of scope.
  /\b(code|coding|javascript|typescript|python|react|next|api|sdk|sql|backend|frontend|github|git|debug|bug|error)\b/i,

  // Financial / macro topics.
  /\b(stock|coin|crypto|investment|invest|politics?|news|election|government|policy|currency|exchange rate|exchange-rate)\b/i,
  /\uc8fc\uc2dd|\ucf54\uc778|\ud22c\uc790|\uc815\uce58|\ub274\uc2a4/i,

  // Competitor / other-brand references (MVP examples).
  /\ub9e5\ub3c4\ub0a0\ub4dc|coupang|gmarket|auction|11st|11\ubc88\uac00|other brand|competitor|other mall|\ub2e4\ub978 \ube0c\ub79c\ub4dc|\uacbd\uc7c1\uc0ac/i,
];

const productIntents: Array<RegExp> = [
  /\b(product|item|price|shipping|delivery|exchange|return|refund|order|purchase|review|option|coupon|cart|size|color|material|fabric|fit|brand|category|checkout)\b/i,
  /\uc0c1\ud488|\uc785\ub825|\uc0ac\uc774\uc988|\uac00\uaca9|\ubc30\uc1a1|\ub9ac\ubdf0|\uc635\uc158|\ud544\ub4dc|\uc804\ud654|\uc7a5\ubc14\uad6c\ub2c8|\uc0c9\uc0c1|\uc18c\uc7ac|\uc815\ubcf4|\ucf54\uc2a4|\uc544\ud3f4|\uad50\ud658|\ubc18\ud488|\ud658\ubd88/i,
];

function normalizeMessage(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function hasMatch(message: string, terms: Array<RegExp>) {
  return terms.some((term) => term.test(message));
}

export function evaluateOnsiteChatScope(message: string, product?: { name?: string | null }) {
  const normalized = normalizeMessage(message);

  if (!normalized) {
    return { allowed: false, category: "off-topic", reason: "empty input" } satisfies OnsiteScopeDecision;
  }

  if (hasMatch(normalized, blockedTerms)) {
    return { allowed: false, category: "off-topic", reason: "disallowed topic" } satisfies OnsiteScopeDecision;
  }

  const hasProduct = Boolean(product?.name && product.name.trim());
  const isProductQuestion = hasMatch(normalized, productIntents);

  if (!isProductQuestion && !hasProduct) {
    return {
      allowed: false,
      category: "off-topic",
      reason: "outside installed mall scope",
    } satisfies OnsiteScopeDecision;
  }

  return { allowed: true, category: "allowed" } satisfies OnsiteScopeDecision;
}

function createRefusalMessage(productName?: string, products: OnsiteProductSource[] = []) {
  const fallbackName = products[0]?.name || "the current item";
  const targetName = productName || fallbackName;

  return {
    message:
      "I can only help with questions about the current store's products, options, reviews, shipping/return basics, and buying decisions. I cannot answer coding, finance, or unrelated topics.",
    suggestedQuestions: [
      `${targetName}: what should I consider before purchasing?`,
      "How do I compare this item with similar options?",
      "Show positive review highlights for this product.",
    ],
    products: [
      {
        productNo: products[0]?.productNo == null ? null : String(products[0].productNo),
        name: products[0]?.name || fallbackName,
        reason: "Reference product for scope-safe answers.",
        priceText: products[0]?.priceText ?? null,
        imageUrl: products[0]?.imageUrl ?? null,
        url: products[0]?.url ?? null,
      },
    ],
    cta: {
      label: "Open shop advice",
      action: "open_chat" as const,
    },
    disclosure: "AI responses are limited to data from this installed store context only.",
  };
}

export function createScopedChatRefusal(product?: OnsiteProductSource) {
  return createRefusalMessage(product?.name, product ? [product] : []);
}
