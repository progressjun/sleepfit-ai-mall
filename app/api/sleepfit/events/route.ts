import { NextResponse } from "next/server";
import { recordSleepfitEvent } from "@/lib/sleepfit/events";
import {
  applySleepfitRateLimit,
  sleepfitCorsHeaders,
  sleepfitOptionsResponse,
  sleepfitRateLimitHeaders,
} from "@/lib/sleepfit/http";
import { sleepfitEventRequestSchema } from "@/lib/sleepfit/schemas";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return sleepfitOptionsResponse(request);
}

export async function POST(request: Request) {
  const parsed = sleepfitEventRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid SleepFit event payload." },
      { status: 400, headers: sleepfitCorsHeaders(request) },
    );
  }

  const rateLimit = applySleepfitRateLimit({
    route: "events",
    request,
    mallId: parsed.data.mallId,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, message: "Too many SleepFit event requests. Please try again shortly." },
      { status: 429, headers: { ...sleepfitCorsHeaders(request), ...sleepfitRateLimitHeaders(rateLimit) } },
    );
  }

  const result = recordSleepfitEvent(parsed.data);

  return NextResponse.json(
    {
      ok: true,
      ...result,
    },
    { headers: { ...sleepfitCorsHeaders(request), ...sleepfitRateLimitHeaders(rateLimit) } },
  );
}
