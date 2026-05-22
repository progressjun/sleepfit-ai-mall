import { sleepfitCatalog, type SleepfitCatalogProduct, type SleepfitProductTag } from "@/lib/sleepfit/catalog";
import {
  sleepfitRecommendationResponseSchema,
  type SleepfitAnswers,
  type SleepfitProductContext,
  type SleepfitRecommendationResponse,
} from "@/lib/sleepfit/schemas";

interface ScoreDetail {
  product: SleepfitCatalogProduct;
  score: number;
  matched: string[];
}

function hasTag(product: SleepfitCatalogProduct, tag: SleepfitProductTag) {
  return product.tags.includes(tag);
}

function addScore(detail: ScoreDetail, condition: boolean, points: number, label: string) {
  if (!condition) return;
  detail.score += points;
  detail.matched.push(label);
}

function scoreProduct(product: SleepfitCatalogProduct, answers: SleepfitAnswers, currentProductNo?: string | number): ScoreDetail {
  const detail: ScoreDetail = { product, score: 0, matched: [] };

  addScore(detail, product.productNo === String(currentProductNo || ""), 2, "현재 보고 있는 상품과 연결");

  if (answers.posture === "side") {
    addScore(detail, hasTag(product, "side_sleep"), 7, "옆잠");
    addScore(detail, hasTag(product, "wide"), 2, "넓은 폭");
    addScore(detail, hasTag(product, "high_height"), 2, "높이감");
  }
  if (answers.posture === "back") {
    addScore(detail, hasTag(product, "back_sleep"), 7, "바로 누움");
    addScore(detail, hasTag(product, "medium_height"), 2, "중간 높이");
  }
  if (answers.posture === "stomach") {
    addScore(detail, hasTag(product, "stomach_sleep"), 7, "엎드림");
    addScore(detail, hasTag(product, "low_height"), 3, "낮은 높이");
    addScore(detail, hasTag(product, "soft"), 2, "부드러운 감촉");
  }
  if (answers.posture === "mixed") {
    addScore(detail, hasTag(product, "mixed_sleep"), 7, "뒤척임");
    addScore(detail, hasTag(product, "height_adjust"), 2, "높이 조절");
    addScore(detail, hasTag(product, "wide"), 1, "넓은 폭");
  }

  if (answers.heightPreference === "low") {
    addScore(detail, hasTag(product, "low_height"), 5, "낮은 베개 선호");
    addScore(detail, hasTag(product, "height_adjust"), 2, "높이 조절 가능");
  }
  if (answers.heightPreference === "medium") {
    addScore(detail, hasTag(product, "medium_height"), 5, "중간 높이 선호");
    addScore(detail, hasTag(product, "height_adjust"), 1, "높이 조절 가능");
  }
  if (answers.heightPreference === "high") {
    addScore(detail, hasTag(product, "high_height"), 5, "높은 베개 선호");
    addScore(detail, hasTag(product, "firm"), 1, "탄탄한 받침");
  }
  if (answers.heightPreference === "unsure") {
    addScore(detail, hasTag(product, "height_adjust"), 5, "높이 취향 미확정");
    addScore(detail, hasTag(product, "medium_height"), 2, "무난한 높이");
  }

  if (answers.bodyFrame === "small") {
    addScore(detail, hasTag(product, "low_height"), 2, "작은 체형");
    addScore(detail, hasTag(product, "soft"), 1, "부드러운 감촉");
  }
  if (answers.bodyFrame === "average") {
    addScore(detail, hasTag(product, "medium_height"), 2, "평균 체형");
    addScore(detail, hasTag(product, "height_adjust"), 1, "높이 조절");
  }
  if (answers.bodyFrame === "large") {
    addScore(detail, hasTag(product, "high_height"), 3, "큰 체형");
    addScore(detail, hasTag(product, "wide"), 3, "넓은 폭");
    addScore(detail, hasTag(product, "firm"), 2, "탄탄한 받침");
  }

  if (answers.heatSensitivity === "high") {
    addScore(detail, hasTag(product, "cooling"), 8, "더위 민감");
    addScore(detail, hasTag(product, "bedding"), 2, "여름 침구");
  }
  if (answers.heatSensitivity === "medium") {
    addScore(detail, hasTag(product, "cooling"), 3, "가벼운 냉감 니즈");
  }

  if (answers.budget === "value") {
    addScore(detail, hasTag(product, "value"), 5, "합리적 예산");
    addScore(detail, hasTag(product, "cover"), 1, "낮은 진입 가격");
  }
  if (answers.budget === "mid") {
    addScore(detail, hasTag(product, "mid"), 5, "중간 예산");
  }
  if (answers.budget === "premium") {
    addScore(detail, hasTag(product, "premium"), 6, "프리미엄 예산");
  }
  if (answers.budget === "flexible") {
    addScore(detail, hasTag(product, "mid"), 2, "예산 유연");
    addScore(detail, hasTag(product, "premium"), 2, "예산 유연");
  }

  addScore(detail, hasTag(product, "pillow"), 1, "베개 기본 후보");

  return detail;
}

function normalizeProductNo(value: string | number | undefined) {
  return value == null ? "" : String(value).trim();
}

function chooseOptionHint(product: SleepfitCatalogProduct, answers: SleepfitAnswers) {
  if (answers.heatSensitivity === "high" && product.optionHints.hot) return product.optionHints.hot;
  if (answers.bodyFrame === "large" && product.optionHints.large) return product.optionHints.large;
  if (answers.bodyFrame === "small" && product.optionHints.small) return product.optionHints.small;
  if (answers.bodyFrame === "average" && product.optionHints.average) return product.optionHints.average;
  if (answers.heightPreference === "low" && product.optionHints.low) return product.optionHints.low;
  if (answers.heightPreference === "medium" && product.optionHints.medium) return product.optionHints.medium;
  if (answers.heightPreference === "high" && product.optionHints.high) return product.optionHints.high;
  return product.optionHints.default;
}

function buildReason(detail: ScoreDetail, answers: SleepfitAnswers) {
  const matched = detail.matched.slice(0, 3).join(", ");
  const base = detail.product.reasons[0] || "진단 답변과 상품 정보를 기준으로 추천합니다.";
  const heatNote =
    answers.heatSensitivity === "high" && detail.product.tags.includes("cooling")
      ? " 더위를 많이 탄다고 답해 냉감 소재 니즈를 우선 반영했습니다."
      : "";

  return `${base} 이번 진단에서 ${matched || "수면 습관"} 기준이 잘 맞았습니다.${heatNote}`;
}

function collectReviewProof(details: ScoreDetail[]) {
  const proof = new Set<string>();

  for (const detail of details) {
    for (const item of detail.product.reviewProof) {
      if (proof.size >= 3) break;
      proof.add(item);
    }
    if (proof.size >= 3) break;
  }

  return Array.from(proof).slice(0, 3);
}

function asAlternative(detail: ScoreDetail, answers: SleepfitAnswers) {
  return {
    productNo: detail.product.productNo,
    name: detail.product.name,
    url: detail.product.url,
    reason: buildReason(detail, answers),
  };
}

export function recommendSleepfitProduct({
  answers,
  product,
  currentProductNo,
}: {
  answers: SleepfitAnswers;
  product?: SleepfitProductContext;
  currentProductNo?: string | number;
}): SleepfitRecommendationResponse {
  const activeProductNo = normalizeProductNo(currentProductNo) || normalizeProductNo(product?.productNo);
  const scored = sleepfitCatalog
    .map((catalogProduct) => scoreProduct(catalogProduct, answers, activeProductNo))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return Number(a.product.productNo) - Number(b.product.productNo);
    });

  const primary = scored[0] || scoreProduct(sleepfitCatalog[0], answers, activeProductNo);
  const alternatives = scored
    .filter((detail) => detail.product.productNo !== primary.product.productNo)
    .slice(0, 2)
    .map((detail) => asAlternative(detail, answers));

  const isCurrentProduct = Boolean(activeProductNo && primary.product.productNo === activeProductNo);
  const result = {
    primaryProduct: {
      productNo: primary.product.productNo,
      name: primary.product.name,
      url: primary.product.url,
      imageUrl: primary.product.imageUrl,
      priceText: primary.product.priceText,
      optionHint: chooseOptionHint(primary.product, answers),
      reason: buildReason(primary, answers),
    },
    alternatives,
    reviewProof: collectReviewProof([primary, ...scored.filter((detail) => detail.product.productNo !== primary.product.productNo)]),
    cta: {
      label: isCurrentProduct ? "추천 옵션 확인하기" : "추천 상품 보러가기",
      action: isCurrentProduct ? "scroll_to_option" : "open_product",
    },
  } satisfies SleepfitRecommendationResponse;

  return sleepfitRecommendationResponseSchema.parse(result);
}
