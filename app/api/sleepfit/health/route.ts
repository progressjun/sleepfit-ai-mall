import { NextResponse } from "next/server";
import { sleepfitCatalog } from "@/lib/sleepfit/catalog";
import { sleepfitCorsHeaders, sleepfitOptionsResponse } from "@/lib/sleepfit/http";
import { SLEEPFIT_VERSION } from "@/lib/sleepfit/version";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return sleepfitOptionsResponse(request);
}

export function GET(request: Request) {
  return NextResponse.json(
    {
      ok: true,
      service: "sleepfit",
      version: SLEEPFIT_VERSION,
      catalogProducts: sleepfitCatalog.length,
      endpoints: ["/sleepfit.js", "/api/sleepfit/health", "/api/sleepfit/recommend", "/api/sleepfit/events"],
    },
    {
      headers: sleepfitCorsHeaders(request),
    },
  );
}
