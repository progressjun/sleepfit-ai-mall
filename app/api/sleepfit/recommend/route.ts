import { NextResponse } from "next/server";
import {
  applySleepfitRateLimit,
  sleepfitCorsHeaders,
  sleepfitOptionsResponse,
  sleepfitRateLimitHeaders,
} from "@/lib/sleepfit/http";
import { recommendSleepfitProduct } from "@/lib/sleepfit/recommendation";
import { sleepfitRecommendRequestSchema } from "@/lib/sleepfit/schemas";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return sleepfitOptionsResponse(request);
}

export async function POST(request: Request) {
  const parsed = sleepfitRecommendRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid SleepFit recommendation request." },
      { status: 400, headers: sleepfitCorsHeaders(request) },
    );
  }

  const rateLimit = applySleepfitRateLimit({
    route: "recommend",
    request,
    mallId: parsed.data.mallId,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, message: "Too many SleepFit recommendation requests. Please try again shortly." },
      { status: 429, headers: { ...sleepfitCorsHeaders(request), ...sleepfitRateLimitHeaders(rateLimit) } },
    );
  }

  const recommendation = recommendSleepfitProduct({
    answers: parsed.data.answers,
    product: parsed.data.product,
    currentProductNo: parsed.data.currentProductNo,
  });

  return NextResponse.json(recommendation, {
    headers: { ...sleepfitCorsHeaders(request), ...sleepfitRateLimitHeaders(rateLimit) },
  });
}
