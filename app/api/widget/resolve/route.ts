import { NextResponse } from "next/server";
import { POST as postOnsiteContext } from "@/app/api/onsite/context/route";
import { corsHeaders, optionsResponse } from "@/lib/onsite/cors";
import { normalizeCompatBase, normalizeCompatProduct } from "@/lib/onsite/compat";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

function requestWithJson(request: Request, payload: unknown) {
  const headers = new Headers(request.headers);
  headers.set("Content-Type", "application/json");

  return new Request(request.url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

function triggerFor(pageType: string | undefined) {
  return pageType === "product_detail"
    ? { type: "delay", value: 30 }
    : { type: "delay", value: 3 };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Invalid widget resolve payload." },
      { status: 400, headers: corsHeaders(request) },
    );
  }

  const source = body as Record<string, unknown>;
  const base = normalizeCompatBase(source);
  const product = normalizeCompatProduct(source);
  const contextRequest = { ...base, product };
  const response = await postOnsiteContext(requestWithJson(request, contextRequest));
  const rawText = await response.text();
  let json: {
    data?: {
      greeting?: string;
      placeholder?: string;
      secondaryCta?: string;
      products?: Array<{
        productNo?: string | null;
        name?: string | null;
        reason?: string | null;
        priceText?: string | null;
        imageUrl?: string | null;
        url?: string | null;
      }>;
      disclosure?: string;
    };
  } | null = null;

  try {
    json = rawText ? JSON.parse(rawText) : null;
  } catch {
    // Preserve the upstream error below if context does not return JSON.
  }

  if (!response.ok || !json?.data) {
    return new Response(rawText, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  const products = Array.isArray(json.data.products) ? json.data.products : [];
  const firstProduct = products.find((item) => item?.url || item?.imageUrl);
  const isProductDetail = product.pageType === "product_detail";
  const clickUrl = isProductDetail
    ? product.url || firstProduct?.url || base.page.url
    : firstProduct?.url || product.url || base.page.url;
  const imageUrl = product.imageUrl || firstProduct?.imageUrl || null;

  return NextResponse.json(
    {
      banner: {
        show: true,
        campaignId: isProductDetail ? "slipai_product_recommendation" : "slipai_shopping_guide",
        bannerType: "bottom_floating",
        position: "bottom-right",
        title: isProductDetail ? "리뷰 보고 결정해보세요" : "첫 방문 쇼핑가이드",
        description:
          json.data.greeting ||
          (isProductDetail
            ? "상품 정보와 후기를 기준으로 비교하기 좋은 상품을 보여드릴게요."
            : "많이 살펴보는 상품과 리뷰 반응이 좋은 상품부터 안내드릴게요."),
        imageUrl,
        ctaText: isProductDetail ? "비슷한 상품 보기" : "상품 추천 받기",
        clickUrl,
        trigger: triggerFor(product.pageType),
        products,
        disclosure:
          json.data.disclosure || "SlipAI는 이 쇼핑몰에서 확인한 상품과 후기 기준으로 안내합니다.",
      },
      chat: {
        enabled: true,
        assistantName: "SlipAI 상담사",
        position: "bottom-right",
        initialMessage:
          json.data.greeting || "어떤 부분이 고민되나요? 이 쇼핑몰의 상품과 후기 기준으로 도와드릴게요.",
        placeholder: json.data.placeholder || "궁금한 내용을 입력해 주세요.",
        cta: {
          enabled: true,
          label: json.data.secondaryCta || "상담 시작하기",
          url: clickUrl,
        },
      },
    },
    { status: response.status, headers: response.headers },
  );
}
