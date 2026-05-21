import { NextResponse } from "next/server";
import { z } from "zod";
import { getCrawlSummary } from "@/lib/onsite/crawler";
import { corsHeaders, optionsResponse } from "@/lib/onsite/cors";
import { onsiteProjectKeySchema } from "@/lib/onsite/schemas";
import { getOnsiteOpsSummary, validateOnsiteWidgetAuth } from "@/lib/onsite/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const opsRequestSchema = z.object({
  projectKey: onsiteProjectKeySchema,
  mallId: z.string().min(2).max(80),
  widgetToken: z.string().max(512).optional(),
});

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = opsRequestSchema.safeParse({
    projectKey: url.searchParams.get("projectKey"),
    mallId: url.searchParams.get("mallId"),
    widgetToken: url.searchParams.get("widgetToken") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid onsite ops request." },
      { status: 400, headers: corsHeaders(request) },
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
      { status: 401, headers: corsHeaders(request) },
    );
  }

  const summary = await getOnsiteOpsSummary({
    projectKey: parsed.data.projectKey,
    mallId: parsed.data.mallId,
  });
  const crawlSummary = getCrawlSummary(parsed.data.projectKey, parsed.data.mallId) ?? {
    crawled: 0,
    failed: 0,
    queue: 0,
    discoveredTotal: 0,
    active: false,
  };

  return NextResponse.json(
    {
      ok: true,
      data: {
        ...summary,
        crawlSummary,
      },
    },
    { headers: corsHeaders(request) },
  );
}
