import { NextResponse } from "next/server";
import { getSleepfitAdminMetrics } from "@/lib/sleepfit/events";
import { sleepfitCorsHeaders, sleepfitOptionsResponse } from "@/lib/sleepfit/http";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return sleepfitOptionsResponse(request);
}

function suppliedAdminKey(request: Request) {
  const url = new URL(request.url);
  return request.headers.get("x-sleepfit-admin-key") || url.searchParams.get("key") || "";
}

function isAuthorized(request: Request) {
  const configuredKey = process.env.SLEEPFIT_ADMIN_KEY || process.env.SLEEPFIT_ADMIN_TOKEN || "";
  const suppliedKey = suppliedAdminKey(request);

  if (configuredKey) {
    return suppliedKey === configuredKey;
  }

  return suppliedKey === "demo";
}

export function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "SleepFit admin key is required. Set SLEEPFIT_ADMIN_KEY in Vercel, or use ?key=demo before production hardening.",
      },
      { status: 401, headers: sleepfitCorsHeaders(request) },
    );
  }

  const url = new URL(request.url);
  const mallId = url.searchParams.get("mallId") || "sleepnsleepmall";

  return NextResponse.json(
    {
      ok: true,
      authMode: process.env.SLEEPFIT_ADMIN_KEY || process.env.SLEEPFIT_ADMIN_TOKEN ? "env_key" : "demo_key",
      metrics: getSleepfitAdminMetrics(mallId),
    },
    { headers: sleepfitCorsHeaders(request) },
  );
}
