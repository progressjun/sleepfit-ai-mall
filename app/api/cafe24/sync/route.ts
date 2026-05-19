import { NextResponse } from "next/server";
import { fetchCafe24Products, refreshCafe24Token } from "@/lib/commerce/cafe24-oauth";
import { createFallbackProduct, type OnsiteProductSource } from "@/lib/onsite/mock";
import { cafe24SyncRequestSchema } from "@/lib/onsite/schemas";
import { getCafe24Token, storeCafe24Token, storeSyncedProducts } from "@/lib/onsite/storage";

export const runtime = "nodejs";

function attachReviewSeeds(products: OnsiteProductSource[], seeds: Array<{ productNo: string | number; rating: number; content: string }>) {
  if (seeds.length === 0) return products;

  return products.map((product) => ({
    ...product,
    reviews: [
      ...product.reviews,
      ...seeds
        .filter((seed) => String(seed.productNo) === String(product.productNo))
        .map((seed) => ({ rating: seed.rating, content: seed.content })),
    ],
  }));
}

function productsFromSeeds(seeds: Array<{ productNo: string | number; rating: number; content: string }>) {
  const grouped = new Map<string, OnsiteProductSource>();

  for (const seed of seeds) {
    const productNo = String(seed.productNo);
    const existing =
      grouped.get(productNo) ||
      ({
        productNo,
        name: `Cafe24 product ${productNo}`,
        reviews: [],
      } satisfies OnsiteProductSource);
    existing.reviews.push({ rating: seed.rating, content: seed.content });
    grouped.set(productNo, existing);
  }

  return [...grouped.values()];
}

function getNextExpiryFromOauthResponse(expiresAt: string | undefined, expiresIn: number | undefined) {
  if (expiresAt) return expiresAt;
  if (typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0) {
    return new Date(Date.now() + expiresIn * 1000).toISOString();
  }

  return undefined;
}

export async function POST(request: Request) {
  const parsed = cafe24SyncRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid Cafe24 sync request." }, { status: 400 });
  }

  const token = await getCafe24Token(parsed.data.projectKey, parsed.data.mallId);
  let products: OnsiteProductSource[] = [];
  let source: "cafe24" | "seed" | "mock" = "mock";
  let warning: string | undefined;
  let activeToken = token?.accessToken;

  if (token && token.refreshToken) {
    const expired = token.expiresAt ? new Date(token.expiresAt).getTime() <= Date.now() : false;
    if (!token.expiresAt || expired) {
      try {
        const renewed = await refreshCafe24Token({
          mallId: parsed.data.mallId,
          refreshToken: token.refreshToken,
        });

        activeToken = renewed.access_token;
        await storeCafe24Token({
          projectKey: parsed.data.projectKey,
          mallId: parsed.data.mallId,
          accessToken: renewed.access_token,
          refreshToken: renewed.refresh_token || token.refreshToken,
          expiresAt: getNextExpiryFromOauthResponse(renewed.expires_at, renewed.expires_in),
          scopes: renewed.scopes || token.scopes || [],
        });
      } catch (refreshError) {
        warning = refreshError instanceof Error ? refreshError.message : "Cafe24 token refresh failed.";
      }
    }
  }

  if (activeToken) {
    try {
      products = await fetchCafe24Products({
        mallId: parsed.data.mallId,
        accessToken: activeToken,
        limit: parsed.data.limit,
      });
      products = attachReviewSeeds(products, parsed.data.reviewSeeds);
      source = "cafe24";
    } catch (error) {
      warning = error instanceof Error ? error.message : "Cafe24 product fetch failed.";
    }
  }

  if (products.length === 0 && parsed.data.reviewSeeds.length > 0) {
    products = productsFromSeeds(parsed.data.reviewSeeds);
    source = "seed";
  }

  if (products.length === 0) {
    products = [createFallbackProduct({ pageType: "product_detail", name: "Cafe24 demo product", productNo: "demo" })];
    source = "mock";
  }

  const storage = await storeSyncedProducts(parsed.data, products);

  return NextResponse.json({
    ok: true,
    source,
    warning,
    productCount: products.length,
    stored: storage.stored,
    message:
      source === "cafe24"
        ? "Cafe24 products were synced for onsite AI recommendations."
        : "Cafe24 token was unavailable, so seed/mock product context was stored for MVP testing.",
  });
}
