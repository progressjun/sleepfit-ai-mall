import crypto from "node:crypto";
import type { OnsiteProductSource } from "@/lib/onsite/mock";

const DEFAULT_SCOPES = ["mall.read_product", "mall.read_store"];

export interface Cafe24TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  expires_in?: number;
  scopes?: string[];
}

function cafe24ClientId() {
  return process.env.CAFE24_CLIENT_ID || "";
}

function cafe24ClientSecret() {
  return process.env.CAFE24_CLIENT_SECRET || "";
}

function stateSecret() {
  return process.env.COMMERCE_PROVIDER_SECRET || process.env.TOKEN_ENCRYPTION_KEY || "c24ai-dev-state";
}
function stateTtlMs() {
  return Math.max(60_000, Number(process.env.CAFE24_STATE_TTL_SECONDS || 600) * 1000);
}

const usedStateMap = new Map<string, number>();

function configuredScopes() {
  return (process.env.CAFE24_SCOPES || DEFAULT_SCOPES.join(","))
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
}

export function hasCafe24OAuthConfig() {
  return Boolean(cafe24ClientId() && cafe24ClientSecret());
}

export function getCafe24RedirectUri(request: Request) {
  if (process.env.CAFE24_REDIRECT_URI) return process.env.CAFE24_REDIRECT_URI;
  const url = new URL(request.url);
  return `${url.origin}/api/cafe24/oauth/callback`;
}

export function createCafe24State(payload: { projectKey: string; mallId: string; ts?: number }) {
  const body = Buffer.from(JSON.stringify({ ...payload, ts: payload.ts ?? Date.now() })).toString("base64url");
  const signature = crypto.createHmac("sha256", stateSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function readCafe24State(state: string) {
  const [body, signature] = state.split(".");
  if (!body || !signature) return null;

  const expected = crypto.createHmac("sha256", stateSecret()).update(body).digest("base64url");
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  const now = Date.now();
  const lastUsed = usedStateMap.get(state);
   if (lastUsed && now - lastUsed < stateTtlMs()) return null;
  usedStateMap.set(state, now);
  for (const [itemState, itemTime] of usedStateMap) {
    if (now - itemTime > stateTtlMs() * 2) usedStateMap.delete(itemState);
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      projectKey?: string;
      mallId?: string;
      ts?: number;
    };
    if (!parsed.ts || now - Number(parsed.ts) > stateTtlMs()) return null;
    if (!parsed.projectKey || !parsed.mallId) return null;
    return {
      projectKey: parsed.projectKey,
      mallId: parsed.mallId,
      ts: parsed.ts,
    };
  } catch {
    return null;
  }
}

export function buildCafe24AuthorizeUrl({
  mallId,
  projectKey,
  redirectUri,
  shopNo,
}: {
  mallId: string;
  projectKey: string;
  redirectUri: string;
  shopNo?: string;
}) {
  const url = new URL(`https://${mallId}.cafe24.com/api/v2/oauth/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", cafe24ClientId());
  url.searchParams.set("state", createCafe24State({ projectKey, mallId }));
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", configuredScopes().join(","));
  if (shopNo) url.searchParams.set("shop_no", shopNo);
  return url;
}

export async function exchangeCafe24Code({
  mallId,
  code,
  redirectUri,
}: {
  mallId: string;
  code: string;
  redirectUri: string;
}) {
  const credentials = Buffer.from(`${cafe24ClientId()}:${cafe24ClientSecret()}`).toString("base64");
  const form = new URLSearchParams();
  form.set("grant_type", "authorization_code");
  form.set("code", code);
  form.set("redirect_uri", redirectUri);

  const response = await fetch(`https://${mallId}.cafe24api.com/api/v2/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Cafe24 token exchange failed: ${response.status}`);
  }

  return (await response.json()) as Cafe24TokenResponse;
}

export async function refreshCafe24Token({
  mallId,
  refreshToken,
}: {
  mallId: string;
  refreshToken: string;
}) {
  const credentials = Buffer.from(`${cafe24ClientId()}:${cafe24ClientSecret()}`).toString("base64");
  const form = new URLSearchParams();
  form.set("grant_type", "refresh_token");
  form.set("refresh_token", refreshToken);

  const response = await fetch(`https://${mallId}.cafe24api.com/api/v2/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Cafe24 token refresh failed: ${response.status}`);
  }

  return (await response.json()) as Cafe24TokenResponse;
}

export async function fetchCafe24Products({
  mallId,
  accessToken,
  limit,
}: {
  mallId: string;
  accessToken: string;
  limit: number;
}) {
  const url = new URL(`https://${mallId}.cafe24api.com/api/v2/admin/products`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("fields", "product_no,product_name,price,summary_description,tiny_image,list_image");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Cafe24 product sync failed: ${response.status}`);
  }

  const payload = (await response.json()) as { products?: Array<Record<string, unknown>> };
  return (payload.products || []).map((product): OnsiteProductSource => {
    const productNo = product.product_no;
    const name = String(product.product_name || "Cafe24 product");
    return {
      productNo: typeof productNo === "string" || typeof productNo === "number" ? productNo : undefined,
      name,
      priceText:
        typeof product.price === "string" || typeof product.price === "number" ? String(product.price) : undefined,
      imageUrl:
        typeof product.tiny_image === "string"
          ? product.tiny_image
          : typeof product.list_image === "string"
            ? product.list_image
            : undefined,
      reviewSummary:
        typeof product.summary_description === "string" ? product.summary_description.replace(/<[^>]+>/g, " ") : "",
      reviews: [],
    };
  });
}
