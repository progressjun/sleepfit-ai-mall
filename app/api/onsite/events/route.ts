import { NextResponse } from "next/server";
import { corsHeaders, optionsResponse } from "@/lib/onsite/cors";
import { applyOnsiteRateLimit, rateLimitHeaders } from "@/lib/onsite/rate-limit";
import { onsiteEventRequestSchema } from "@/lib/onsite/schemas";
import { recordOnsiteEvent, validateOnsiteWidgetAuth } from "@/lib/onsite/storage";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function POST(request: Request) {
  const parsed = onsiteEventRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid onsite event payload." },
      { status: 400, headers: corsHeaders(request) },
    );
  }

  const rateLimit = applyOnsiteRateLimit({
    route: "events",
    request,
    projectKey: parsed.data.projectKey,
    mallId: parsed.data.mallId,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, message: "Too many onsite event requests. Please try again shortly." },
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

  const result = await recordOnsiteEvent(parsed.data);

  return NextResponse.json(
    {
      ok: true,
      ...result,
    },
    { headers: { ...corsHeaders(request), ...rateLimitHeaders(rateLimit) } },
  );
}
