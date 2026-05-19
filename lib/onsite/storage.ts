import { createServerSupabaseClient } from "@/lib/supabase/server";
import { canStoreEncryptedSecrets, decryptSecret, encryptSecret } from "@/lib/security/tokens";
import { maskPIIInObject } from "@/lib/security/pii";
import crypto from "node:crypto";
import {
  createFallbackProduct,
  createMockRelatedProducts,
  type OnsiteProductSource,
  type OnsiteReviewSource,
} from "./mock";
import type {
  Cafe24SyncRequest,
  OnsiteChatRequest,
  OnsiteEventRequest,
  OnsiteProductContext,
  OnsiteRecommendationRequest,
} from "./schemas";

interface InstallationRecord {
  id: string;
  projectId?: string | null;
  projectKey: string;
  mallId: string;
  status: string;
  settings?: Record<string, unknown> | null;
  allowedOrigins?: string[];
}

interface MemoryStore {
  installations: Map<string, InstallationRecord>;
  events: OnsiteEventRequest[];
  products: Map<string, OnsiteProductSource[]>;
  chatMessages: Array<{ request: OnsiteChatRequest; answer: string; createdAt: string }>;
  recommendationLogs: Array<{ request: OnsiteRecommendationRequest; output: unknown; createdAt: string }>;
  cafe24Tokens: Map<string, Cafe24TokenRecord>;
}

interface Cafe24TokenRecord {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scopes: string[];
}

interface Cafe24TokenInput extends Cafe24TokenRecord {
  projectKey: string;
  mallId: string;
}

const globalStore = globalThis as typeof globalThis & {
  __c24AiMemoryStore?: MemoryStore;
};

const DEFAULT_WIDGET_SECRET = process.env.ONSITE_WIDGET_SHARED_SECRET?.trim();

function parseStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => Boolean(item));
  }

  if (typeof value !== "string") {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) return [];

  if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
    try {
      const parsed = JSON.parse(trimmed);
      return parseStringArray(parsed);
    } catch {
      // Fallback to comma list if JSON parsing fails.
    }
  }

  return trimmed
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getWidgetSecretFromSettings(settings: Record<string, unknown> | null | undefined) {
  if (!settings || typeof settings !== "object") return undefined;

  const candidate = settings.widget_secret || settings.widgetSecret;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : undefined;
}

function safeEqualsToken(a: string, b: string) {
  const lhs = Buffer.from(a);
  const rhs = Buffer.from(b);
  if (lhs.length !== rhs.length) return false;
  return crypto.timingSafeEqual(lhs, rhs);
}

function memoryStore() {
  globalStore.__c24AiMemoryStore ??= {
    installations: new Map(),
    events: [],
    products: new Map(),
    chatMessages: [],
    recommendationLogs: [],
    cafe24Tokens: new Map(),
  };
  return globalStore.__c24AiMemoryStore;
}

function keyFor(projectKey: string, mallId: string) {
  return `${projectKey}:${mallId}`;
}

function createMemoryInstallation(projectKey: string, mallId: string): InstallationRecord {
  const store = memoryStore();
  const key = keyFor(projectKey, mallId);
  const existing = store.installations.get(key);
  if (existing) return existing;

  const created: InstallationRecord = {
    id: `memory_${Buffer.from(key).toString("base64url").slice(0, 24)}`,
    projectKey,
    mallId,
    status: "active",
      settings: {
      widget_secret: DEFAULT_WIDGET_SECRET,
    },
  };
  store.installations.set(key, created);
  return created;
}

export async function ensureInstallation(projectKey: string, mallId: string) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return createMemoryInstallation(projectKey, mallId);
  }

  const existing = await supabase
    .from("onsite_installations")
    .select("id,project_id,public_key,mall_id,status,settings,allowed_origins")
    .eq("public_key", projectKey)
    .eq("mall_id", mallId)
    .maybeSingle();

  if (existing.data) {
    const allowedOrigins = parseStringArray(existing.data.allowed_origins);

    return {
      id: existing.data.id as string,
      projectId: existing.data.project_id as string | null,
      projectKey: existing.data.public_key as string,
      mallId: existing.data.mall_id as string,
      status: String(existing.data.status || "active"),
      settings: (existing.data.settings as Record<string, unknown> | null) ?? {},
      allowedOrigins: allowedOrigins,
    };
  }

  const inserted = await supabase
    .from("onsite_installations")
    .insert({
      public_key: projectKey,
      mall_id: mallId,
      status: "active",
      settings: {
        widget_secret: DEFAULT_WIDGET_SECRET,
      },
    })
    .select("id,project_id,public_key,mall_id,status,settings,allowed_origins")
    .single();

  if (inserted.data) {
    return {
      id: inserted.data.id as string,
      projectId: inserted.data.project_id as string | null,
      projectKey: inserted.data.public_key as string,
      mallId: inserted.data.mall_id as string,
      status: String(inserted.data.status || "active"),
      settings: (inserted.data.settings as Record<string, unknown> | null) ?? {},
      allowedOrigins: parseStringArray(inserted.data.allowed_origins),
    };
  }

  return createMemoryInstallation(projectKey, mallId);
}

export async function recordOnsiteEvent(event: OnsiteEventRequest) {
  const maskedEvent = maskPIIInObject(event);
  const installation = await ensureInstallation(maskedEvent.projectKey, maskedEvent.mallId);
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    memoryStore().events.push(maskedEvent);
    return { stored: "memory" as const };
  }

  try {
    await supabase.from("visitor_sessions").upsert(
      {
        installation_id: installation.id,
        visitor_id: maskedEvent.visitorId,
        session_id: maskedEvent.sessionId,
        last_seen_at: new Date().toISOString(),
        metadata: {
          page: maskedEvent.page,
          product: maskedEvent.product,
        },
      },
      { onConflict: "installation_id,session_id" },
    );

    const inserted = await supabase.from("onsite_events").insert({
      installation_id: installation.id,
      session_id: maskedEvent.sessionId,
      visitor_id: maskedEvent.visitorId,
      event_name: maskedEvent.eventName,
      page_url: maskedEvent.page.url,
      product_context: maskedEvent.product ?? {},
      metadata: {
        ...maskedEvent.metadata,
        page: maskedEvent.page,
        dwellSeconds: maskedEvent.dwellSeconds,
      },
      created_at: maskedEvent.occurredAt ?? new Date().toISOString(),
    });

    if (inserted.error) {
      memoryStore().events.push(maskedEvent);
      return { stored: "memory" as const, warning: inserted.error.message };
    }
  } catch (error) {
    if (error instanceof Error) {
      memoryStore().events.push(maskedEvent);
      return { stored: "memory" as const, warning: error.message };
    }
    memoryStore().events.push(maskedEvent);
    return { stored: "memory" as const, warning: "failed_to_store_event" };
  }

  return { stored: "supabase" as const };
}

export async function recordRecommendationLog(request: OnsiteRecommendationRequest, output: unknown) {
  const maskedRequest = maskPIIInObject(request);
  const installation = await ensureInstallation(request.projectKey, request.mallId);
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    memoryStore().recommendationLogs.push({
      request: maskedRequest,
      output: maskPIIInObject(output),
      createdAt: new Date().toISOString(),
    });
    return;
  }

  try {
    await supabase.from("ai_recommendation_logs").insert({
      installation_id: installation.id,
      session_id: maskedRequest.sessionId,
      visitor_id: maskedRequest.visitorId,
      surface: "banner",
      product_context: maskedRequest.product,
      output: maskPIIInObject(output),
    });
  } catch {
    memoryStore().recommendationLogs.push({
      request: maskedRequest,
      output: maskPIIInObject(output),
      createdAt: new Date().toISOString(),
    });
  }
}

export async function recordChatExchange(request: OnsiteChatRequest, answer: string) {
  const maskedRequest = maskPIIInObject(request);
  const maskedAnswer = maskPIIInObject(answer);
  const installation = await ensureInstallation(request.projectKey, request.mallId);
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    memoryStore().chatMessages.push({ request: maskedRequest, answer: maskedAnswer, createdAt: new Date().toISOString() });
    return request.conversationId || `${request.sessionId}_chat`;
  }

  try {
    const conversationId = maskedRequest.conversationId || `${maskedRequest.sessionId}_chat`;
    const chatSession = await supabase
      .from("chat_sessions")
      .upsert(
        {
          id: conversationId,
          installation_id: installation.id,
          session_id: maskedRequest.sessionId,
          visitor_id: maskedRequest.visitorId,
          last_message_at: new Date().toISOString(),
          product_context: maskedRequest.product ?? {},
        },
        { onConflict: "id" },
      )
      .select("id")
      .single();

    const sessionId = (chatSession.data?.id as string | undefined) || conversationId;

    await supabase.from("chat_messages").insert([
      {
        chat_session_id: sessionId,
        role: "visitor",
        content: maskedRequest.message,
        metadata: { page: maskedRequest.page, product: maskedRequest.product },
      },
      {
        chat_session_id: sessionId,
        role: "assistant",
        content: maskedAnswer,
        metadata: {},
      },
    ]);

    return sessionId;
  } catch {
    memoryStore().chatMessages.push({
      request: maskedRequest,
      answer: maskedAnswer,
      createdAt: new Date().toISOString(),
    });
    return maskedRequest.conversationId || `${maskedRequest.sessionId}_chat`;
  }
}

function normalizeReviewRows(rows: Array<Record<string, unknown>>): OnsiteReviewSource[] {
  return rows
    .map((row) => ({
      rating: Number(row.rating ?? 5),
      content: String(row.content ?? ""),
      createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    }))
    .filter((review) => review.content.length > 0);
}

function hasPositiveReviews(rows: OnsiteReviewSource[]) {
  return rows.some((review) => review.rating >= 4);
}

function createProductUrl(baseUrl: string | undefined, productNo: string) {
  if (!baseUrl) return undefined;

  try {
    const nextUrl = new URL(baseUrl);
    nextUrl.searchParams.set("product_no", productNo);
    return nextUrl.toString();
  } catch {
    return baseUrl;
  }
}

export async function getOnsiteKnowledge({
  projectKey,
  mallId,
  product,
}: {
  projectKey: string;
  mallId: string;
  product?: OnsiteProductContext;
}) {
  const supabase = createServerSupabaseClient();
  const fallback = createFallbackProduct(product);

  if (!supabase) {
    const products = memoryStore().products.get(keyFor(projectKey, mallId)) || [];
    const matched = products.find(
      (item) =>
        String(item.productNo || "") === String(product?.productNo || "") ||
        (product?.name && item.name.toLowerCase() === product.name.toLowerCase()),
    );
    return matched || fallback;
  }

  const installation = await ensureInstallation(projectKey, mallId);
  if (!installation.projectId && !product?.productNo) return fallback;

  const productQuery = supabase
    .from("products")
    .select("id,external_product_id,name,price,source_payload")
    .limit(1);

  if (installation.projectId) {
    productQuery.eq("project_id", installation.projectId);
  }

  if (product?.productNo) {
    productQuery.eq("external_product_id", String(product.productNo));
  } else if (product?.name) {
    productQuery.ilike("name", product.name);
  }

  const productResult = await productQuery.maybeSingle();
  const productRow = productResult.data as Record<string, unknown> | null;

  if (!productRow) return fallback;

  const reviewWhereProduct = String(productRow.external_product_id || product?.productNo || "");
  const reviewResult = await supabase
    .from("product_reviews")
    .select("rating,content,created_at")
    .eq("external_product_id", reviewWhereProduct)
    .gte("rating", 4)
    .order("rating", { ascending: false })
    .limit(6);

  const reviewRows: Array<Record<string, unknown>> =
    (reviewResult.data as Array<Record<string, unknown>> | null) || [];
  const normalizedReviews = normalizeReviewRows(reviewRows);
  const finalReviewRows = hasPositiveReviews(normalizedReviews)
    ? normalizedReviews
    : normalizeReviewRows((await supabase
        .from("product_reviews")
        .select("rating,content,created_at")
        .eq("external_product_id", reviewWhereProduct)
        .order("rating", { ascending: false })
        .limit(8)
      ).data as Array<Record<string, unknown>> | null || []);

  const reviews = finalReviewRows.length > 0 ? finalReviewRows : fallback.reviews;
  const payload =
    productRow.source_payload && typeof productRow.source_payload === "object"
      ? (productRow.source_payload as Record<string, unknown>)
      : {};

  return {
    productNo: String(productRow.external_product_id || product?.productNo || ""),
    name: String(productRow.name || product?.name || fallback.name),
    priceText:
      typeof productRow.price === "number" || typeof productRow.price === "string"
        ? `${productRow.price}`
        : product?.priceText,
    imageUrl: typeof payload.image_url === "string" ? payload.image_url : product?.imageUrl,
    url: product?.url,
    reviewSummary: typeof payload.review_summary === "string" ? payload.review_summary : fallback.reviewSummary,
    reviews: reviews.length > 0 ? reviews : fallback.reviews,
  };
}

export async function getRelatedOnsiteProducts({
  projectKey,
  mallId,
  currentProduct,
  limit = 3,
}: {
  projectKey: string;
  mallId: string;
  currentProduct: OnsiteProductSource;
  limit?: number;
}) {
  const currentProductNo = currentProduct.productNo == null ? "" : String(currentProduct.productNo);
  const fallback = createMockRelatedProducts(currentProduct, limit);
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    const products = memoryStore().products.get(keyFor(projectKey, mallId)) || [];
    const related = products
      .filter((item) => {
        const itemNo = item.productNo == null ? "" : String(item.productNo);
        return itemNo !== currentProductNo && item.name.toLowerCase() !== currentProduct.name.toLowerCase();
      })
      .slice(0, limit);

    return related.length > 0 ? related : fallback;
  }

  const installation = await ensureInstallation(projectKey, mallId);
  if (!installation.projectId) return fallback;

  const relatedQuery = supabase
    .from("products")
    .select("external_product_id,name,price,source_payload")
    .eq("project_id", installation.projectId)
    .limit(limit);

  if (currentProductNo) {
    relatedQuery.neq("external_product_id", currentProductNo);
  }

  const relatedResult = await relatedQuery;
  const rows = (relatedResult.data as Array<Record<string, unknown>> | null) || [];
  const related = rows
    .map((row) => {
      const externalProductId = String(row.external_product_id || "");
      const payload =
        row.source_payload && typeof row.source_payload === "object"
          ? (row.source_payload as Record<string, unknown>)
          : {};

      return {
        productNo: externalProductId,
        name: String(row.name || "추천 상품"),
        priceText:
          typeof row.price === "number" || typeof row.price === "string"
            ? `${row.price}`
            : currentProduct.priceText,
        imageUrl: typeof payload.image_url === "string" ? payload.image_url : undefined,
        url: createProductUrl(currentProduct.url, externalProductId),
        reviewSummary:
          typeof payload.review_summary === "string"
            ? payload.review_summary
            : "현재 보고 있는 상품과 함께 비교하기 좋은 상품입니다.",
        reviews: currentProduct.reviews,
      } satisfies OnsiteProductSource;
    })
    .filter((item) => item.productNo && item.name.toLowerCase() !== currentProduct.name.toLowerCase())
    .slice(0, limit);

  return related.length > 0 ? related : fallback;
}

export async function storeCafe24Token(input: Cafe24TokenInput) {
  const supabase = createServerSupabaseClient();

  if (!supabase || !canStoreEncryptedSecrets()) {
    memoryStore().cafe24Tokens.set(keyFor(input.projectKey, input.mallId), input);
    return { stored: "memory" as const };
  }

  const installation = await ensureInstallation(input.projectKey, input.mallId);
  const encryptedAccessToken = encryptSecret(input.accessToken);
  const encryptedRefreshToken = input.refreshToken ? encryptSecret(input.refreshToken) : null;

  if (!encryptedAccessToken) {
    memoryStore().cafe24Tokens.set(keyFor(input.projectKey, input.mallId), input);
    return { stored: "memory" as const };
  }

  const existing = await supabase
    .from("commerce_connections")
    .select("id,metadata")
    .eq("provider_name", "cafe24")
    .contains("metadata", { public_key: input.projectKey, mall_id: input.mallId })
    .maybeSingle();

  const payload = {
    project_id: installation.projectId ?? null,
    provider_name: "cafe24",
    status: "connected",
    credentials_ref: `encrypted:${input.mallId}`,
    metadata: {
      public_key: input.projectKey,
      mall_id: input.mallId,
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      expires_at: input.expiresAt,
      scopes: input.scopes,
    },
  };

  if (existing.data?.id) {
    await supabase.from("commerce_connections").update(payload).eq("id", existing.data.id);
  } else {
    await supabase.from("commerce_connections").insert(payload);
  }

  return { stored: "supabase" as const };
}

export async function getCafe24Token(projectKey: string, mallId: string) {
  const memoryToken = memoryStore().cafe24Tokens.get(keyFor(projectKey, mallId));
  const supabase = createServerSupabaseClient();

  if (!supabase) return memoryToken ?? null;

  const result = await supabase
    .from("commerce_connections")
    .select("metadata")
    .eq("provider_name", "cafe24")
    .contains("metadata", { public_key: projectKey, mall_id: mallId })
    .maybeSingle();

  const metadata = result.data?.metadata as Record<string, unknown> | undefined;
  const accessToken = decryptSecret(typeof metadata?.access_token === "string" ? metadata.access_token : null);

  if (!accessToken) return memoryToken ?? null;

  return {
    accessToken,
    refreshToken: decryptSecret(typeof metadata?.refresh_token === "string" ? metadata.refresh_token : null) ?? undefined,
    expiresAt: typeof metadata?.expires_at === "string" ? metadata.expires_at : undefined,
    scopes: Array.isArray(metadata?.scopes) ? metadata.scopes.map(String) : [],
  };
}

export async function storeSyncedProducts(sync: Cafe24SyncRequest, products: OnsiteProductSource[]) {
  const supabase = createServerSupabaseClient();
  const storeKey = keyFor(sync.projectKey, sync.mallId);

  memoryStore().products.set(storeKey, products);

  if (!supabase) return { stored: "memory" as const, productCount: products.length };

  const installation = await ensureInstallation(sync.projectKey, sync.mallId);
  if (!installation.projectId) return { stored: "memory" as const, productCount: products.length };

  for (const product of products) {
    await supabase.from("products").upsert(
      {
        project_id: installation.projectId,
        external_product_id: String(product.productNo || product.name),
        name: product.name,
        price: Number(String(product.priceText || "").replace(/[^0-9.]/g, "")) || null,
        source_payload: {
          image_url: product.imageUrl,
          review_summary: product.reviewSummary,
          mall_id: sync.mallId,
        },
      },
      { onConflict: "project_id,external_product_id" },
    );

    for (const review of product.reviews) {
      await supabase.from("product_reviews").insert({
        project_id: installation.projectId,
        external_product_id: String(product.productNo || product.name),
        rating: review.rating,
        content: review.content,
        source: "sync_seed",
      });
    }
  }

  return { stored: "supabase" as const, productCount: products.length };
}
function parseStringListFromSetting(value: unknown) {
  if (!value) return [];
  return parseStringArray(value).map((item) => item.trim());
}

function getInstallationAllowedOrigins(installation: InstallationRecord) {
  return parseStringListFromSetting(
    installation.allowedOrigins ??
      installation.settings?.allowed_origins ??
      installation.settings?.allowedOrigins ??
      installation.settings?.widget_allowed_origins ??
      installation.settings?.widgetAllowedOrigins ??
      [],
  );
}

function resolveAllowedOrigins({
  installation,
}: {
  installation: InstallationRecord;
}) {
  const envAllowedOrigins = parseStringArray(process.env.ONSITE_WIDGET_ALLOWED_ORIGINS);
  const fromInstallation = getInstallationAllowedOrigins(installation);
  return fromInstallation.length ? fromInstallation : envAllowedOrigins;
}

function isOriginAllowed(requestOrigin: string | null | undefined, allowedOrigins: string[], inProduction: boolean) {
  if (inProduction && (!requestOrigin || !allowedOrigins.length)) {
    return false;
  }

  if (!allowedOrigins.length) {
    return true;
  }

  if (!requestOrigin) {
    return true;
  }

  return allowedOrigins.includes("*") || allowedOrigins.includes(requestOrigin);
}

export async function validateOnsiteWidgetAuth({
  projectKey,
  mallId,
  widgetToken,
  requestOrigin,
}: {
  projectKey: string;
  mallId: string;
  widgetToken?: string;
  requestOrigin?: string | null;
}) {
  const installation = await ensureInstallation(projectKey, mallId);
  const allowedOrigins = resolveAllowedOrigins({ installation });
  const inProduction = process.env.NODE_ENV === "production";

  if ((installation.status || "active") !== "active") {
    return {
      ok: false,
      installation,
      reason: "installation_inactive",
    } as const;
  }

  if (DEFAULT_WIDGET_SECRET) {
    const expectedSecret = getWidgetSecretFromSettings(installation.settings) ?? DEFAULT_WIDGET_SECRET;
    const providedToken = widgetToken?.trim();

    if (!providedToken || !safeEqualsToken(providedToken, expectedSecret)) {
      return {
        ok: false,
        installation,
        reason: "invalid_widget_token",
      } as const;
    }
  }

  if (!isOriginAllowed(requestOrigin, allowedOrigins, inProduction)) {
    return {
      ok: false,
      installation,
      reason: inProduction && !requestOrigin ? "missing_origin" : "origin_not_allowed",
    } as const;
  }

  return { ok: true, installation } as const;
}
