export type SleepfitProductGroup =
  | "main_conversion"
  | "pillow_recommend"
  | "topper_recommend"
  | "bedding_cross_sell"
  | "set_upsell"
  | "first_purchase"
  | "gift"
  | "review_trust";

export type SleepfitProductTag =
  | "pillow"
  | "cover"
  | "topper"
  | "bedding"
  | "bundle"
  | "side_sleep"
  | "back_sleep"
  | "stomach_sleep"
  | "mixed_sleep"
  | "high_pillow"
  | "low_pillow"
  | "medium_pillow"
  | "height_adjust"
  | "soft"
  | "firm"
  | "cooling"
  | "organic"
  | "wide"
  | "neck_support"
  | "shoulder_comfort"
  | "first_purchase"
  | "gift"
  | "premium"
  | "budget"
  | "value"
  | "mid"
  | "review_trust";

export interface SleepfitCatalogProduct {
  product_id: string;
  product_no: string;
  product_name: string;
  product_url: string;
  image_url: string;
  price: number;
  sale_price: number;
  category: string;
  sub_category: string;
  product_group: SleepfitProductGroup[];
  tags: SleepfitProductTag[];
  sleep_position_tags: SleepfitProductTag[];
  body_type_tags: Array<"small" | "average" | "large" | "wide_shoulder">;
  firmness_tags: Array<"soft" | "medium" | "firm">;
  height_tags: Array<"low_pillow" | "medium_pillow" | "high_pillow" | "height_adjust">;
  heat_sensitivity_tags: Array<"cool" | "normal" | "cooling">;
  budget_tags: Array<"budget" | "mid" | "premium" | "flexible">;
  target_scenario: string[];
  recommend_reason: string;
  option_hint: string;
  upsell_group: string;
  cross_sell_group: string;
  is_primary: boolean;
  is_active: boolean;
  priority_score: number;
  review_count: number;
  review_summary: string;
  proof_copy: string;
}

export interface SleepfitCatalogProvider {
  listProducts(): SleepfitCatalogProduct[];
  getProduct(productNo: string | number | undefined): SleepfitCatalogProduct | undefined;
}

const productUrl = (productNo: string) => `https://sleepnsleepmall.com/product/detail.html?product_no=${productNo}`;

export function formatSleepfitPrice(price: number) {
  return `${new Intl.NumberFormat("ko-KR").format(price)}원`;
}

export const sleepfitCatalog: SleepfitCatalogProduct[] = [
  {
    product_id: "sleepfit-330",
    product_no: "330",
    product_name: "슬립앤슬립 깊은잠베개",
    product_url: productUrl("330"),
    image_url:
      "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202503/c37b0ec9db0b472dd1915a4c7973d0e4.jpg",
    price: 94900,
    sale_price: 94900,
    category: "pillow",
    sub_category: "functional_pillow",
    product_group: ["main_conversion", "pillow_recommend", "review_trust", "first_purchase"],
    tags: [
      "pillow",
      "side_sleep",
      "back_sleep",
      "mixed_sleep",
      "medium_pillow",
      "high_pillow",
      "height_adjust",
      "neck_support",
      "shoulder_comfort",
      "mid",
      "review_trust",
      "first_purchase",
    ],
    sleep_position_tags: ["side_sleep", "back_sleep", "mixed_sleep"],
    body_type_tags: ["average", "large", "wide_shoulder"],
    firmness_tags: ["medium", "firm"],
    height_tags: ["medium_pillow", "high_pillow", "height_adjust"],
    heat_sensitivity_tags: ["normal"],
    budget_tags: ["mid", "flexible"],
    target_scenario: ["product_detail_hesitation", "category_choice_fatigue", "first_pillow"],
    recommend_reason:
      "옆으로 자거나 자세가 자주 바뀌는 고객에게 먼저 비교하기 좋은 대표 베개입니다.",
    option_hint:
      "처음이면 M 사이즈를 기준으로 보고, 낮은 높이를 선호하면 S 사이즈도 함께 비교해보세요.",
    upsell_group: "deep_sleep_system",
    cross_sell_group: "cooling_cover",
    is_primary: true,
    is_active: true,
    priority_score: 100,
    review_count: 15009,
    review_summary:
      "리뷰 수가 많고 S/M 옵션 비교가 쉬워 첫 구매자의 선택 불안을 줄이는 대표 상품입니다.",
    proof_copy: "리뷰 15,009개가 쌓인 대표 베개 라인입니다.",
  },
  {
    product_id: "sleepfit-345",
    product_no: "345",
    product_name: "슬립앤슬립 와이드핏 베개",
    product_url: productUrl("345"),
    image_url:
      "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202410/4c2883d241621aed34f65b29e2962bc9.jpg",
    price: 157500,
    sale_price: 157500,
    category: "pillow",
    sub_category: "wide_pillow",
    product_group: ["pillow_recommend", "gift", "set_upsell"],
    tags: ["pillow", "side_sleep", "mixed_sleep", "high_pillow", "wide", "firm", "premium", "gift"],
    sleep_position_tags: ["side_sleep", "mixed_sleep"],
    body_type_tags: ["large", "wide_shoulder"],
    firmness_tags: ["firm"],
    height_tags: ["high_pillow", "medium_pillow"],
    heat_sensitivity_tags: ["normal"],
    budget_tags: ["premium", "flexible"],
    target_scenario: ["wide_shoulder", "premium_choice", "gift"],
    recommend_reason: "어깨가 넓거나 옆잠 비중이 큰 고객에게 넓은 지지 면적을 제안합니다.",
    option_hint: "넓은 지지감과 높은 안정감을 원하면 와이드 타입을 우선 비교해보세요.",
    upsell_group: "premium_pillow",
    cross_sell_group: "cooling_cover",
    is_primary: false,
    is_active: true,
    priority_score: 86,
    review_count: 0,
    review_summary: "넓은 베개 면적과 단단한 지지감을 비교하려는 고객에게 적합합니다.",
    proof_copy: "넓은 형태를 선호하는 옆잠 고객에게 비교 포인트가 명확합니다.",
  },
  {
    product_id: "sleepfit-380",
    product_no: "380",
    product_name: "슬립앤슬립 깊은잠 어깨베개",
    product_url: productUrl("380"),
    image_url:
      "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202602/196f7ce33ccc3998430b7099f682e067.jpg",
    price: 103000,
    sale_price: 103000,
    category: "pillow",
    sub_category: "shoulder_pillow",
    product_group: ["pillow_recommend", "review_trust"],
    tags: ["pillow", "side_sleep", "back_sleep", "medium_pillow", "high_pillow", "firm", "shoulder_comfort", "mid"],
    sleep_position_tags: ["side_sleep", "back_sleep"],
    body_type_tags: ["average", "large", "wide_shoulder"],
    firmness_tags: ["medium", "firm"],
    height_tags: ["medium_pillow", "high_pillow"],
    heat_sensitivity_tags: ["normal"],
    budget_tags: ["mid", "flexible"],
    target_scenario: ["shoulder_comfort", "product_detail_hesitation"],
    recommend_reason: "어깨 라인까지 받쳐주는 느낌을 중요하게 보는 고객에게 맞는 대안입니다.",
    option_hint: "어깨가 베개 밖으로 밀리는 느낌이 있었다면 이 라인을 함께 비교해보세요.",
    upsell_group: "deep_sleep_system",
    cross_sell_group: "cooling_cover",
    is_primary: false,
    is_active: true,
    priority_score: 82,
    review_count: 0,
    review_summary: "어깨 지지 니즈가 있는 고객에게 깊은잠베개와 함께 비교하기 좋습니다.",
    proof_copy: "어깨 지지감을 기준으로 베개를 고르는 고객에게 비교 가치가 있습니다.",
  },
  {
    product_id: "sleepfit-36",
    product_no: "36",
    product_name: "슬립앤슬립 리얼 오가닉 베개",
    product_url: productUrl("36"),
    image_url:
      "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202402/675a7c807e6e683d7aac7024d1ffdca5.jpg",
    price: 79000,
    sale_price: 79000,
    category: "pillow",
    sub_category: "organic_pillow",
    product_group: ["pillow_recommend", "first_purchase"],
    tags: ["pillow", "side_sleep", "back_sleep", "low_pillow", "medium_pillow", "height_adjust", "organic", "budget"],
    sleep_position_tags: ["side_sleep", "back_sleep"],
    body_type_tags: ["small", "average"],
    firmness_tags: ["soft", "medium"],
    height_tags: ["low_pillow", "medium_pillow", "height_adjust"],
    heat_sensitivity_tags: ["normal"],
    budget_tags: ["budget", "mid"],
    target_scenario: ["first_purchase", "height_uncertain", "organic_preference"],
    recommend_reason: "높이 취향이 아직 애매하거나 소재감을 중요하게 보는 첫 구매자에게 적합합니다.",
    option_hint: "낮은 높이가 편하다면 패드를 빼고 시작하는 방식으로 맞춰보세요.",
    upsell_group: "organic_line",
    cross_sell_group: "organic_cover",
    is_primary: false,
    is_active: true,
    priority_score: 78,
    review_count: 0,
    review_summary: "높이 조절형 구성이라 처음 구매할 때 실패 부담을 줄이기 좋습니다.",
    proof_copy: "높이 조절 패드가 있어 취향을 맞춰가기 쉬운 베개입니다.",
  },
  {
    product_id: "sleepfit-193",
    product_no: "193",
    product_name: "슬립앤슬립 쑥 메모리폼 베개",
    product_url: productUrl("193"),
    image_url:
      "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202311/1bfb488f8d8c5bc49713e57e7d2696a8.jpg",
    price: 109000,
    sale_price: 109000,
    category: "pillow",
    sub_category: "memoryfoam_pillow",
    product_group: ["pillow_recommend", "gift"],
    tags: ["pillow", "back_sleep", "stomach_sleep", "low_pillow", "soft", "organic", "mid", "gift"],
    sleep_position_tags: ["back_sleep", "stomach_sleep"],
    body_type_tags: ["small", "average"],
    firmness_tags: ["soft"],
    height_tags: ["low_pillow", "medium_pillow"],
    heat_sensitivity_tags: ["normal"],
    budget_tags: ["mid", "flexible"],
    target_scenario: ["low_pillow", "soft_preference", "gift"],
    recommend_reason: "낮고 부드러운 베개를 선호하거나 바로 누워 자는 고객에게 맞습니다.",
    option_hint: "목이 꺾이는 높은 베개가 부담스러웠다면 낮은 타입으로 비교해보세요.",
    upsell_group: "organic_line",
    cross_sell_group: "organic_cover",
    is_primary: false,
    is_active: true,
    priority_score: 72,
    review_count: 0,
    review_summary: "낮은 높이와 부드러운 촉감을 찾는 고객의 비교 후보로 적합합니다.",
    proof_copy: "낮은 베개 선호 고객에게 선택 기준이 분명한 상품입니다.",
  },
  {
    product_id: "sleepfit-337",
    product_no: "337",
    product_name: "슬립앤슬립 리얼 오가닉 S자형 바디베개",
    product_url: productUrl("337"),
    image_url:
      "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202402/6b704bf99f1bba77c39e612c53332078.jpg",
    price: 69000,
    sale_price: 69000,
    category: "pillow",
    sub_category: "body_pillow",
    product_group: ["pillow_recommend", "bedding_cross_sell", "first_purchase"],
    tags: ["pillow", "side_sleep", "organic", "soft", "budget", "shoulder_comfort"],
    sleep_position_tags: ["side_sleep"],
    body_type_tags: ["small", "average", "large"],
    firmness_tags: ["soft", "medium"],
    height_tags: ["medium_pillow"],
    heat_sensitivity_tags: ["normal"],
    budget_tags: ["budget", "mid"],
    target_scenario: ["side_sleep_support", "cross_sell"],
    recommend_reason: "옆잠 자세에서 몸을 기대는 안정감을 함께 보고 싶은 고객에게 좋습니다.",
    option_hint: "메인 베개와 같이 쓰는 보조 베개로 비교하면 선택이 쉬워집니다.",
    upsell_group: "organic_line",
    cross_sell_group: "body_support",
    is_primary: false,
    is_active: true,
    priority_score: 66,
    review_count: 0,
    review_summary: "옆잠 보조 상품으로 객단가를 높이기 좋은 크로스셀 후보입니다.",
    proof_copy: "옆으로 자는 고객에게 함께 제안하기 좋은 보조 베개입니다.",
  },
  {
    product_id: "sleepfit-394",
    product_no: "394",
    product_name: "아이스넷 냉감패드",
    product_url: productUrl("394"),
    image_url:
      "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202509/85a09ed2f98e9830333a91aebfc2b8c8.jpg",
    price: 105000,
    sale_price: 105000,
    category: "topper",
    sub_category: "cooling_pad",
    product_group: ["topper_recommend", "bedding_cross_sell", "set_upsell"],
    tags: ["topper", "bedding", "cooling", "mid"],
    sleep_position_tags: ["side_sleep", "back_sleep", "mixed_sleep"],
    body_type_tags: ["small", "average", "large"],
    firmness_tags: ["medium"],
    height_tags: ["medium_pillow"],
    heat_sensitivity_tags: ["cooling"],
    budget_tags: ["mid", "flexible"],
    target_scenario: ["heat_sensitive", "summer_cross_sell", "cart_upsell"],
    recommend_reason: "더위를 많이 타는 고객에게 베개와 함께 수면 환경을 맞추는 상품입니다.",
    option_hint: "더위 민감도가 높다면 베개보다 냉감 패드를 함께 비교해보세요.",
    upsell_group: "cooling_sleep",
    cross_sell_group: "cooling_cover",
    is_primary: false,
    is_active: true,
    priority_score: 74,
    review_count: 0,
    review_summary: "더위 민감 고객에게 침구 환경까지 제안할 수 있는 대표 냉감 상품입니다.",
    proof_copy: "여름 냉감 침구 니즈가 있는 고객에게 함께 제안하기 좋습니다.",
  },
  {
    product_id: "sleepfit-392",
    product_no: "392",
    product_name: "아이스넷 냉감 베개커버",
    product_url: productUrl("392"),
    image_url:
      "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202509/da9ae273f6de84fe28bef2c1b6475551.jpg",
    price: 25000,
    sale_price: 25000,
    category: "bedding",
    sub_category: "cooling_cover",
    product_group: ["bedding_cross_sell", "first_purchase"],
    tags: ["cover", "bedding", "cooling", "budget", "first_purchase"],
    sleep_position_tags: ["side_sleep", "back_sleep", "stomach_sleep", "mixed_sleep"],
    body_type_tags: ["small", "average", "large"],
    firmness_tags: ["soft", "medium"],
    height_tags: ["low_pillow", "medium_pillow", "high_pillow"],
    heat_sensitivity_tags: ["cooling"],
    budget_tags: ["budget", "mid"],
    target_scenario: ["low_risk_cross_sell", "heat_sensitive", "first_purchase"],
    recommend_reason: "더위는 신경 쓰이지만 큰 금액 지출은 망설이는 고객에게 진입 장벽이 낮습니다.",
    option_hint: "기존 베개는 유지하고 냉감 소재부터 바꿔보고 싶을 때 적합합니다.",
    upsell_group: "cooling_sleep",
    cross_sell_group: "cooling_cover",
    is_primary: false,
    is_active: true,
    priority_score: 62,
    review_count: 0,
    review_summary: "베개 구매와 함께 제안하기 쉬운 낮은 가격대의 크로스셀 상품입니다.",
    proof_copy: "베개와 함께 담기 쉬운 냉감 커버 상품입니다.",
  },
  {
    product_id: "sleepfit-342",
    product_no: "342",
    product_name: "슬립앤슬립 깊은잠 매트리스",
    product_url: productUrl("342"),
    image_url:
      "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202602/65db9dfa6a6d56ff775577e40f4695b6.jpg",
    price: 358500,
    sale_price: 358500,
    category: "topper",
    sub_category: "mattress",
    product_group: ["topper_recommend", "set_upsell"],
    tags: ["topper", "bedding", "mixed_sleep", "premium", "firm"],
    sleep_position_tags: ["side_sleep", "back_sleep", "mixed_sleep"],
    body_type_tags: ["average", "large", "wide_shoulder"],
    firmness_tags: ["medium", "firm"],
    height_tags: ["medium_pillow"],
    heat_sensitivity_tags: ["normal"],
    budget_tags: ["premium", "flexible"],
    target_scenario: ["sleep_environment_upgrade", "premium_choice", "cart_upsell"],
    recommend_reason: "베개만으로 부족하고 수면 환경 전체를 바꾸고 싶은 고객에게 제안합니다.",
    option_hint: "베개 구매를 이미 결정했다면 매트리스 라인까지 비교해 객단가를 높일 수 있습니다.",
    upsell_group: "deep_sleep_system",
    cross_sell_group: "bedding_set",
    is_primary: false,
    is_active: true,
    priority_score: 68,
    review_count: 0,
    review_summary: "침구 환경 전체 업그레이드가 필요한 고객에게 업셀 후보로 적합합니다.",
    proof_copy: "수면 환경 전체를 맞추려는 고객에게 함께 비교하기 좋은 상품입니다.",
  },
  {
    product_id: "sleepfit-358",
    product_no: "358",
    product_name: "슬립앤슬립 깊은잠 베개X매트리스 세트",
    product_url: productUrl("358"),
    image_url:
      "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202602/579fee807184877f3e4884021f7925b6.jpg",
    price: 89500,
    sale_price: 89500,
    category: "set",
    sub_category: "pillow_mattress_set",
    product_group: ["main_conversion", "set_upsell", "first_purchase"],
    tags: ["bundle", "pillow", "topper", "mixed_sleep", "budget", "first_purchase"],
    sleep_position_tags: ["side_sleep", "back_sleep", "mixed_sleep"],
    body_type_tags: ["small", "average", "large"],
    firmness_tags: ["medium"],
    height_tags: ["medium_pillow", "height_adjust"],
    heat_sensitivity_tags: ["normal"],
    budget_tags: ["budget", "mid", "flexible"],
    target_scenario: ["first_purchase", "set_value", "category_choice_fatigue"],
    recommend_reason: "처음부터 베개와 매트리스 구성을 같이 보고 싶은 고객에게 비교 부담을 줄입니다.",
    option_hint: "단품보다 세트 구성을 먼저 비교하면 수면 환경을 한 번에 맞추기 쉽습니다.",
    upsell_group: "deep_sleep_system",
    cross_sell_group: "bedding_set",
    is_primary: true,
    is_active: true,
    priority_score: 76,
    review_count: 0,
    review_summary: "단품 선택이 어려운 고객에게 세트 구매 이유를 만들기 좋은 상품입니다.",
    proof_copy: "베개와 매트리스 구성을 함께 보고 싶은 고객에게 적합합니다.",
  },
  {
    product_id: "sleepfit-295",
    product_no: "295",
    product_name: "슬립앤슬립 마스터유닛 베개 하드",
    product_url: productUrl("295"),
    image_url:
      "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202311/678a10d3f6af5ee3260349f322dc9711.jpg",
    price: 192000,
    sale_price: 192000,
    category: "pillow",
    sub_category: "premium_pillow_hard",
    product_group: ["pillow_recommend", "gift", "set_upsell"],
    tags: ["pillow", "side_sleep", "back_sleep", "medium_pillow", "high_pillow", "firm", "premium", "gift"],
    sleep_position_tags: ["side_sleep", "back_sleep"],
    body_type_tags: ["average", "large", "wide_shoulder"],
    firmness_tags: ["firm"],
    height_tags: ["medium_pillow", "high_pillow"],
    heat_sensitivity_tags: ["normal"],
    budget_tags: ["premium", "flexible"],
    target_scenario: ["premium_choice", "firm_preference", "gift"],
    recommend_reason: "단단한 지지감과 프리미엄 라인을 선호하는 고객에게 맞습니다.",
    option_hint: "푹 꺼지는 베개보다 단단한 받침감을 원하면 하드 타입을 비교하세요.",
    upsell_group: "premium_pillow",
    cross_sell_group: "premium_cover",
    is_primary: false,
    is_active: true,
    priority_score: 70,
    review_count: 0,
    review_summary: "프리미엄 베개군에서 지지감 기준으로 비교하기 좋은 상품입니다.",
    proof_copy: "단단한 베개 선호 고객에게 명확한 비교 기준이 있습니다.",
  },
  {
    product_id: "sleepfit-296",
    product_no: "296",
    product_name: "슬립앤슬립 마스터유닛 베개 소프트",
    product_url: productUrl("296"),
    image_url:
      "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202601/7e2618b50113cec0c90ef7d6c5e1be07.jpg",
    price: 216000,
    sale_price: 216000,
    category: "pillow",
    sub_category: "premium_pillow_soft",
    product_group: ["pillow_recommend", "gift", "set_upsell"],
    tags: ["pillow", "back_sleep", "mixed_sleep", "medium_pillow", "soft", "premium", "gift"],
    sleep_position_tags: ["back_sleep", "mixed_sleep"],
    body_type_tags: ["small", "average"],
    firmness_tags: ["soft", "medium"],
    height_tags: ["medium_pillow"],
    heat_sensitivity_tags: ["normal"],
    budget_tags: ["premium", "flexible"],
    target_scenario: ["premium_choice", "soft_preference", "gift"],
    recommend_reason: "프리미엄 예산에서 부드러운 촉감과 안정감을 함께 원하는 고객에게 맞습니다.",
    option_hint: "단단함보다 부드러운 촉감을 중요하게 보면 소프트 타입을 비교하세요.",
    upsell_group: "premium_pillow",
    cross_sell_group: "premium_cover",
    is_primary: false,
    is_active: true,
    priority_score: 69,
    review_count: 0,
    review_summary: "프리미엄 라인에서 촉감 기준으로 하드 타입과 비교할 수 있습니다.",
    proof_copy: "부드러운 프리미엄 베개를 찾는 고객에게 적합합니다.",
  },
];

export const staticSleepfitCatalogProvider: SleepfitCatalogProvider = {
  listProducts() {
    return sleepfitCatalog.filter((product) => product.is_active);
  },
  getProduct(productNo) {
    if (productNo == null) return undefined;
    const normalized = String(productNo).trim();
    return this.listProducts().find((product) => product.product_no === normalized);
  },
};

export function listActiveSleepfitProducts() {
  return staticSleepfitCatalogProvider.listProducts();
}

export function getSleepfitProduct(productNo: string | number | undefined) {
  return staticSleepfitCatalogProvider.getProduct(productNo);
}
