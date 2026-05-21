import type { OnsiteProductSource } from "./mock";

type ScopeCategory = "off-topic" | "safety" | "allowed";

export interface OnsiteScopeDecision {
  allowed: boolean;
  category: ScopeCategory;
  reason?: string;
}

const blockedTerms: Array<RegExp> = [
  /\b(code|coding|javascript|typescript|python|react|next|api|sdk|sql|backend|frontend|github|git|debug|bug|error)\b/i,
  /\b(stock|coin|crypto|investment|invest|politics?|news|election|government|policy|currency|exchange rate|exchange-rate)\b/i,
  /주식|코인|투자|정치|뉴스|환율|부동산|개발|코딩|파이썬|자바스크립트/i,
  /맥도날드|coupang|gmarket|auction|11st|11번가|other brand|competitor|other mall|다른 브랜드|경쟁사/i,
];

const productIntents: Array<RegExp> = [
  /\b(product|item|price|shipping|delivery|exchange|return|refund|order|purchase|review|option|coupon|cart|size|color|material|fabric|fit|brand|category|checkout)\b/i,
  /상품|사이즈|가격|배송|리뷰|후기|옵션|장바구니|색상|소재|교환|반품|환불|구매|결제|브랜드|코디|착용|핏|재질/i,
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
  const fallbackName = products[0]?.name || "현재 상품";
  const targetName = productName || fallbackName;

  return {
    message:
      "저는 이 쇼핑몰의 상품, 옵션, 후기, 배송/교환/반품 안내, 구매 결정에 대해서만 도와드릴 수 있어요. 코딩, 금융, 일반 지식, 다른 브랜드 질문에는 답변하지 않습니다.",
    suggestedQuestions: [
      `${targetName} 구매 전에 무엇을 확인하면 좋을까요?`,
      "비슷한 상품과 어떻게 비교하면 좋을까요?",
      "좋은 후기 중심으로 보여주세요.",
    ],
    products: [
      {
        productNo: products[0]?.productNo == null ? null : String(products[0].productNo),
        name: products[0]?.name || fallbackName,
        reason: "이 쇼핑몰 범위 안에서 안내할 수 있는 기준 상품입니다.",
        priceText: products[0]?.priceText ?? null,
        imageUrl: products[0]?.imageUrl ?? null,
        url: products[0]?.url ?? null,
      },
    ],
    cta: {
      label: "상품 상담하기",
      action: "open_chat" as const,
    },
    disclosure: "SlipAI는 설치된 쇼핑몰의 상품과 후기 범위 안에서만 답변합니다.",
  };
}

export function createScopedChatRefusal(product?: OnsiteProductSource) {
  return createRefusalMessage(product?.name, product ? [product] : []);
}
