import type { OnsiteChatAIOutput, OnsiteRecommendationAIOutput } from "@/lib/ai/schemas";
import type { OnsiteProductContext } from "./schemas";

export interface OnsiteReviewSource {
  rating: number;
  content: string;
  createdAt?: string;
}

export interface OnsiteProductSource {
  productNo?: string | number;
  name: string;
  priceText?: string;
  imageUrl?: string;
  url?: string;
  reviewSummary?: string;
  reviews: OnsiteReviewSource[];
}

const fallbackReviews: OnsiteReviewSource[] = [
  { rating: 5, content: "실제로 받아보니 화면보다 색감이 깔끔하고 포장 상태가 좋다는 후기가 많아요." },
  { rating: 5, content: "가격 대비 만족도와 빠른 배송에 대한 긍정적인 반응이 반복해서 보여요." },
  { rating: 4, content: "상세 설명과 실제 사용 경험이 잘 맞아 구매 결정에 도움이 됐다는 의견이 있어요." },
  { rating: 5, content: "구매 전 고민했던 부분이 후기에서 해소됐다는 반응이 많습니다." },
  { rating: 4, content: "디자인과 구성 만족도가 높고 선물용으로도 괜찮다는 평가가 있어요." },
  { rating: 5, content: "상품 설명과 실제 느낌이 비슷하다는 후기가 꾸준히 보입니다." },
];

const fallbackNames = ["리뷰 반응 좋은 비교 상품", "함께 보기 좋은 추천 상품", "구매 전 비교 옵션"];

function escapeSvgText(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    if (char === "&") return "&amp;";
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    if (char === '"') return "&quot;";
    return "&#39;";
  });
}

function createPlaceholderImageUrl(label: string, index: number) {
  const colors = [
    { bg: "#effdf7", accent: "#10b981", text: "#064e3b" },
    { bg: "#f6f7fb", accent: "#6366f1", text: "#312e81" },
    { bg: "#fff7ed", accent: "#f97316", text: "#7c2d12" },
  ];
  const palette = colors[index % colors.length];
  const title = escapeSvgText(label.slice(0, 16));
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
      <rect width="180" height="180" rx="28" fill="${palette.bg}"/>
      <circle cx="132" cy="46" r="18" fill="${palette.accent}" opacity="0.22"/>
      <rect x="42" y="38" width="78" height="104" rx="18" fill="#ffffff" stroke="${palette.accent}" stroke-width="3"/>
      <rect x="58" y="58" width="46" height="14" rx="7" fill="${palette.accent}" opacity="0.22"/>
      <rect x="58" y="84" width="46" height="10" rx="5" fill="${palette.accent}" opacity="0.5"/>
      <rect x="58" y="104" width="34" height="10" rx="5" fill="${palette.accent}" opacity="0.32"/>
      <text x="90" y="152" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="${palette.text}">SlipAI 추천</text>
      <text x="90" y="168" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${palette.text}">${title}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function createFallbackProduct(product?: OnsiteProductContext): OnsiteProductSource {
  return {
    productNo: product?.productNo,
    name: product?.name || "현재 상품",
    priceText: product?.priceText,
    imageUrl: product?.imageUrl,
    url: product?.url,
    reviewSummary: "리뷰 반응과 상품 정보를 기준으로 구매 전 확인하기 좋은 상품입니다.",
    reviews: fallbackReviews,
  };
}

function createRelatedProductNo(productNo: OnsiteProductSource["productNo"], offset: number) {
  if (productNo == null) return `related-${offset}`;

  const numeric = Number(productNo);
  if (Number.isFinite(numeric)) return String(numeric + offset);

  return `${productNo}-r${offset}`;
}

function createRelatedUrl(url: string | undefined, productNo: string) {
  if (!url) return undefined;

  try {
    const nextUrl = new URL(url);
    nextUrl.searchParams.set("product_no", productNo);
    return nextUrl.toString();
  } catch {
    return url;
  }
}

export function createMockRelatedProducts(product?: OnsiteProductSource, limit = 3): OnsiteProductSource[] {
  const target = product || createFallbackProduct();

  return fallbackNames.slice(0, limit).map((name, index) => {
    const productNo = createRelatedProductNo(target.productNo, index + 1);

    return {
      productNo,
      name,
      priceText: target.priceText,
      imageUrl: createPlaceholderImageUrl(name, index),
      url: createRelatedUrl(target.url, productNo),
      reviewSummary: "현재 보고 있는 상품과 함께 비교해보기 좋은 추천 후보입니다.",
      reviews: fallbackReviews,
    };
  });
}

export function createMockRecommendation(
  product?: OnsiteProductSource,
  relatedProducts: OnsiteProductSource[] = [],
): OnsiteRecommendationAIOutput {
  const target = product || createFallbackProduct();
  const highlights = target.reviews.slice(0, 6).map((review) => review.content).filter(Boolean);
  const related = relatedProducts.length > 0 ? relatedProducts : createMockRelatedProducts(target);
  const reasons = [
    "리뷰에서 만족 포인트가 반복되어 현재 상품과 비교하기 좋습니다.",
    "함께 살펴보면 구매 전 고민을 줄이는 데 도움이 됩니다.",
    "후기 반응과 상품 정보를 기준으로 비교 후보에 올리기 좋습니다.",
  ];

  return {
    surface: "banner",
    message: `${target.name} 보고 계시네요. 좋은 후기와 함께 비교하기 좋은 상품을 정리해드릴게요.`,
    reviewHighlights: highlights.length > 0 ? highlights : fallbackReviews.map((review) => review.content),
    products: related.slice(0, 3).map((item, index) => ({
      productNo: item.productNo == null ? null : String(item.productNo),
      name: item.name,
      reason: item.reviewSummary || reasons[index] || reasons[0],
      priceText: item.priceText ?? null,
      imageUrl: item.imageUrl ?? createPlaceholderImageUrl(item.name, index),
      url: item.url ?? null,
    })),
    cta: {
      label: "후기 더보기 및 비교하기",
      action: "open_chat",
    },
    disclosure: "SlipAI는 이 쇼핑몰의 상품과 후기 정보를 바탕으로 추천합니다.",
  };
}

export function createMockChatReply({
  message,
  product,
}: {
  message: string;
  product?: OnsiteProductSource;
}): OnsiteChatAIOutput {
  const target = product || createFallbackProduct();

  return {
    message:
      message.length > 0
        ? `${target.name} 기준으로 소재, 옵션, 최근 후기에서 반복되는 장점을 함께 확인해보고 결정하는 것을 추천드려요.`
        : "상품, 옵션, 후기 중 어떤 부분이 고민되는지 말씀해 주세요.",
    suggestedQuestions: [
      "리뷰에서 좋게 언급된 포인트가 뭐예요?",
      "비슷한 상품과 어떻게 비교하면 좋을까요?",
      "구매 전에 꼭 확인할 후기는 뭐예요?",
    ],
    products: [
      {
        productNo: target.productNo == null ? null : String(target.productNo),
        name: target.name,
        reason: "현재 보고 있는 상품이라 빠르게 비교하기 좋습니다.",
        priceText: target.priceText ?? null,
        imageUrl: target.imageUrl ?? null,
        url: target.url ?? null,
      },
    ],
    cta: {
      label: "상품 보러가기",
      action: "go_to_purchase",
    },
    disclosure: "SlipAI는 이 쇼핑몰의 상품과 후기 범위 안에서만 답변합니다.",
  };
}
