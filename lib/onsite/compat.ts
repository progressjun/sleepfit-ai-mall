import type { OnsiteChatRequest, OnsiteEventRequest, OnsiteProductContext } from "./schemas";

const DEFAULT_PROJECT_KEY = process.env.NEXT_PUBLIC_SLIPAI_DEFAULT_PROJECT_KEY?.trim() || "pk_slipai_test";
const DEFAULT_MALL_ID = process.env.NEXT_PUBLIC_SLIPAI_DEFAULT_MALL_ID?.trim() || "slipai-test-kr";

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function sanitizeId(value: string, fallback: string) {
  const cleaned = value
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
  return cleaned || fallback;
}

function normalizeUrl(value: string, fallback: string) {
  try {
    return new URL(value || fallback).toString();
  } catch {
    return fallback;
  }
}

function normalizeReferrer(value: string) {
  if (!value) return "";
  try {
    return new URL(value).toString();
  } catch {
    return "";
  }
}

function inferPageType(path: string, pageUrl: string): OnsiteProductContext["pageType"] {
  const haystack = `${path} ${pageUrl}`;
  if (/\/product\/|product_no=|productNo=|product_id=/i.test(haystack)) return "product_detail";
  if (/\/cart|\/basket/i.test(haystack)) return "cart";
  if (/\/order|\/checkout/i.test(haystack)) return "checkout";
  if (/\/category|\/collection|\/collections|\/search|\/shop|\/list|cate_no=|keyword=/i.test(haystack)) {
    return "collection";
  }
  try {
    const parsed = new URL(pageUrl);
    if (parsed.pathname === "/" || /^\/index\.html?$/i.test(parsed.pathname)) return "home";
  } catch {
    // Keep fallback below.
  }
  return "other";
}

export function normalizeCompatSite(body: Record<string, unknown>) {
  const siteId = stringValue(body.siteId || body.site_id || body.clientSiteId || body.mallId);
  const explicitProjectKey = stringValue(body.projectKey || body.project_key);
  const explicitMallId = stringValue(body.mallId || body.mall_id);
  const siteLooksLikeProjectKey = /^pk_[A-Za-z0-9_-]+$/.test(siteId);
  const projectKey = explicitProjectKey || (siteLooksLikeProjectKey ? siteId : DEFAULT_PROJECT_KEY);
  const mallId = explicitMallId || (siteLooksLikeProjectKey ? DEFAULT_MALL_ID : sanitizeId(siteId, DEFAULT_MALL_ID));

  return {
    siteId: siteId || mallId,
    projectKey,
    mallId,
    widgetToken: stringValue(body.widgetToken || body.widget_token || body.token),
  };
}

export function normalizeCompatPage(body: Record<string, unknown>) {
  const fallbackUrl = "https://slipai-compat.local/";
  const pageUrl = normalizeUrl(stringValue(body.pageUrl || body.page_url || body.url), fallbackUrl);
  const parsed = new URL(pageUrl);
  const path = stringValue(body.path) || `${parsed.pathname}${parsed.search}`;

  return {
    url: pageUrl,
    referrer: normalizeReferrer(stringValue(body.referrer)),
    title: stringValue(body.title || objectValue(body.productContext).title).slice(0, 240) || undefined,
    viewport: undefined,
    path,
  };
}

export function normalizeCompatProduct(body: Record<string, unknown>): OnsiteProductContext {
  const page = normalizeCompatPage(body);
  const productContext = objectValue(body.productContext || body.product_context || body.product);
  const name = stringValue(
    productContext.productName ||
      productContext.name ||
      productContext.title ||
      productContext.h1 ||
      body.productName ||
      body.title,
  );
  const priceText = stringValue(productContext.priceText || productContext.price || body.priceText || body.price);
  const category = stringValue(productContext.category || body.category);
  const productNo = stringValue(productContext.productNo || productContext.productId || body.productNo || body.productId);
  const imageUrl = stringValue(productContext.imageUrl || body.imageUrl);
  const pageType = inferPageType(page.path, page.url);

  return {
    pageType,
    productNo: productNo || undefined,
    productId: stringValue(productContext.productId || body.productId) || undefined,
    name: name || undefined,
    priceText: priceText || undefined,
    category: category || undefined,
    imageUrl: imageUrl || undefined,
    url: page.url,
  };
}

export function normalizeCompatBase(body: Record<string, unknown>) {
  const site = normalizeCompatSite(body);
  const page = normalizeCompatPage(body);
  const visitorId = sanitizeId(stringValue(body.visitorId || body.visitor_id), `v_${Date.now()}`);
  const sessionId = sanitizeId(stringValue(body.sessionId || body.session_id), `s_${Date.now()}`);

  return {
    projectKey: site.projectKey,
    mallId: site.mallId,
    widgetToken: site.widgetToken || undefined,
    visitorId,
    sessionId,
    page: {
      url: page.url,
      referrer: page.referrer,
      title: page.title,
    },
  };
}

export function normalizeCompatEventName(eventName: string) {
  const normalized = eventName.trim();
  const map: Record<string, string> = {
    banner_impression: "impression",
    banner_click: "click",
    banner_close: "close",
    chat_message_sent: "chat_message",
    chat_answer_generated: "chat_answer_generated",
  };
  return map[normalized] || normalized || "page_view";
}

export function toCompatOnsiteEvent(body: Record<string, unknown>): OnsiteEventRequest {
  const base = normalizeCompatBase(body);
  const payload = objectValue(body.payload || body.metadata);

  return {
    ...base,
    eventName: normalizeCompatEventName(stringValue(body.eventName || body.event_name)) as OnsiteEventRequest["eventName"],
    product: normalizeCompatProduct(body),
    metadata: {
      ...payload,
      compatSiteId: normalizeCompatSite(body).siteId,
      revenue: body.revenue ?? payload.revenue,
    },
    occurredAt: stringValue(body.timestamp || body.occurredAt || body.created_at) || new Date().toISOString(),
  };
}

export function toCompatOnsiteChat(body: Record<string, unknown>): OnsiteChatRequest {
  const base = normalizeCompatBase(body);
  return {
    ...base,
    conversationId: stringValue(body.conversationId || body.conversation_id || body.sessionId || body.session_id) || undefined,
    message: stringValue(body.message),
    product: normalizeCompatProduct(body),
  };
}
