type SleepfitRoute = "recommend" | "events";

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

const DEFAULT_ALLOWED_ORIGINS = [
  "https://sleepnsleepmall.com",
  "https://www.sleepnsleepmall.com",
  "https://sleepnsleepmall.co.kr",
  "https://www.sleepnsleepmall.co.kr",
  "https://sleepnsleepmall.cafe24.com",
];
const buckets = new Map<string, RateLimitState>();
const MAX_BUCKETS = 20_000;

function configuredOrigins() {
  return (process.env.SLEEPFIT_ALLOWED_ORIGINS || process.env.ONSITE_WIDGET_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getSleepfitCorsOrigin(request: Request) {
  const origin = request.headers.get("origin") || "*";
  const configured = configuredOrigins();
  const allowed = configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS;

  if (process.env.NODE_ENV !== "production" && configured.length === 0) return "*";
  if (allowed.includes("*")) return "*";
  if (allowed.includes(origin)) return origin;
  return allowed[0] || "*";
}

export function sleepfitCorsHeaders(request: Request) {
  return {
    "Access-Control-Allow-Origin": getSleepfitCorsOrigin(request),
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-SleepFit-Version",
    "Access-Control-Max-Age": "86400",
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(),camera=(),microphone=(),payment=(),usb=(),interest-cohort=()",
    "X-Content-Type-Options": "nosniff",
    Vary: "Origin",
  };
}

export function sleepfitOptionsResponse(request: Request) {
  return new Response(null, {
    status: 204,
    headers: sleepfitCorsHeaders(request),
  });
}

function clampPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value || "");
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function clientIp(request: Request) {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp?.trim()) return cfIp.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function limitFor(route: SleepfitRoute) {
  if (route === "recommend") return clampPositiveInteger(process.env.SLEEPFIT_RATE_LIMIT_RECOMMEND, 120);
  return clampPositiveInteger(process.env.SLEEPFIT_RATE_LIMIT_EVENTS, 1000);
}

export function applySleepfitRateLimit({
  route,
  mallId,
  request,
}: {
  route: SleepfitRoute;
  mallId: string;
  request: Request;
}): RateLimitResult {
  const windowMs = clampPositiveInteger(process.env.SLEEPFIT_RATE_LIMIT_WINDOW_MS, 60_000);
  const limit = limitFor(route);
  const now = Date.now();
  const key = `${route}:${mallId}:${clientIp(request)}`;

  if (buckets.size > MAX_BUCKETS) {
    for (const [bucketKey, bucket] of buckets.entries()) {
      if (now - bucket.windowStart > windowMs * 2) buckets.delete(bucketKey);
    }
  }

  const existing = buckets.get(key);
  if (!existing || now - existing.windowStart >= windowMs) {
    buckets.set(key, { windowStart: now, count: 1 });
    return {
      ok: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt: now + windowMs,
      windowMs,
    };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      limit,
      remaining: 0,
      resetAt: existing.windowStart + windowMs,
      windowMs,
    };
  }

  existing.count += 1;
  return {
    ok: true,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.windowStart + windowMs,
    windowMs,
  };
}

export function sleepfitRateLimitHeaders(result: Pick<RateLimitResult, "limit" | "remaining" | "resetAt" | "windowMs">) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    "Retry-After": String(Math.ceil(result.windowMs / 1000)),
  };
}
