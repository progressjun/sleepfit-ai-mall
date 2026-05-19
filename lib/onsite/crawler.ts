import { storeSyncedProducts } from "@/lib/onsite/storage";
import type { OnsiteProductSource, OnsiteReviewSource } from "./mock";
import type { Cafe24SyncRequest } from "./schemas";

interface CrawlTask {
  url: string;
  depth: number;
  attempts: number;
  nextAt: number;
}

interface CrawlState {
  queue: CrawlTask[];
  discovered: Set<string>;
  crawled: Set<string>;
  inFlight: Set<string>;
  active: boolean;
  processed: number;
  failed: number;
  discoveredTotal: number;
  lastFetchAt?: number;
  startedAt?: number;
  lastError?: string;
}

interface CrawlSummary {
  crawled: number;
  failed: number;
  queue: number;
  discoveredTotal: number;
  active: boolean;
}

interface CrawlConfig {
  maxDepth: number;
  queueLimit: number;
  batchSize: number;
  requestDelayMs: number;
  requestTimeoutMs: number;
  crawlIntervalMs: number;
  robotsTtlMs: number;
}

interface CrawlResult {
  productCount: number;
  discoveredCount: number;
  extracted: boolean;
  error?: string;
}

interface QueueSeed {
  projectKey: string;
  mallId: string;
  visitorId: string;
  sessionId: string;
  pageUrl: string;
  discoveredUrls: string[];
}

interface RobotsSnapshot {
  at: number;
  disallow: string[];
}

type ParsedMetaPayload = Record<string, unknown>;

const DEFAULT_CONFIG: CrawlConfig = {
  maxDepth: 3,
  queueLimit: 300,
  batchSize: 4,
  requestDelayMs: 700,
  requestTimeoutMs: 10_000,
  crawlIntervalMs: 800,
  robotsTtlMs: 60 * 60 * 1000,
};

const IGNORE_PATTERNS = [
  /\/(admin|member|my|member_|my_|order|checkout|cart|join|login|logout|search)/i,
  /\.(?:css|js|json|xml|png|jpg|jpeg|gif|webp|svg|woff2?)(?:$|\?)/i,
  /\.pdf(?:$|\?)/i,
];

const PRODUCT_PATH_HINTS = [
  /\/product\//i,
  /\/product\.html/i,
  /product_no=/i,
  /\/shop\/products?\//i,
];

const CRAWLER_GLOBAL = globalThis as typeof globalThis & {
  __slipAiCrawlerState?: Map<string, CrawlState>;
  __slipAiRobots?: Map<string, RobotsSnapshot>;
};

function clampLimit(value: number, fallback: number, min = 1) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.floor(value));
}

function normalizeNumberLike(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getCrawlerConfig(): CrawlConfig {
  const maxDepth = clampLimit(normalizeNumberLike(process.env.ONSITE_CRAWL_MAX_DEPTH, DEFAULT_CONFIG.maxDepth), DEFAULT_CONFIG.maxDepth, 1);
  const queueLimit = clampLimit(normalizeNumberLike(process.env.ONSITE_CRAWL_QUEUE_LIMIT, DEFAULT_CONFIG.queueLimit), DEFAULT_CONFIG.queueLimit);
  const batchSize = clampLimit(normalizeNumberLike(process.env.ONSITE_CRAWL_BATCH_SIZE, DEFAULT_CONFIG.batchSize), DEFAULT_CONFIG.batchSize);
  const requestDelayMs = clampLimit(
    normalizeNumberLike(process.env.ONSITE_CRAWL_REQUEST_DELAY_MS, DEFAULT_CONFIG.requestDelayMs),
    150,
  );
  const requestTimeoutMs = clampLimit(
    normalizeNumberLike(process.env.ONSITE_CRAWL_REQUEST_TIMEOUT_MS, DEFAULT_CONFIG.requestTimeoutMs),
    1_000,
  );
  const crawlIntervalMs = clampLimit(
    normalizeNumberLike(process.env.ONSITE_CRAWL_INTERVAL_MS, DEFAULT_CONFIG.crawlIntervalMs),
    200,
  );
  const robotsTtlMs = clampLimit(
    normalizeNumberLike(process.env.ONSITE_CRAWL_ROBOTS_TTL_MS, DEFAULT_CONFIG.robotsTtlMs),
    1,
  );

  return { maxDepth, queueLimit, batchSize, requestDelayMs, requestTimeoutMs, crawlIntervalMs, robotsTtlMs };
}

function queueKey(projectKey: string, mallId: string) {
  return `${projectKey}:${mallId}`;
}

function getCrawlerStates(): Map<string, CrawlState> {
  if (!CRAWLER_GLOBAL.__slipAiCrawlerState) {
    CRAWLER_GLOBAL.__slipAiCrawlerState = new Map();
  }
  return CRAWLER_GLOBAL.__slipAiCrawlerState;
}

function getRobotsCache(): Map<string, RobotsSnapshot> {
  if (!CRAWLER_GLOBAL.__slipAiRobots) {
    CRAWLER_GLOBAL.__slipAiRobots = new Map();
  }
  return CRAWLER_GLOBAL.__slipAiRobots;
}

function createState(projectKey: string, mallId: string) {
  const states = getCrawlerStates();
  const key = queueKey(projectKey, mallId);
  const existing = states.get(key);
  if (existing) {
    return existing;
  }

  const created: CrawlState = {
    queue: [],
    discovered: new Set(),
    crawled: new Set(),
    inFlight: new Set(),
    active: false,
    processed: 0,
    failed: 0,
    discoveredTotal: 0,
  };
  states.set(key, created);
  return created;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function trimText(value: string | null | undefined, limit: number) {
  if (!value) return "";
  if (value.length <= limit) return value;
  const trimmed = value.slice(0, Math.max(0, limit - 3)).trim();
  return `${trimmed}...`;
}

function normalizeUrlValue(raw: string) {
  try {
    const parsed = new URL(raw);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function normalizeCandidate(raw: string, baseUrl: string, nextDepth: number, maxDepth: number, origin: string) {
  if (!raw) return null;
  if (nextDepth > maxDepth) return null;

  try {
    const resolved = new URL(raw, baseUrl);
    if (resolved.origin !== origin) return null;
    if (resolved.protocol !== "https:" && resolved.protocol !== "http:") return null;

    const path = (resolved.pathname || "").toLowerCase();
    if (IGNORE_PATTERNS.some((pattern) => pattern.test(path))) return null;

    resolved.hash = "";
    return normalizeUrlValue(resolved.toString());
  } catch {
    return null;
  }
}

function looksLikeProductPath(url: string) {
  const lower = url.toLowerCase();
  return PRODUCT_PATH_HINTS.some((pattern) => pattern.test(lower));
}

function getProductNoFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    return (
      parsed.searchParams.get("product_no") ||
      parsed.searchParams.get("productNo") ||
      parsed.searchParams.get("product_id")
    );
  } catch {
    return null;
  }
}

function parseMetaContent(html: string, keys: string[]) {
  for (const key of keys) {
    const pattern = new RegExp(
      `<meta[^>]+(?:name|property)=["']${escapeRegExp(key)}["'][^>]*content=["']([^"']*?)["'][^>]*>`,
      "i",
    );
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return "";
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseJsonLdPayloads(html: string) {
  const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (!scripts) return [];

  const payloads: ParsedMetaPayload[] = [];

  for (const script of scripts) {
    const matched = script.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i,
    );
    if (!matched?.[1]) continue;

    try {
      const parsed = JSON.parse(matched[1].trim());
      if (Array.isArray(parsed)) {
        payloads.push(...parsed.filter((value) => value && typeof value === "object"));
      } else if (parsed && typeof parsed === "object") {
        payloads.push(parsed as ParsedMetaPayload);
      }
    } catch {
      // Ignore malformed JSON-LD.
    }
  }

  return payloads;
}

function parseRating(raw: unknown) {
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : 4;
  }

  if (typeof raw === "string") {
    const numeric = Number.parseFloat(raw.replace(/[^0-9.]/g, ""));
    return Number.isFinite(numeric) ? numeric : 4;
  }

  return 4;
}

function parseReviewRowsFromJsonLd(items: ParsedMetaPayload[]) {
  const reviews: OnsiteReviewSource[] = [];

  for (const item of items) {
    const rawReviews = item.review;
    const reviewItems = Array.isArray(rawReviews) ? rawReviews : rawReviews ? [rawReviews] : [];

    for (const review of reviewItems) {
      if (!review || typeof review !== "object") continue;
      const candidate = review as ParsedMetaPayload;

      const reviewText =
        typeof candidate.reviewBody === "string"
          ? candidate.reviewBody
          : typeof candidate.description === "string"
            ? candidate.description
            : typeof candidate.text === "string"
              ? candidate.text
              : "";
      if (!reviewText.trim()) continue;

      const ratingRaw = candidate.reviewRating
        ? (candidate.reviewRating as ParsedMetaPayload).ratingValue ?? candidate.rating
        : candidate.rating;
      const createdAt = typeof candidate.datePublished === "string" ? candidate.datePublished : undefined;
      const numericRating = parseRating(ratingRaw);

      reviews.push({
        rating: Math.max(1, Math.min(5, Math.round(numericRating))),
        content: trimText(reviewText, 280),
        createdAt,
      });
    }
  }

  return reviews;
}

function parseReviewsAndSummary(payloads: ParsedMetaPayload[]) {
  const reviews = parseReviewRowsFromJsonLd(payloads);
  const summaryPayload = payloads.find((item) => item["description"] && typeof item["description"] === "string");
  const summary =
    typeof summaryPayload?.["description"] === "string" ? trimText(summaryPayload["description"] as string, 220) : "";
  return { reviews, summary };
}

function parseProductFromJsonLd(item: ParsedMetaPayload) {
  const asObject = item as Record<string, unknown>;
  const type = String(asObject["@type"] || "").toLowerCase();
  if (!type.includes("product")) return null;

  const name = typeof asObject.name === "string" ? asObject.name : null;
  const sku = typeof asObject.sku === "string" ? asObject.sku : typeof asObject.productID === "string" ? asObject.productID : undefined;
  const gtin =
    typeof asObject.gtin13 === "string"
      ? asObject.gtin13
      : typeof asObject.gtin14 === "string"
        ? asObject.gtin14
        : undefined;
  const imageField = asObject.image;
  const image =
    typeof imageField === "string"
      ? imageField
      : Array.isArray(imageField) && typeof imageField[0] === "string"
        ? imageField[0]
        : "";

  const offers = asObject.offers;
  const offer = offers && typeof offers === "object" ? (offers as ParsedMetaPayload) : null;
  const priceFromOffers = offer ? String(offer.price || offer.lowPrice || offer.highPrice || "") : "";
  const productNo = sku || gtin || undefined;

  if (!name) return null;

  const payloads = parseReviewsAndSummary([asObject]);
  const summary = payloads.summary || "";

  return {
    productNo,
    name: trimText(name, 180),
    imageUrl: normalizeUrlValue(image),
    priceText: trimText(priceFromOffers, 80) || undefined,
    reviewSummary: summary || undefined,
    reviews: payloads.reviews,
  } satisfies Partial<OnsiteProductSource>;
}

function parseProductFromHtml(url: string, html: string) {
  const payloads = parseJsonLdPayloads(html);
  const productLd = payloads.find((item) => {
    const rawType = `${item["@type"] || ""}`.toLowerCase();
    return /product/.test(rawType);
  });
  const parsedFromLd = productLd ? parseProductFromJsonLd(productLd) : null;

  const fallbackName =
    parseMetaContent(html, ["og:title", "twitter:title", "product_name"]) ||
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ||
    "";

  const fallbackImage =
    parseMetaContent(html, ["og:image", "twitter:image"]) || "";
  const name = trimText((parsedFromLd?.name || fallbackName || "").trim(), 180);
  const priceText = trimText(parsedFromLd?.priceText || parsePriceFromPage(html) || "", 80);

  if (!name) return null;
  if (!looksLikeProductPath(url) && !getProductNoFromUrl(url)) return null;

  const allReviews = parsedFromLd?.reviews || parseReviewRowsFromJsonLd(payloads);
  const summary = parsedFromLd?.reviewSummary || parseReviewsAndSummary(payloads).summary || "";
  const imageUrl = normalizeUrlValue((parsedFromLd as { imageUrl?: string }).imageUrl || fallbackImage);
  const productNo = parsedFromLd?.productNo || getProductNoFromUrl(url) || undefined;

  return {
    productNo,
    name,
    imageUrl: imageUrl || undefined,
    priceText: priceText || undefined,
    reviewSummary: trimText(summary, 240) || undefined,
    reviews: allReviews.length > 0
      ? allReviews
      : [
          {
            rating: 5,
            content: "Customers often report good quality and practical value in real use.",
            createdAt: undefined,
          },
        ],
  } as OnsiteProductSource;
}

function parsePriceFromPage(html: string) {
  const direct =
    parseMetaContent(html, ["product:price:amount", "og:price:amount", "product:price"]) ||
    parseMetaContent(html, ["price"]) ||
    parseMetaContent(html, ["og:description"]);

  if (!direct) {
    const scriptMatch = html.match(/["'](?:price|salePrice)["']\s*:\s*(\d+(?:\.\d+)?)/i);
    if (scriptMatch?.[1]) return trimText(scriptMatch[1], 80);
    return undefined;
  }

  const value = direct.match(/(\d[\d,.]*)/);
  return value ? trimText(value[1], 80) : trimText(direct, 80);
}

function parseCandidateLinks(html: string, seedUrl: string, nextDepth: number, maxDepth: number) {
  const base = new URL(seedUrl);
  const urlPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>/gi;
  const discovered = [];
  const dedup = new Set<string>();
  let match: RegExpExecArray | null = null;

  while ((match = urlPattern.exec(html)) !== null) {
    const raw = match[1]?.trim();
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) continue;

    const normalized = normalizeCandidate(raw, seedUrl, nextDepth, maxDepth, base.origin);
    if (!normalized) continue;
    if (!dedup.has(normalized)) {
      dedup.add(normalized);
      discovered.push(normalized);
    }
  }

  const prioritized = discovered.filter((item) => looksLikeProductPath(item));
  return (prioritized.length ? prioritized : discovered).slice(0, 120);
}

function parseRobotsDisallow(content: string) {
  const lines = content.split(/\r?\n/).map((line) => line.trim().toLowerCase());
  const disallow: string[] = [];
  let activeAgent = false;

  for (const line of lines) {
    if (!line) continue;
    const noComment = line.split("#")[0].trim();
    if (!noComment) continue;

    const [key, rawValue] = noComment.split(":");
    if (!rawValue) continue;
    const value = rawValue.trim();
    if (!value) continue;

    if (key === "user-agent") {
      const agent = value.toLowerCase();
      activeAgent = agent === "*" || agent === "slipai" || agent === "gptbot";
      continue;
    }

    if (activeAgent && key.toLowerCase() === "disallow") {
      disallow.push(value);
    }
  }

  return disallow;
}

function isRobotsAllowed(robots: string[], candidate: string) {
  if (!robots.length) return true;
  return !robots.some((rule) => candidate.startsWith(rule) && rule.length > 0);
}

async function canVisit(candidate: string) {
  const parsed = new URL(candidate);
  const key = parsed.host;
  const cache = getRobotsCache();
  const config = getCrawlerConfig();
  const now = Date.now();

  const cached = cache.get(key);
  if (cached && now - cached.at < config.robotsTtlMs) {
    return isRobotsAllowed(cached.disallow, `${parsed.pathname}${parsed.search}`);
  }

  try {
    const response = await fetch(`${parsed.origin}/robots.txt`, { method: "GET" });
    if (!response.ok) {
      cache.set(key, { at: now, disallow: [] });
      return true;
    }

    const body = await response.text();
    const disallow = parseRobotsDisallow(body);
    cache.set(key, { at: now, disallow });
    return isRobotsAllowed(disallow, `${parsed.pathname}${parsed.search}`);
  } catch {
    cache.set(key, { at: now, disallow: [] });
    return true;
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": "SlipAI-OnsiteCrawler/1.0" },
      signal: controller.signal,
    });

    if (!response.ok) return { ok: false, status: response.status, html: "" };
    const html = await response.text();
    return { ok: true, status: response.status, html };
  } finally {
    clearTimeout(timer);
  }
}

function persistProduct(syncContext: { projectKey: string; mallId: string }, product: OnsiteProductSource) {
  const request: Cafe24SyncRequest = {
    projectKey: syncContext.projectKey,
    mallId: syncContext.mallId,
    limit: 1,
    reviewSeeds: product.reviews.map((review) => ({
      productNo: product.productNo || `${product.name}-review`,
      rating: review.rating,
      content: review.content,
    })),
  };
  return storeSyncedProducts(request, [product]);
}

function enqueueUrlsForState(state: CrawlState, seed: string[], depth: number) {
  const config = getCrawlerConfig();
  let enqueued = 0;

  for (const raw of seed) {
    if (state.discovered.size + state.queue.length >= config.queueLimit) break;
    if (state.discovered.has(raw) || state.crawled.has(raw) || state.inFlight.has(raw)) continue;
    if (state.queue.some((task) => task.url === raw)) continue;

    state.discovered.add(raw);
    state.queue.push({ url: raw, depth, attempts: 0, nextAt: 0 });
    enqueued += 1;
  }

  state.discoveredTotal = Math.max(state.discoveredTotal, state.discovered.size);
  return enqueued;
}

async function crawlPage(projectKey: string, mallId: string, task: CrawlTask): Promise<CrawlResult> {
  const state = createState(projectKey, mallId);
  const config = getCrawlerConfig();

  const elapsed = Date.now() - (state.lastFetchAt || 0);
  if (elapsed < config.requestDelayMs) {
    await sleep(config.requestDelayMs - elapsed);
  }
  state.lastFetchAt = Date.now();

  const allowed = await canVisit(task.url);
  if (!allowed) {
    return { productCount: 0, discoveredCount: 0, extracted: false, error: "robots_disallowed" };
  }

  const response = await fetchWithTimeout(task.url, config.requestTimeoutMs);
  if (!response.ok) {
    return {
      productCount: 0,
      discoveredCount: 0,
      extracted: false,
      error: `http_${response.status}`,
    };
  }

  const parsedProduct = parseProductFromHtml(task.url, response.html);
  let productCount = 0;
  if (parsedProduct) {
    await persistProduct({ projectKey, mallId }, parsedProduct);
    productCount += 1;
  }

  const nextDepth = task.depth + 1;
  const discovered = parseCandidateLinks(response.html, task.url, nextDepth, getCrawlerConfig().maxDepth);
  const discoveredCount = enqueueUrlsForState(state, discovered, nextDepth);
  return {
    productCount,
    discoveredCount,
    extracted: productCount > 0,
  };
}

export async function processCrawlQueue(projectKey: string, mallId: string, maxTasks?: number) {
  const state = createState(projectKey, mallId);
  if (state.active) return;
  state.active = true;
  state.startedAt = Date.now();

  const config = getCrawlerConfig();
  const taskLimit = clampLimit(maxTasks ?? config.batchSize, config.batchSize);
  let processed = 0;

  try {
    while (processed < taskLimit && state.queue.length > 0) {
      const now = Date.now();
      const taskIndex = state.queue.findIndex((task) => task.nextAt <= now && !state.inFlight.has(task.url));
      if (taskIndex < 0) {
        await sleep(config.crawlIntervalMs);
        continue;
      }

      const task = state.queue.splice(taskIndex, 1)[0];
      if (state.crawled.has(task.url)) continue;

      state.inFlight.add(task.url);
      try {
        const result = await crawlPage(projectKey, mallId, task);
        if (result.extracted) {
          state.processed += result.productCount;
        }

        state.discoveredTotal += result.discoveredCount;
        if (result.error) {
          state.failed += 1;
          state.lastError = result.error;
        }
      } catch (error) {
        state.failed += 1;
        state.lastError = error instanceof Error ? error.message : "crawl_error";
        if (task.attempts < 2) {
          task.attempts += 1;
          task.nextAt = Date.now() + 5_000 * task.attempts;
          state.queue.push(task);
        }
      } finally {
        state.inFlight.delete(task.url);
        state.crawled.add(task.url);
      }

      processed += 1;
      await sleep(config.requestDelayMs);
    }
  } finally {
    state.active = false;
  }
}

export function getCrawlSummary(projectKey: string, mallId: string): CrawlSummary | null {
  const state = getCrawlerStates().get(queueKey(projectKey, mallId));
  if (!state) return null;

  return {
    crawled: state.processed,
    failed: state.failed,
    queue: state.queue.length,
    discoveredTotal: state.discoveredTotal,
    active: state.active,
  };
}

export function getQueuedUrlCount(projectKey: string, mallId: string) {
  const state = getCrawlerStates().get(queueKey(projectKey, mallId));
  return state ? state.queue.length : 0;
}

export function enqueueDiscoveryUrls(seed: QueueSeed) {
  const state = createState(seed.projectKey, seed.mallId);
  const config = getCrawlerConfig();
  const normalized = new Set<string>();
  const origin = new URL(seed.pageUrl).origin;

  const candidates = [seed.pageUrl, ...seed.discoveredUrls];

  for (const raw of candidates) {
    const normalizedUrl = normalizeCandidate(raw, seed.pageUrl, 0, config.maxDepth, origin);
    if (!normalizedUrl) continue;
    normalized.add(normalizedUrl);
  }

  const list = Array.from(normalized).slice(0, config.queueLimit);
  const discoveredCount = enqueueUrlsForState(state, list, 0);

  return {
    queued: discoveredCount,
    queue: state.queue.length,
    discoveredTotal: state.discoveredTotal,
  };
}

export function triggerCrawlPump(projectKey: string, mallId: string, maxTasks?: number) {
  void processCrawlQueue(projectKey, mallId, maxTasks);
}
