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
  { rating: 5, content: "실제로 받아보니 화면보다 색감이 더 깔끔하고 소재가 탄탄하다는 후기가 많아요." },
  { rating: 5, content: "가격 대비 만족도가 좋고 배송이 빨랐다는 반응이 반복해서 보입니다." },
  { rating: 4, content: "상세 설명과 실제 느낌이 거의 같아서 데일리로 쓰기 좋다는 의견이 있어요." },
  { rating: 5, content: "후기를 보고 구매 결정을 하기 쉬웠다는 반응이 많습니다." },
  { rating: 4, content: "디자인이 무난하고 포장 상태가 깔끔했다는 평가가 있습니다." },
  { rating: 5, content: "상품 설명과 실제 사용 경험이 잘 맞았다는 후기가 있어요." },
];

export function createFallbackProduct(product?: OnsiteProductContext): OnsiteProductSource {
  return {
    productNo: product?.productNo,
    name: product?.name || "현재 상품",
    priceText: product?.priceText,
    imageUrl: product?.imageUrl,
    url: product?.url,
    reviewSummary: "리뷰 반응이 좋고 같은 쇼핑몰의 다른 상품과 함께 비교하기 좋은 상품입니다.",
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
  const baseName = target.name || "추천 상품";
  const seeds = [`${baseName} 프리미엄 라인`, `${baseName} 시그니처 옵션`, `${baseName} 데일리 추천`];

  return seeds.slice(0, limit).map((seed, index) => {
    const productNo = createRelatedProductNo(target.productNo, index + 1);

    return {
      productNo,
      name: seed,
      priceText: target.priceText,
      imageUrl: target.imageUrl,
      url: createRelatedUrl(target.url, productNo),
      reviewSummary: "현재 보고 있는 상품과 함께 비교하기 좋은 같은 쇼핑몰 상품입니다.",
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
    "리뷰에서 언급된 기대감과 잘 맞는 비교 상품입니다.",
    "이 상품을 보는 고객이 함께 살펴보기 좋은 옵션입니다.",
    "비슷한 리뷰 반응을 기준으로 함께 비교하기 좋습니다.",
  ];

  return {
    surface: "banner",
    message: `${target.name}을 살펴보고 계시군요. 후기가 좋은 비교 상품도 함께 보여드릴게요.`,
    reviewHighlights: highlights.length > 0 ? highlights : fallbackReviews.map((review) => review.content),
    products: related.slice(0, 3).map((item, index) => ({
      productNo: item.productNo == null ? null : String(item.productNo),
      name: item.name,
      reason: item.reviewSummary || reasons[index] || reasons[0],
      priceText: item.priceText ?? null,
      imageUrl: item.imageUrl ?? null,
      url: item.url ?? null,
    })),
    cta: {
      label: "상품 보러가기",
      action: "go_to_purchase",
    },
    disclosure: "SlipAI는 이 쇼핑몰의 상품과 후기 정보만 바탕으로 추천합니다.",
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
        ? `${target.name} 기준으로 소재, 옵션, 최근 후기에서 반복되는 장단점을 같이 확인해보고 결정하는 것을 추천드려요.`
        : "상품, 옵션, 후기 중 어떤 부분이 고민되는지 말씀해 주세요.",
    suggestedQuestions: [
      "데일리로 쓰기 좋은 옵션은 뭐예요?",
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
