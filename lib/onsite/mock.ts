import type {
  OnsiteChatAIOutput,
  OnsiteRecommendationAIOutput,
} from "@/lib/ai/schemas";
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
  { rating: 5, content: "The material feels premium and looks sharp in real photos." },
  { rating: 5, content: "Great value for price. Quick shipping and clean checkout flow." },
  { rating: 4, content: "Looks as described. Good fit for daily use." },
  { rating: 5, content: "Multiple users said this improves decision confidence from the review section." },
  { rating: 4, content: "Design and usability are both good, and the packaging is clean." },
  { rating: 5, content: "Customer support responded fast and the product matched the listing." },
];

export function createFallbackProduct(product?: OnsiteProductContext): OnsiteProductSource {
  return {
    productNo: product?.productNo,
    name: product?.name || "Current product",
    priceText: product?.priceText,
    imageUrl: product?.imageUrl,
    url: product?.url,
    reviewSummary: "This product has positive reviews and good fit with similar items from your store.",
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
  const baseName = target.name || "Related product";
  const seeds = [
    `${baseName} - Premium Line`,
    `${baseName} - Signature Edition`,
    `${baseName} - Everyday Choice`,
  ];

  return seeds.slice(0, limit).map((seed, index) => {
    const productNo = createRelatedProductNo(target.productNo, index + 1);

    return {
      productNo,
      name: seed,
      priceText: target.priceText,
      imageUrl: target.imageUrl,
      url: createRelatedUrl(target.url, productNo),
      reviewSummary: "Customers often compare this item with similar options in the store.",
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
    "This item is matching well with the style and quality expectations of the current product.",
    "Customers who view this product also compare this option before purchase.",
    "This option may be a strong alternative based on similar reviews.",
  ];

  return {
    surface: "banner",
    message: `${target.name} is a popular choice. Here are similar picks you may like.`,
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
      label: "Buy now",
      action: "go_to_purchase",
    },
    disclosure:
      "SlipAI shows recommendations using product and review data only from this store, for decision support only.",
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
        ? `Great question. For ${target.name}, I recommend checking material, fit, and the most recent positive reviews before deciding.`
        : `Ask me about products, reviews, options, or purchase guidance for this store.`,
    suggestedQuestions: [
      "Which size is best for daily use?",
      "How should I compare option A and option B?",
      "What are the main points to check before purchasing?",
    ],
    products: [
      {
        productNo: target.productNo == null ? null : String(target.productNo),
        name: target.name,
        reason: "This is the selected item from the current store for quick comparison.",
        priceText: target.priceText ?? null,
        imageUrl: target.imageUrl ?? null,
        url: target.url ?? null,
      },
    ],
    cta: {
      label: "Buy this product",
      action: "go_to_purchase",
    },
    disclosure:
      "SlipAI answers only with product/review guidance for this store and does not use external sources.",
  };
}

