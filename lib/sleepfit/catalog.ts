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
  | "low_height"
  | "medium_height"
  | "high_height"
  | "height_adjust"
  | "soft"
  | "firm"
  | "wide"
  | "organic"
  | "cooling"
  | "value"
  | "mid"
  | "premium";

export interface SleepfitCatalogProduct {
  productNo: string;
  name: string;
  url: string;
  imageUrl: string;
  priceText: string;
  tags: SleepfitProductTag[];
  optionHints: {
    default: string;
    small?: string;
    average?: string;
    large?: string;
    low?: string;
    medium?: string;
    high?: string;
    hot?: string;
  };
  reasons: string[];
  reviewProof: string[];
}

const productUrl = (productNo: string) => `https://sleepnsleepmall.com/product/detail.html?product_no=${productNo}`;

export const sleepfitCatalog: SleepfitCatalogProduct[] = [
  {
    productNo: "330",
    name: "[슬립앤슬립] 깊은잠베개",
    url: productUrl("330"),
    imageUrl: "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202503/c37b0ec9db0b472dd1915a4c7973d0e4.jpg",
    priceText: "94,900원",
    tags: ["pillow", "side_sleep", "back_sleep", "mixed_sleep", "medium_height", "high_height", "height_adjust", "mid"],
    optionHints: {
      default: "처음이면 M사이즈를 기준으로 보고, 낮은 베개를 선호하면 S사이즈도 함께 비교하세요.",
      small: "체구가 작거나 낮은 높이를 선호하면 S사이즈부터 확인하세요.",
      average: "평균 체형이면 M사이즈가 무난합니다. 낮은 베개를 좋아하면 S도 비교하세요.",
      large: "어깨가 넓거나 옆으로 자는 시간이 길면 M사이즈를 먼저 추천합니다.",
      low: "낮은 높이가 편하면 S사이즈를 먼저 보세요.",
      high: "높이감과 지지감을 원하면 M사이즈를 먼저 보세요.",
    },
    reasons: [
      "수면 자세가 자주 바뀌는 방문자에게 가장 먼저 비교시키기 좋은 대표 베개입니다.",
      "S/M 옵션이 있어 체형과 선호 높이에 맞춰 선택을 좁히기 쉽습니다.",
      "상품상세의 리뷰 수와 평점 근거가 충분해 첫 구매 불안을 낮추기 좋습니다.",
    ],
    reviewProof: [
      "상품 구조화 데이터 기준 리뷰 15,009건과 평점 4.6이 확인됩니다.",
      "후기에는 옆으로 누웠을 때 얼굴이 눌리지 않는다는 반응이 반복됩니다.",
      "너무 푹신한 베개보다 적당히 받쳐주는 느낌을 찾는 고객 후기가 보입니다.",
    ],
  },
  {
    productNo: "345",
    name: "[슬립앤슬립] 와이드핏 베개",
    url: productUrl("345"),
    imageUrl: "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202410/4c2883d241621aed34f65b29e2962bc9.jpg",
    priceText: "157,500원",
    tags: ["pillow", "side_sleep", "mixed_sleep", "high_height", "wide", "firm", "premium"],
    optionHints: {
      default: "옆으로 자거나 어깨 폭이 있는 편이면 넓은 지지감을 기준으로 비교하세요.",
      large: "체구가 크거나 뒤척임이 많다면 와이드 타입을 우선 비교하세요.",
      high: "높이감과 넓은 면적을 함께 원할 때 적합한 후보입니다.",
    },
    reasons: [
      "넓은 베개 면적이 필요한 옆잠/뒤척임 많은 방문자에게 맞습니다.",
      "프리미엄 가격대라도 안정적인 지지감을 우선하는 경우 추천 우선순위가 올라갑니다.",
    ],
    reviewProof: [
      "카테고리명과 이미지 대체 텍스트에서 넓은 디자인과 편안한 수면 소구가 확인됩니다.",
      "깊은잠 라인과 함께 비교하면 높이와 폭 기준으로 선택지가 또렷해집니다.",
    ],
  },
  {
    productNo: "380",
    name: "[슬립앤슬립] 깊은잠 어깨베개",
    url: productUrl("380"),
    imageUrl: "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202602/196f7ce33ccc3998430b7099f682e067.jpg",
    priceText: "103,000원",
    tags: ["pillow", "side_sleep", "back_sleep", "medium_height", "high_height", "firm", "mid"],
    optionHints: {
      default: "어깨 라인까지 받치는 느낌을 원하면 이 후보를 비교하세요.",
      large: "어깨 폭 때문에 일반 베개가 낮게 느껴진다면 우선 비교할 만합니다.",
      high: "높이감과 받침감을 함께 원할 때 추천합니다.",
    },
    reasons: [
      "옆으로 잘 때 어깨와 목 주변의 받침감을 중요하게 보는 방문자에게 어울립니다.",
      "깊은잠베개와 가격대가 가까워 상세 비교 후보로 좋습니다.",
    ],
    reviewProof: [
      "상품명과 카테고리 정보에서 어깨 지지 니즈가 뚜렷합니다.",
      "기능성 베개군 안에서 자세 기준 비교가 쉬운 상품입니다.",
    ],
  },
  {
    productNo: "36",
    name: "[슬립앤슬립] 리얼 오가닉 베개 (높이 조절 패드 포함)",
    url: productUrl("36"),
    imageUrl: "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202402/675a7c807e6e683d7aac7024d1ffdca5.jpg",
    priceText: "79,000원",
    tags: ["pillow", "side_sleep", "back_sleep", "low_height", "medium_height", "height_adjust", "organic", "value"],
    optionHints: {
      default: "높이를 확신하기 어렵다면 조절 패드를 활용해 낮게 시작하는 구성이 좋습니다.",
      low: "낮은 베개를 선호하면 패드를 빼거나 낮은 세팅부터 시작하세요.",
      small: "체구가 작으면 낮은 세팅부터 맞춰보는 쪽이 안전합니다.",
    },
    reasons: [
      "높이 취향이 애매한 방문자에게 조절 가능한 선택지가 구매 부담을 낮춥니다.",
      "오가닉 소재 선호와 합리적인 가격대를 동시에 맞추기 좋습니다.",
    ],
    reviewProof: [
      "실시간 리뷰에서 리얼 오가닉 베개는 옆으로 누울 때 편하다는 후기가 보입니다.",
      "높이 조절 패드 포함 상품이라 처음 구매자의 높이 실패 부담을 줄일 수 있습니다.",
    ],
  },
  {
    productNo: "337",
    name: "[슬립앤슬립] 리얼오가닉 S자형 바디베개",
    url: productUrl("337"),
    imageUrl: "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202402/6b704bf99f1bba77c39e612c53332078.jpg",
    priceText: "69,000원",
    tags: ["pillow", "side_sleep", "organic", "soft", "value"],
    optionHints: {
      default: "옆으로 자는 시간이 길고 몸을 기대는 안정감을 원하면 함께 비교하세요.",
    },
    reasons: [
      "옆잠 비중이 높고 팔·다리 위치가 불편한 방문자에게 보조 선택지로 좋습니다.",
      "베개 단품보다 몸 전체의 자세 안정감을 함께 보고 싶을 때 대안이 됩니다.",
    ],
    reviewProof: [
      "바디베개 카테고리 특성상 옆잠 사용 맥락이 뚜렷합니다.",
      "오가닉 라인 안에서 합리적인 가격대의 보조 상품입니다.",
    ],
  },
  {
    productNo: "193",
    name: "[슬립앤슬립] 순수 오가닉 메모리폼 베개",
    url: productUrl("193"),
    imageUrl: "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202311/1bfb488f8d8c5bc49713e57e7d2696a8.jpg",
    priceText: "109,000원",
    tags: ["pillow", "back_sleep", "stomach_sleep", "low_height", "soft", "organic", "mid"],
    optionHints: {
      default: "낮고 부드러운 메모리폼감을 선호하면 비교하세요.",
      low: "낮은 높이 선호라면 우선순위를 높일 만합니다.",
    },
    reasons: [
      "엎드려 자거나 낮은 베개를 선호하는 방문자에게 무리 없는 후보입니다.",
      "오가닉 소재와 메모리폼감을 함께 찾는 경우 추천합니다.",
    ],
    reviewProof: [
      "카테고리 정보에서 목 곡선을 받치는 메모리폼 베개로 설명됩니다.",
      "낮은 높이와 부드러운 소재 취향을 함께 반영할 수 있는 상품입니다.",
    ],
  },
  {
    productNo: "308",
    name: "[슬립앤슬립] 푸딩 오가닉 메모리폼 베개",
    url: productUrl("308"),
    imageUrl: "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202311/5345517503fe023a2fd06f3ff2563d05.jpg",
    priceText: "168,000원",
    tags: ["pillow", "back_sleep", "stomach_sleep", "low_height", "soft", "organic", "premium"],
    optionHints: {
      default: "푹신한 감촉과 프리미엄 소재감을 원하면 비교하세요.",
    },
    reasons: [
      "부드러운 감촉을 가장 중요하게 보는 프리미엄 방문자에게 맞습니다.",
      "낮은 높이와 오가닉 소재 선호가 동시에 있으면 추천 점수가 높아집니다.",
    ],
    reviewProof: [
      "상품 정보에서 머리를 부드럽게 지지하는 오가닉 메모리폼 소구가 확인됩니다.",
      "소재감 중심의 구매자에게 설명하기 쉬운 상품입니다.",
    ],
  },
  {
    productNo: "296",
    name: "[슬립앤슬립] 마스터유닛2 베개(소프트)",
    url: productUrl("296"),
    imageUrl: "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202601/7e2618b50113cec0c90ef7d6c5e1be07.jpg",
    priceText: "216,000원",
    tags: ["pillow", "back_sleep", "mixed_sleep", "medium_height", "soft", "premium"],
    optionHints: {
      default: "프리미엄 라인에서 부드러운 지지감을 원하면 소프트 타입을 비교하세요.",
    },
    reasons: [
      "프리미엄 예산이 있고 단단함보다 부드러운 지지감을 원하는 방문자에게 맞습니다.",
    ],
    reviewProof: [
      "상품명에서 소프트 타입이 명확해 하드 타입과 비교 안내가 쉽습니다.",
      "프리미엄 가격대 구매자에게 선택 기준을 분리해 줄 수 있습니다.",
    ],
  },
  {
    productNo: "295",
    name: "[슬립앤슬립] 마스터유닛2 베개 (하드)",
    url: productUrl("295"),
    imageUrl: "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202311/678a10d3f6af5ee3260349f322dc9711.jpg",
    priceText: "192,000원",
    tags: ["pillow", "side_sleep", "back_sleep", "medium_height", "high_height", "firm", "premium"],
    optionHints: {
      default: "탄탄한 받침감을 선호하면 하드 타입을 비교하세요.",
      large: "체구가 크고 탄탄한 베개를 원하면 하드 타입이 더 잘 맞을 수 있습니다.",
    },
    reasons: [
      "단단한 지지감을 선호하는 프리미엄 구매자에게 맞습니다.",
      "소프트 타입과 함께 보여주면 단단함 취향을 빠르게 확정할 수 있습니다.",
    ],
    reviewProof: [
      "상품명에서 하드 타입이 명확해 단단한 지지감 선호자를 구분할 수 있습니다.",
      "프리미엄 베개군에서 소프트/하드 비교가 가능합니다.",
    ],
  },
  {
    productNo: "394",
    name: "아이스넷(Ice-net) 냉감패드",
    url: productUrl("394"),
    imageUrl: "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202509/85a09ed2f98e9830333a91aebfc2b8c8.jpg",
    priceText: "105,000원",
    tags: ["topper", "bedding", "cooling", "mid"],
    optionHints: {
      default: "더위를 많이 타면 베개와 함께 냉감패드까지 세트 관점으로 비교하세요.",
      hot: "더위 민감도가 높으므로 냉감 소재 상품을 우선 추천합니다.",
    },
    reasons: [
      "더위를 많이 타는 방문자는 베개보다 냉감 침구 니즈가 더 강할 수 있습니다.",
      "여름 냉감침구 메인 배너와 연결되는 시즌성 추천 상품입니다.",
    ],
    reviewProof: [
      "홈 상단에서 여름 냉감침구 대표 상품으로 노출됩니다.",
      "상품 정보에서 급속 냉감 신소재가 적용된 여름용 매트로 설명됩니다.",
    ],
  },
  {
    productNo: "342",
    name: "[슬립앤슬립] 깊은잠 매트리스",
    url: productUrl("342"),
    imageUrl: "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202602/65db9dfa6a6d56ff775577e40f4695b6.jpg",
    priceText: "358,500원",
    tags: ["topper", "mixed_sleep", "premium"],
    optionHints: {
      default: "베개만으로 부족하고 침대 전체의 받침감을 바꾸고 싶다면 매트리스까지 비교하세요.",
    },
    reasons: [
      "베개 선택보다 수면 환경 전체 개선 니즈가 강한 방문자에게 확장 추천하기 좋습니다.",
    ],
    reviewProof: [
      "홈 베스트/신상품 영역에서 깊은잠 매트리스가 함께 노출됩니다.",
      "베개와 매트리스를 함께 비교하면 수면 환경 전체 제안이 가능합니다.",
    ],
  },
  {
    productNo: "358",
    name: "[슬립앤슬립] 깊은잠 베개X매트리스 세트",
    url: productUrl("358"),
    imageUrl: "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202602/579fee807184877f3e4884021f7925b6.jpg",
    priceText: "89,500원",
    tags: ["bundle", "pillow", "topper", "mixed_sleep", "value"],
    optionHints: {
      default: "처음부터 베개와 매트리스 구성을 함께 보고 싶다면 세트 후보를 확인하세요.",
    },
    reasons: [
      "단품보다 세트 구성으로 수면 환경을 맞추려는 방문자에게 좋습니다.",
      "예산 민감도가 높을 때 단품 외 대안을 보여줄 수 있습니다.",
    ],
    reviewProof: [
      "베개X매트리스 세트 상품이 카테고리에 노출되어 세트 구매 니즈를 받을 수 있습니다.",
      "베개만 고르기 어려운 방문자에게 구성형 제안으로 망설임을 줄입니다.",
    ],
  },
  {
    productNo: "392",
    name: "아이스넷 냉감 베개커버",
    url: productUrl("392"),
    imageUrl: "https://cafe24img.poxo.com/sleepnsleepmall/web/product/medium/202509/da9ae273f6de84fe28bef2c1b6475551.jpg",
    priceText: "25,000원",
    tags: ["cover", "cooling", "value"],
    optionHints: {
      default: "기존 베개는 유지하고 더운 느낌만 줄이고 싶다면 커버부터 비교하세요.",
      hot: "더위가 핵심 고민이면 냉감 커버를 함께 제안하세요.",
    },
    reasons: [
      "더위 민감도가 높지만 큰 금액 지출을 망설이는 방문자에게 낮은 마찰 대안입니다.",
    ],
    reviewProof: [
      "홈 신상품 영역에서 아이스넷 냉감 베개커버가 함께 노출됩니다.",
      "냉감패드와 묶어 여름 침구 니즈를 확장할 수 있습니다.",
    ],
  },
];

export function getSleepfitProduct(productNo: string | number | undefined) {
  if (productNo == null) return undefined;
  const normalized = String(productNo).trim();
  return sleepfitCatalog.find((product) => product.productNo === normalized);
}
