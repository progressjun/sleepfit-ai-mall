interface RateLimitState {
  windowStart: number;
  count: number;
}

interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  windowMs: number;
}

type OnsiteRoute = "events" | "recommendation" | "chat";

interface CheckOptions {
  route: OnsiteRoute;
  projectKey: string;
  mallId: string;
  request: Request;
}

const rateLimitBuckets = new Map<string, RateLimitState>();
const MAX_BUCKETS = 40_000;

const envLimitDefaults: Record<OnsiteRoute, number> = {
  events: 600,
  recommendation: 80,
  chat: 120,
};

function clampRateLimit(value: number, fallback: number) {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(1, Math.floor(value));
}

function getRateLimitConfig() {
  const windowMs = clampRateLimit(Number(process.env.ONSITE_RATE_LIMIT_WINDOW_MS || "60000"), 60_000);
  const events = clampRateLimit(Number(process.env.ONSITE_RATE_LIMIT_EVENTS || envLimitDefaults.events.toString()), envLimitDefaults.events);
  const recommendation = clampRateLimit(
    Number(process.env.ONSITE_RATE_LIMIT_RECOMMENDATION || envLimitDefaults.recommendation.toString()),
    envLimitDefaults.recommendation,
  );
  const chat = clampRateLimit(Number(process.env.ONSITE_RATE_LIMIT_CHAT || envLimitDefaults.chat.toString()), envLimitDefaults.chat);

  return {
    windowMs,
    limits: {
      events,
      recommendation,
      chat,
    } satisfies Record<OnsiteRoute, number>,
  };
}

function clientIpFromRequest(request: Request) {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim()) return cfIp.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

function getBucketKey(route: OnsiteRoute, projectKey: string, mallId: string, request: Request) {
  return `${route}:${projectKey}:${mallId}:${clientIpFromRequest(request)}`;
}

function checkRateLimit(route: OnsiteRoute, projectKey: string, mallId: string, request: Request): RateLimitResult {
  const config = getRateLimitConfig();
  const limit = config.limits[route];
  const now = Date.now();
  const key = getBucketKey(route, projectKey, mallId, request);
  if (rateLimitBuckets.size > MAX_BUCKETS) {
    for (const [bucketKey, bucket] of rateLimitBuckets.entries()) {
      if (now - bucket.windowStart > config.windowMs * 2) rateLimitBuckets.delete(bucketKey);
    }
  }
  const existing = rateLimitBuckets.get(key);

  if (!existing || now - existing.windowStart >= config.windowMs) {
    const entry = { windowStart: now, count: 1 };
    rateLimitBuckets.set(key, entry);
    return {
      ok: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt: now + config.windowMs,
      windowMs: config.windowMs,
    };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      limit,
      remaining: 0,
      resetAt: existing.windowStart + config.windowMs,
      windowMs: config.windowMs,
    };
  }

  existing.count += 1;
  return {
    ok: true,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.windowStart + config.windowMs,
    windowMs: config.windowMs,
  };
}

export function applyOnsiteRateLimit(options: CheckOptions): RateLimitResult {
  return checkRateLimit(options.route, options.projectKey, options.mallId, options.request);
}

export function rateLimitHeaders(result: Pick<RateLimitResult, "limit" | "remaining" | "resetAt" | "windowMs">) {
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));

  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    "Retry-After": String(result.limit === 0 ? retryAfter : Math.ceil(result.windowMs / 1000)),
  };
}
