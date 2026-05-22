import { NextResponse } from "next/server";
import { POST as postOnsiteEvent } from "@/app/api/onsite/events/route";
import { corsHeaders, optionsResponse } from "@/lib/onsite/cors";
import { toCompatOnsiteEvent } from "@/lib/onsite/compat";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}

function requestWithJson(request: Request, payload: unknown) {
  const headers = new Headers(request.headers);
  headers.set("Content-Type", "application/json");

  return new Request(request.url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { ok: false, message: "Invalid event payload." },
      { status: 400, headers: corsHeaders(request) },
    );
  }

  return postOnsiteEvent(requestWithJson(request, toCompatOnsiteEvent(body as Record<string, unknown>)));
}
