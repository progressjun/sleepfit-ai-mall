import { NextResponse } from "next/server";
import { corsHeaders, optionsResponse } from "@/lib/onsite/cors";
import { applyOnsiteRateLimit, rateLimitHeaders } from "@/lib/onsite/rate-limit";
import { onsiteContextRequestSchema } from "@/lib/onsite/schemas";
import {
  getFeaturedOnsiteProducts,
  getOnsiteKnowledge,
  getRelatedOnsiteProducts,
  validateOnsiteWidgetAuth,
} from "@/lib/onsite/storage";
import type { OnsiteProductSource } from "@/lib/onsite/mock";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

interface DomainProfile {
  pattern: RegExp;
  focus: string[];
  productQuestion: (name: string) => string;
  homeQuestion: string;
}

function ko(value: string) {
  return value;
}

function termsPattern(terms: string[]) {
  return new RegExp(terms.join("|"), "i");
}

const DOMAIN_PROFILES: DomainProfile[] = [
  {
    pattern: termsPattern([
      "\uD2F0\uC154\uCE20",
      "\uC154\uCE20",
      "\uC6D0\uD53C\uC2A4",
      "\uD32C\uCE20",
      "\uC2AC\uB799\uC2A4",
      "\uC544\uC6B0\uD130",
      "\uC790\uCF13",
      "\uC7AC\uD0B7",
      "\uB2C8\uD2B8",
      "\uD6C4\uB4DC",
      "\uC2A4\uCEE4\uD2B8",
      "\uBE14\uB77C\uC6B0\uC2A4",
      "\uCF54\uD2BC",
      "\uB370\uB2D8",
      "\uC758\uB958",
      "\uC18C\uC7AC",
      "\uCC29\uC6A9",
      "\uC0AC\uC774\uC988",
    ]),
    focus: [ko("\uD54F"), ko("\uC18C\uC7AC"), ko("\uC0C9\uAC10"), ko("\uD6C4\uAE30")],
    productQuestion: (name: string) => `${name} \uD54F\uACFC \uC18C\uC7AC\uB294 \uC5B4\uB5A4\uAC00\uC694?`,
    homeQuestion: ko("\uCC98\uC74C \uBCF4\uAE30 \uC88B\uC740 \uB370\uC77C\uB9AC \uC0C1\uD488 \uCD94\uCC9C\uD574\uC918."),
  },
  {
    pattern: termsPattern([
      "\uC2A4\uD0A8",
      "\uD06C\uB9BC",
      "\uC138\uB7FC",
      "\uD1A0\uB108",
      "\uC570\uD50C",
      "\uB85C\uC158",
      "\uD074\uB80C\uC9D5",
      "\uB9C8\uC2A4\uD06C",
      "\uD654\uC7A5\uD488",
      "\uBC14\uB514",
      "\uD5A5",
      "\uC131\uBD84",
      "\uBC1C\uB9BC",
    ]),
    focus: [ko("\uD53C\uBD80 \uD0C0\uC785"), ko("\uC131\uBD84"), ko("\uC0AC\uC6A9\uAC10"), ko("\uD6C4\uAE30")],
    productQuestion: (name: string) => `${name} \uB0B4 \uD53C\uBD80 \uD0C0\uC785\uC5D0 \uB9DE\uC744\uAE4C\uC694?`,
    homeQuestion: ko("\uD53C\uBD80 \uACE0\uBBFC\uBCC4\uB85C \uC0C1\uD488\uC744 \uACE8\uB77C\uC918."),
  },
  {
    pattern: termsPattern([
      "\uC720\uC0B0\uADE0",
      "\uD504\uB85C\uBC14\uC774\uC624\uD2F1\uC2A4",
      "\uC720\uB798",
      "\uC601\uC591\uC81C",
      "\uBE44\uD0C0\uBBFC",
      "\uD6A8\uC18C",
      "\uD64D\uC0BC",
      "\uCF5C\uB77C\uAC90",
      "\uAC74\uAC15\uAE30\uB2A5\uC2DD\uD488",
      "\uC12D\uCDE8",
      "\uC131\uBD84",
      "\uBCF4\uC7A5\uADE0\uC218",
    ]),
    focus: [ko("\uC131\uBD84"), ko("\uC12D\uCDE8 \uBC29\uBC95"), ko("\uD6C4\uAE30"), ko("\uAD6C\uC131")],
    productQuestion: (name: string) => `${name} \uC131\uBD84\uACFC \uC12D\uCDE8 \uD3EC\uC778\uD2B8\uB294 \uC5B4\uB5A4\uAC00\uC694?`,
    homeQuestion: ko("\uC131\uBD84\uACFC \uD6C4\uAE30 \uBC18\uC751 \uAE30\uC900\uC73C\uB85C \uAC74\uAC15\uC2DD\uD488\uC744 \uCD94\uCC9C\uD574\uC918."),
  },
  {
    pattern: termsPattern([
      "\uC2DD\uD488",
      "\uAC04\uC2DD",
      "\uCEE4\uD53C",
      "\uCC28",
      "\uC74C\uB8CC",
      "\uAC74\uAC15",
      "\uC601\uC591",
      "\uB9DB",
      "\uC6D0\uB8CC",
      "\uBCF4\uAD00",
      "\uB0C9\uB3D9",
    ]),
    focus: [ko("\uB9DB"), ko("\uC6D0\uB8CC"), ko("\uAD6C\uC131"), ko("\uD6C4\uAE30")],
    productQuestion: (name: string) => `${name} \uB9DB\uACFC \uAD6C\uC131\uC740 \uC5B4\uB5A4\uAC00\uC694?`,
    homeQuestion: ko("\uB9AC\uBDF0 \uBC18\uC751 \uC88B\uC740 \uAD6C\uC131\uC73C\uB85C \uCD94\uCC9C\uD574\uC918."),
  },
  {
    pattern: termsPattern([
      "\uAC00\uAD6C",
      "\uCE68\uAD6C",
      "\uC18C\uD30C",
      "\uD14C\uC774\uBE14",
      "\uC758\uC790",
      "\uC11C\uB78D",
      "\uC870\uBA85",
      "\uC778\uD14C\uB9AC\uC5B4",
      "\uACF5\uAC04",
      "\uC0AC\uC774\uC988",
      "\uC124\uCE58",
    ]),
    focus: [ko("\uACF5\uAC04"), ko("\uC0AC\uC774\uC988"), ko("\uC18C\uC7AC"), ko("\uBC30\uC1A1")],
    productQuestion: (name: string) => `${name} \uC6B0\uB9AC \uACF5\uAC04\uC5D0 \uC0AC\uC774\uC988\uAC00 \uB9DE\uC744\uAE4C\uC694?`,
    homeQuestion: ko("\uACF5\uAC04\uC5D0 \uB9DE\uB294 \uC0C1\uD488\uC744 \uBE44\uAD50\uD574\uC918."),
  },
  {
    pattern: termsPattern([
      "\uAE30\uAE30",
      "\uC804\uC790",
      "\uCDA9\uC804",
      "\uCF00\uC774\uBE14",
      "\uC774\uC5B4\uD3F0",
      "\uC2A4\uD53C\uCEE4",
      "\uD638\uD658",
      "\uBC30\uD130\uB9AC",
      "\uC131\uB2A5",
      "\uAE30\uB2A5",
    ]),
    focus: [ko("\uAE30\uB2A5"), ko("\uD638\uD658"), ko("\uC0AC\uC6A9\uC131"), ko("\uD6C4\uAE30")],
    productQuestion: (name: string) => `${name} \uAE30\uB2A5\uACFC \uD638\uD658\uC131\uC744 \uBE44\uAD50\uD574\uC918.`,
    homeQuestion: ko("\uC6A9\uB3C4\uC5D0 \uB9DE\uB294 \uC81C\uD488\uC744 \uCD94\uCC9C\uD574\uC918."),
  },
];

const DEFAULT_PROFILE: DomainProfile = {
  pattern: /.*/,
  focus: [ko("\uD6C4\uAE30"), ko("\uC635\uC158"), ko("\uAC00\uACA9"), ko("\uBE44\uAD50")],
  productQuestion: (name: string) => `${name} \uAD6C\uB9E4 \uC804\uC5D0 \uC5B4\uB5A4 \uC810\uC744 \uBCF4\uBA74 \uC88B\uC744\uAE4C\uC694?`,
  homeQuestion: ko("\uD6C4\uAE30 \uC88B\uC740 \uC0C1\uD488\uBD80\uD130 \uCD94\uCC9C\uD574\uC918."),
};

function compact(value: string | undefined | null) {
  return value ? value.replace(/\s+/g, " ").trim() : "";
}

function uniq(values: string[]) {
  return Array.from(new Set(values.map(compact).filter(Boolean)));
}

function chooseProfile(products: OnsiteProductSource[], pageTitle?: string) {
  const primaryHaystack = [
    pageTitle,
    ...products.flatMap((product) => [product.name, product.priceText]),
  ]
    .filter(Boolean)
    .join(" ");
  const primaryMatch = DOMAIN_PROFILES.find((profile) => profile.pattern.test(primaryHaystack));
  if (primaryMatch) return primaryMatch;

  const reviewHaystack = products
    .flatMap((product) => product.reviews.map((review) => review.content))
    .filter(Boolean)
    .join(" ");

  return DOMAIN_PROFILES.find((profile) => profile.pattern.test(reviewHaystack)) ?? DEFAULT_PROFILE;
}

function cleanMallName(pageTitle: string | undefined, productName: string | undefined, mallId: string) {
  const title = compact(pageTitle);
  if (!title) return mallId;

  const withoutProduct = productName ? title.replace(productName, "") : title;
  const candidate = withoutProduct
    .split(/[-|:>]/)
    .map((part) => compact(part))
    .filter(Boolean)
    .pop();

  return candidate || title || mallId;
}

function toPublicProduct(product: OnsiteProductSource) {
  return {
    productNo: product.productNo == null ? null : String(product.productNo),
    name: product.name,
    priceText: product.priceText ?? null,
    imageUrl: product.imageUrl ?? null,
    url: product.url ?? null,
    reason: product.reviewSummary || ko("\uC774 \uC1FC\uD551\uBAB0\uC5D0\uC11C \uD568\uAED8 \uC0B4\uD3B4\uBCF4\uAE30 \uC88B\uC740 \uC0C1\uD488\uC785\uB2C8\uB2E4."),
  };
}

function buildContext({
  mallName,
  product,
  candidates,
  pageType,
  pageTitle,
}: {
  mallName: string;
  product: OnsiteProductSource;
  candidates: OnsiteProductSource[];
  pageType: string;
  pageTitle?: string;
}) {
  const products = uniq([product.name, ...candidates.map((item) => item.name)]);
  const profile = chooseProfile([product, ...candidates], pageTitle);
  const focus = profile.focus;
  const productName = compact(product.name) || products[0] || ko("\uD604\uC7AC \uC0C1\uD488");
  const isProductDetail = pageType === "product_detail";
  const hasRealCatalog = candidates.some((item) => item.name && !/^\uCD94\uCC9C \uC0C1\uD488/.test(item.name));
  const topNames = products
    .filter((name) => name !== ko("\uD604\uC7AC \uC0C1\uD488") && name !== ko("\uCD94\uCC9C \uC0C1\uD488"))
    .slice(0, 2);

  const greeting = isProductDetail
    ? `${productName} \uBCF4\uACE0 \uACC4\uC2DC\uB124\uC694. ${focus[0]}, ${focus[1]}, \uC2E4\uC81C \uD6C4\uAE30 \uAE30\uC900\uC73C\uB85C \uC548\uB0B4\uB4DC\uB9B4\uAC8C\uC694.`
    : topNames.length > 0 && hasRealCatalog
      ? `${mallName}\uC5D0\uC11C ${topNames.join(", ")} \uAC19\uC740 \uC0C1\uD488\uC744 \uBCF4\uACE0 \uACC4\uC2DC\uB124\uC694. ${focus[0]}, ${focus[1]} \uAE30\uC900\uC73C\uB85C \uACE8\uB77C\uB4DC\uB9B4\uAC8C\uC694.`
      : `${mallName} \uC0C1\uD488\uACFC \uD6C4\uAE30 \uAE30\uC900\uC73C\uB85C \uC548\uB0B4\uB4DC\uB9B4\uAC8C\uC694. ${focus[0]}, ${focus[1]} \uC911 \uC5B4\uB5A4 \uC810\uC774 \uACE0\uBBFC\uB418\uC138\uC694?`;

  const placeholder = `${focus.slice(0, 3).join(", ")} \uC911 \uC5B4\uB5A4 \uC810\uC774 \uACE0\uBBFC\uB418\uB098\uC694?`;
  const quickQuestions = isProductDetail
    ? [
        profile.productQuestion(productName),
        ko("\uC88B\uC740 \uD6C4\uAE30 \uC911\uC2EC\uC73C\uB85C \uBCF4\uC5EC\uC8FC\uC138\uC694."),
        ko("\uBE44\uC2B7\uD55C \uC0C1\uD488\uACFC \uBE44\uAD50\uD574\uC918."),
      ]
    : [
        profile.homeQuestion,
        `${focus[0]} \uAE30\uC900\uC73C\uB85C \uACE8\uB77C\uC918.`,
        ko("\uB9AC\uBDF0 \uBC18\uC751 \uC88B\uC740 \uC0C1\uD488 \uBCF4\uC5EC\uC918."),
      ];

  return {
    advisorTitle: ko("SlipAI \uC0C1\uB2F4\uC0AC"),
    greeting,
    placeholder,
    secondaryCta: isProductDetail
      ? ko("\uC774 \uC0C1\uD488 \uC0C1\uB2F4\uD558\uAE30")
      : ko("\uB0B4\uAC8C \uB9DE\uB294 \uC0C1\uD488 \uCC3E\uAE30"),
    focusLabels: focus,
    quickQuestions,
    products: candidates.slice(0, 3).map(toPublicProduct),
    disclosure: ko("SlipAI\uB294 \uC774 \uC1FC\uD551\uBAB0\uC5D0\uC11C \uD655\uC778\uD55C \uC0C1\uD488\uACFC \uD6C4\uAE30 \uAE30\uC900\uC73C\uB85C \uC548\uB0B4\uD569\uB2C8\uB2E4."),
  };
}

export async function POST(request: Request) {
  const parsed = onsiteContextRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid onsite context request." },
      { status: 400, headers: corsHeaders(request) },
    );
  }

  const rateLimit = applyOnsiteRateLimit({
    route: "context",
    request,
    projectKey: parsed.data.projectKey,
    mallId: parsed.data.mallId,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, message: "Too many onsite context requests. Please try again shortly." },
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
      { ok: false, message: `Unauthorized: ${auth.reason}` },
      { status: 401, headers: { ...corsHeaders(request), ...rateLimitHeaders(rateLimit) } },
    );
  }

  const product = await getOnsiteKnowledge({
    projectKey: parsed.data.projectKey,
    mallId: parsed.data.mallId,
    product: parsed.data.product,
  });
  const candidates =
    parsed.data.product?.pageType === "product_detail"
      ? await getRelatedOnsiteProducts({
          projectKey: parsed.data.projectKey,
          mallId: parsed.data.mallId,
          currentProduct: product,
          limit: 3,
        })
      : await getFeaturedOnsiteProducts({
          projectKey: parsed.data.projectKey,
          mallId: parsed.data.mallId,
          limit: 3,
        });

  const mallName = cleanMallName(parsed.data.page.title, product.name, parsed.data.mallId);

  return NextResponse.json(
    {
      ok: true,
      data: buildContext({
        mallName,
        product,
        candidates,
        pageType: parsed.data.product?.pageType || "other",
        pageTitle: parsed.data.page.title,
      }),
    },
    { headers: { ...corsHeaders(request), ...rateLimitHeaders(rateLimit) } },
  );
}
