import {
  formatSleepfitPrice,
  getSleepfitProduct,
  listActiveSleepfitProducts,
  type SleepfitCatalogProduct,
  type SleepfitProductTag,
} from "@/lib/sleepfit/catalog";
import {
  sleepfitRecommendationResponseSchema,
  type SleepfitAbGroup,
  type SleepfitAnswers,
  type SleepfitPageType,
  type SleepfitProductContext,
  type SleepfitRecommendationResponse,
} from "@/lib/sleepfit/schemas";

interface ScoreDetail {
  product: SleepfitCatalogProduct;
  score: number;
  matched: string[];
}

function normalizeProductNo(value: string | number | undefined) {
  return value == null ? "" : String(value).trim();
}

function hasTag(product: SleepfitCatalogProduct, tag: SleepfitProductTag) {
  return product.tags.includes(tag);
}

function addScore(detail: ScoreDetail, condition: boolean, points: number, label: string) {
  if (!condition) return;
  detail.score += points;
  detail.matched.push(label);
}

function pageTypeFromProduct(product?: SleepfitProductContext, fallback?: SleepfitPageType) {
  return product?.pageType || fallback || "other";
}

function scoreProduct({
  product,
  answers,
  activeProductNo,
  pageType,
  cartProductNos,
}: {
  product: SleepfitCatalogProduct;
  answers: SleepfitAnswers;
  activeProductNo?: string;
  pageType: SleepfitPageType;
  cartProductNos: string[];
}): ScoreDetail {
  const detail: ScoreDetail = {
    product,
    score: product.priority_score / 10,
    matched: [],
  };

  const isCurrentProduct = Boolean(activeProductNo && product.product_no === activeProductNo);
  const alreadyInCart = cartProductNos.includes(product.product_no);

  addScore(detail, isCurrentProduct && pageType === "product_detail", 16, "현재 보고 있는 상품 유지");
  addScore(detail, alreadyInCart, -18, "이미 장바구니에 있는 상품 제외");
  addScore(detail, product.is_primary && pageType !== "cart", 4, "대표 전환 상품");
  addScore(detail, product.product_group.includes("bedding_cross_sell") && pageType === "cart", 7, "장바구니 함께 구매");
  addScore(detail, product.product_group.includes("set_upsell") && pageType === "cart", 4, "객단가 상승 후보");

  if (answers.posture === "side") {
    addScore(detail, product.sleep_position_tags.includes("side_sleep"), 9, "옆잠");
    addScore(detail, hasTag(product, "wide"), 3, "넓은 지지 면적");
    addScore(detail, hasTag(product, "shoulder_comfort"), 3, "어깨 안정감");
  }

  if (answers.posture === "back") {
    addScore(detail, product.sleep_position_tags.includes("back_sleep"), 9, "바로 누워 자기");
    addScore(detail, product.height_tags.includes("medium_pillow"), 3, "중간 높이");
  }

  if (answers.posture === "stomach") {
    addScore(detail, product.sleep_position_tags.includes("stomach_sleep"), 9, "엎드려 자기");
    addScore(detail, product.height_tags.includes("low_pillow"), 5, "낮은 높이");
    addScore(detail, product.firmness_tags.includes("soft"), 3, "부드러운 촉감");
  }

  if (answers.posture === "mixed") {
    addScore(detail, product.sleep_position_tags.includes("mixed_sleep"), 9, "자세가 자주 바뀜");
    addScore(detail, product.height_tags.includes("height_adjust"), 4, "높이 조절");
    addScore(detail, hasTag(product, "wide"), 2, "넓은 지지 면적");
  }

  if (answers.heightPreference === "low") {
    addScore(detail, product.height_tags.includes("low_pillow"), 7, "낮은 베개 선호");
    addScore(detail, product.height_tags.includes("height_adjust"), 3, "높이 조절 가능");
  }

  if (answers.heightPreference === "medium") {
    addScore(detail, product.height_tags.includes("medium_pillow"), 7, "중간 높이 선호");
    addScore(detail, product.height_tags.includes("height_adjust"), 2, "높이 조절 가능");
  }

  if (answers.heightPreference === "high") {
    addScore(detail, product.height_tags.includes("high_pillow"), 7, "높은 베개 선호");
    addScore(detail, product.firmness_tags.includes("firm"), 2, "단단한 받침감");
  }

  if (answers.heightPreference === "unsure") {
    addScore(detail, product.height_tags.includes("height_adjust"), 7, "높이 취향 미정");
    addScore(detail, product.product_group.includes("first_purchase"), 3, "첫 선택 부담 완화");
  }

  if (answers.bodyFrame === "small") {
    addScore(detail, product.body_type_tags.includes("small"), 4, "작은 체형");
    addScore(detail, product.height_tags.includes("low_pillow"), 2, "낮은 높이 적합");
  }

  if (answers.bodyFrame === "average") {
    addScore(detail, product.body_type_tags.includes("average"), 4, "평균 체형");
    addScore(detail, product.height_tags.includes("medium_pillow"), 2, "중간 높이 적합");
  }

  if (answers.bodyFrame === "large") {
    addScore(detail, product.body_type_tags.includes("large"), 4, "큰 체형");
    addScore(detail, product.body_type_tags.includes("wide_shoulder"), 4, "어깨가 넓은 편");
    addScore(detail, product.height_tags.includes("high_pillow"), 2, "높은 지지감");
    addScore(detail, product.firmness_tags.includes("firm"), 2, "단단한 받침감");
  }

  if (answers.heatSensitivity === "high") {
    addScore(detail, product.heat_sensitivity_tags.includes("cooling"), 10, "더위 민감");
    addScore(detail, hasTag(product, "cooling"), 6, "냉감 소재");
  }

  if (answers.heatSensitivity === "medium") {
    addScore(detail, product.heat_sensitivity_tags.includes("cooling"), 3, "가벼운 냉감 니즈");
  }

  if (answers.budget === "value") {
    addScore(detail, product.budget_tags.includes("budget"), 8, "가격 부담 낮춤");
    addScore(detail, product.budget_tags.includes("mid"), 2, "중간 가격대까지 비교");
  }

  if (answers.budget === "mid") {
    addScore(detail, product.budget_tags.includes("mid"), 8, "중간 예산");
    addScore(detail, product.budget_tags.includes("budget"), 2, "가격 부담 낮춤");
  }

  if (answers.budget === "premium") {
    addScore(detail, product.budget_tags.includes("premium"), 9, "프리미엄 예산");
    addScore(detail, product.product_group.includes("gift"), 3, "선물용 후보");
  }

  if (answers.budget === "flexible") {
    addScore(detail, product.budget_tags.includes("flexible"), 4, "예산 유연");
    addScore(detail, product.product_group.includes("set_upsell"), 3, "세트 비교");
  }

  if (answers.giftIntent === "yes") {
    addScore(detail, product.product_group.includes("gift"), 8, "선물용");
    addScore(detail, product.budget_tags.includes("premium"), 2, "선물 예산대");
  }

  if (answers.firstPurchase === "yes") {
    addScore(detail, product.product_group.includes("first_purchase"), 7, "첫 구매");
    addScore(detail, product.is_primary, 2, "대표 상품");
  }

  addScore(detail, hasTag(product, "pillow"), 2, "베개 기본 후보");

  return detail;
}

function chooseOptionHint(product: SleepfitCatalogProduct, answers: SleepfitAnswers) {
  if (answers.heatSensitivity === "high" && product.cross_sell_group === "cooling_cover") {
    return `${product.option_hint} 더위가 고민이면 냉감 커버도 함께 확인해보세요.`;
  }

  if (answers.bodyFrame === "large" && product.height_tags.includes("high_pillow")) {
    return `${product.option_hint} 어깨가 넓은 편이면 높은 타입이나 넓은 지지 면적을 우선 비교하세요.`;
  }

  if (answers.heightPreference === "low" && product.height_tags.includes("low_pillow")) {
    return `${product.option_hint} 낮은 높이를 먼저 선택하고 필요하면 보조 구성으로 조절하세요.`;
  }

  return product.option_hint;
}

function buildReason(detail: ScoreDetail, answers: SleepfitAnswers) {
  const matched = detail.matched
    .filter((item) => !item.includes("제외"))
    .slice(0, 3)
    .join(", ");
  const heatNote =
    answers.heatSensitivity === "high" && hasTag(detail.product, "cooling")
      ? " 더위를 많이 탄다고 답해 냉감 소재 니즈도 함께 반영했습니다."
      : "";

  return `${detail.product.recommend_reason} 진단 답변 중 ${matched || "수면 습관"} 기준과 연결됩니다.${heatNote}`;
}

function differencePoint(product: SleepfitCatalogProduct) {
  if (hasTag(product, "wide")) return "더 넓은 지지 면적";
  if (hasTag(product, "cooling")) return "더위 민감 고객용";
  if (product.budget_tags.includes("budget")) return "가격 부담이 낮은 선택지";
  if (product.budget_tags.includes("premium")) return "프리미엄 비교 후보";
  if (product.height_tags.includes("height_adjust")) return "높이 조절 가능";
  if (product.product_group.includes("set_upsell")) return "세트 구성 비교";
  return "다른 사용감 비교 후보";
}

function collectReviewProof(details: ScoreDetail[]) {
  const proof = new Set<string>();

  for (const detail of details) {
    if (detail.product.proof_copy) proof.add(detail.product.proof_copy);
    if (detail.product.review_summary) proof.add(detail.product.review_summary);
    if (proof.size >= 3) break;
  }

  return Array.from(proof).slice(0, 3);
}

function asAlternative(detail: ScoreDetail, answers: SleepfitAnswers) {
  return {
    productNo: detail.product.product_no,
    name: detail.product.product_name,
    url: detail.product.product_url,
    imageUrl: detail.product.image_url,
    reason: buildReason(detail, answers),
    differencePoint: differencePoint(detail.product),
  };
}

function asCrossSell(product: SleepfitCatalogProduct, primary: SleepfitCatalogProduct, answers: SleepfitAnswers) {
  const heatReason =
    answers.heatSensitivity === "high" && hasTag(product, "cooling")
      ? "더위 민감 답변이 있어 베개와 함께 쓰기 좋은 냉감 상품입니다."
      : "추천 베개와 함께 비교하면 수면 환경을 한 번에 맞추기 쉽습니다.";

  return {
    productNo: product.product_no,
    name: product.product_name,
    url: product.product_url,
    imageUrl: product.image_url,
    reason: product.cross_sell_group === primary.cross_sell_group ? product.proof_copy : heatReason,
  };
}

function buildScenarioMessage(pageType: SleepfitPageType, answers: SleepfitAnswers) {
  if (pageType === "product_detail") {
    return "지금 보고 있는 상품에서 이탈하지 않고, 답변 기준으로 옵션과 대안을 좁혀봤습니다.";
  }

  if (pageType === "cart") {
    return "장바구니 상품과 함께 쓰기 좋은 구성을 우선으로 골랐습니다.";
  }

  if (answers.heatSensitivity === "high") {
    return "더위 민감도가 높아 베개 선택과 함께 냉감 침구 후보도 함께 제안합니다.";
  }

  if (answers.firstPurchase === "yes") {
    return "첫 구매라면 리뷰 근거와 높이 선택 부담이 낮은 상품을 먼저 보는 것이 좋습니다.";
  }

  return "수면 자세, 높이 취향, 체형, 예산을 기준으로 탐색 시간을 줄여봤습니다.";
}

function ctaFor({
  isCurrentProduct,
  pageType,
  abGroup,
}: {
  isCurrentProduct: boolean;
  pageType: SleepfitPageType;
  abGroup: SleepfitAbGroup;
}) {
  if (isCurrentProduct) {
    return {
      label: abGroup === "B" ? "이 상품이 맞는지 확인하기" : "내 옵션 확인하기",
      action: "scroll_to_option" as const,
    };
  }

  if (pageType === "cart") {
    return {
      label: "함께 보기",
      action: "open_product" as const,
    };
  }

  return {
    label: "추천 상품 보러가기",
    action: "open_product" as const,
  };
}

export function recommendSleepfitProduct({
  answers,
  product,
  currentProductNo,
  pageType,
  cartProductNos = [],
  abGroup = "A",
}: {
  answers: SleepfitAnswers;
  product?: SleepfitProductContext;
  currentProductNo?: string | number;
  pageType?: SleepfitPageType;
  cartProductNos?: Array<string | number>;
  abGroup?: SleepfitAbGroup;
}): SleepfitRecommendationResponse {
  const activeProductNo = normalizeProductNo(currentProductNo) || normalizeProductNo(product?.productNo);
  const detectedPageType = pageTypeFromProduct(product, pageType);
  const normalizedCartProductNos = cartProductNos.map((item) => String(item).trim()).filter(Boolean);
  const products = listActiveSleepfitProducts();
  const fallbackProduct = products[0] || getSleepfitProduct("330");

  const scored = products
    .map((catalogProduct) =>
      scoreProduct({
        product: catalogProduct,
        answers,
        activeProductNo,
        pageType: detectedPageType,
        cartProductNos: normalizedCartProductNos,
      }),
    )
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.product.priority_score !== a.product.priority_score) return b.product.priority_score - a.product.priority_score;
      return Number(a.product.product_no) - Number(b.product.product_no);
    });

  const primary = scored[0] || (fallbackProduct ? scoreProduct({
    product: fallbackProduct,
    answers,
    activeProductNo,
    pageType: detectedPageType,
    cartProductNos: normalizedCartProductNos,
  }) : undefined);

  if (!primary) {
    throw new Error("SleepFit catalog is empty.");
  }

  const alternatives = scored
    .filter((detail) => detail.product.product_no !== primary.product.product_no)
    .filter((detail) => !normalizedCartProductNos.includes(detail.product.product_no))
    .slice(0, 2)
    .map((detail) => asAlternative(detail, answers));

  const selectedNos = new Set([primary.product.product_no, ...alternatives.map((item) => item.productNo)]);
  const crossSellProducts = products
    .filter((item) => !selectedNos.has(item.product_no))
    .filter((item) => !normalizedCartProductNos.includes(item.product_no))
    .filter((item) => item.product_group.includes("bedding_cross_sell") || item.cross_sell_group === primary.product.cross_sell_group)
    .sort((a, b) => {
      const coolingBiasA = answers.heatSensitivity === "high" && hasTag(a, "cooling") ? 20 : 0;
      const coolingBiasB = answers.heatSensitivity === "high" && hasTag(b, "cooling") ? 20 : 0;
      return b.priority_score + coolingBiasB - (a.priority_score + coolingBiasA);
    })
    .slice(0, detectedPageType === "cart" ? 2 : 1)
    .map((item) => asCrossSell(item, primary.product, answers));

  const isCurrentProduct = Boolean(activeProductNo && primary.product.product_no === activeProductNo);
  const cta = ctaFor({ isCurrentProduct, pageType: detectedPageType, abGroup });
  const result = {
    primaryProduct: {
      productNo: primary.product.product_no,
      name: primary.product.product_name,
      url: primary.product.product_url,
      imageUrl: primary.product.image_url,
      priceText: formatSleepfitPrice(primary.product.sale_price || primary.product.price),
      optionHint: chooseOptionHint(primary.product, answers),
      reason: buildReason(primary, answers),
      proofCopy: primary.product.proof_copy,
      ctaLabel: cta.label,
    },
    alternatives,
    crossSellProducts,
    scenarioMessage: buildScenarioMessage(detectedPageType, answers),
    reviewProof: collectReviewProof([primary, ...scored.filter((detail) => detail.product.product_no !== primary.product.product_no)]),
    cta,
    abGroup,
  } satisfies SleepfitRecommendationResponse;

  return sleepfitRecommendationResponseSchema.parse(result);
}
