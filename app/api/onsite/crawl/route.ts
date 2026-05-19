import { NextResponse } from "next/server";
import { z } from "zod";
import { corsHeaders, optionsResponse } from "@/lib/onsite/cors";
import { applyOnsiteRateLimit, rateLimitHeaders } from "@/lib/onsite/rate-limit";
import { getCrawlSummary, processCrawlQueue } from "@/lib/onsite/crawler";
import { validateOnsiteWidgetAuth } from "@/lib/onsite/storage";
import { onsiteProjectKeySchema } from "@/lib/onsite/schemas";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

const crawlRequestSchema = z.object({
  projectKey: onsiteProjectKeySchema,
  mallId: z.string().min(2).max(80),
  widgetToken: z.string().max(512).optional(),
  maxTasks: z.coerce.number().int().min(1).max(200).optional(),
});

function parseCrawlRequest(request: Request) {
  if (request.method === "GET") {
    const url = new URL(request.url);
    const result = crawlRequestSchema.safeParse({
      projectKey: url.searchParams.get("projectKey"),
      mallId: url.searchParams.get("mallId"),
      widgetToken: url.searchParams.get("widgetToken") || undefined,
      maxTasks: url.searchParams.get("maxTasks") || undefined,
    });
    return result;
  }

  return crawlRequestSchema.safeParse(Object.fromEntries([]) as Record<string, unknown>);
}

async function readPostBody(request: Request) {
  const body = await request.json().catch(() => null);
  const result = crawlRequestSchema.safeParse(body);
  return result;
}

export async function GET(request: Request) {
  const parsed = parseCrawlRequest(request);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid crawl request." },
      { status: 400, headers: corsHeaders(request) },
    );
  }

  return handleCrawl(request, parsed.data);
}

export async function POST(request: Request) {
  const parsed = await readPostBody(request);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid crawl request." },
      { status: 400, headers: corsHeaders(request) },
    );
  }

  return handleCrawl(request, parsed.data);
}

async function handleCrawl(request: Request, data: z.infer<typeof crawlRequestSchema>) {
  const rateLimit = applyOnsiteRateLimit({
    route: "crawl",
    request,
    projectKey: data.projectKey,
    mallId: data.mallId,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, message: "Too many crawl requests. Please try again shortly." },
      { status: 429, headers: { ...corsHeaders(request), ...rateLimitHeaders(rateLimit) } },
    );
  }

  const auth = await validateOnsiteWidgetAuth({
    projectKey: data.projectKey,
    mallId: data.mallId,
    widgetToken: data.widgetToken,
    requestOrigin: request.headers.get("origin"),
  });
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: `Unauthorized: ${auth.reason}` },
      { status: 401, headers: { ...corsHeaders(request), ...rateLimitHeaders(rateLimit) } },
    );
  }

  await processCrawlQueue(data.projectKey, data.mallId, data.maxTasks);

  return NextResponse.json(
    { ok: true, data: getCrawlSummary(data.projectKey, data.mallId) },
    { headers: { ...corsHeaders(request), ...rateLimitHeaders(rateLimit) } },
  );
}
