import { NextResponse } from "next/server";
import { corsHeaders, optionsResponse } from "@/lib/onsite/cors";
import { applyOnsiteRateLimit, rateLimitHeaders } from "@/lib/onsite/rate-limit";
import { enqueueDiscoveryUrls, getCrawlSummary, triggerCrawlPump } from "@/lib/onsite/crawler";
import { onsiteDiscoveryRequestSchema } from "@/lib/onsite/schemas";
import { validateOnsiteWidgetAuth } from "@/lib/onsite/storage";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

function normalizeLimit() {
  const raw = Number(process.env.ONSITE_DISCOVERY_PUMP_MAX_TASKS || "0");
  if (!Number.isFinite(raw) || raw <= 0) return undefined;
  return Math.max(1, Math.min(20, Math.floor(raw)));
}

export async function POST(request: Request) {
  const parsed = onsiteDiscoveryRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid discovery payload." },
      { status: 400, headers: corsHeaders(request) },
    );
  }

  const rateLimit = applyOnsiteRateLimit({
    route: "discovery",
    request,
    projectKey: parsed.data.projectKey,
    mallId: parsed.data.mallId,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, message: "Too many discovery requests. Please try again shortly." },
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

  const enqueueResult = enqueueDiscoveryUrls({
    projectKey: parsed.data.projectKey,
    mallId: parsed.data.mallId,
    visitorId: parsed.data.visitorId,
    sessionId: parsed.data.sessionId,
    pageUrl: parsed.data.pageUrl,
    discoveredUrls: parsed.data.discoveredUrls,
  });

  triggerCrawlPump(parsed.data.projectKey, parsed.data.mallId, normalizeLimit());

  return NextResponse.json(
    {
      ok: true,
      data: {
        queued: enqueueResult.queued,
        queueDepth: enqueueResult.queue,
        discoveredTotal: enqueueResult.discoveredTotal,
        crawlSummary: getCrawlSummary(parsed.data.projectKey, parsed.data.mallId),
      },
    },
    { headers: { ...corsHeaders(request), ...rateLimitHeaders(rateLimit) } },
  );
}
