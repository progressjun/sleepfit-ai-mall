import { NextResponse } from "next/server";
import {
  buildCafe24AuthorizeUrl,
  getCafe24RedirectUri,
  hasCafe24OAuthConfig,
} from "@/lib/commerce/cafe24-oauth";
import { cafe24OAuthStartSchema } from "@/lib/onsite/schemas";

export const runtime = "nodejs";

export function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = cafe24OAuthStartSchema.safeParse({
    mallId: url.searchParams.get("mallId") || url.searchParams.get("mall_id"),
    projectKey: url.searchParams.get("projectKey") || url.searchParams.get("project_key"),
    shopNo: url.searchParams.get("shopNo") || url.searchParams.get("shop_no") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ message: "mallId and projectKey are required." }, { status: 400 });
  }

  if (!hasCafe24OAuthConfig()) {
    return NextResponse.json(
      {
        message: "Cafe24 OAuth is not configured.",
        requiredEnv: ["CAFE24_CLIENT_ID", "CAFE24_CLIENT_SECRET", "CAFE24_REDIRECT_URI"],
      },
      { status: 501 },
    );
  }

  return NextResponse.redirect(
    buildCafe24AuthorizeUrl({
      mallId: parsed.data.mallId,
      projectKey: parsed.data.projectKey,
      shopNo: parsed.data.shopNo,
      redirectUri: getCafe24RedirectUri(request),
    }),
  );
}
