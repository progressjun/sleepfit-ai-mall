import { NextResponse } from "next/server";
import {
  exchangeCafe24Code,
  getCafe24RedirectUri,
  hasCafe24OAuthConfig,
  readCafe24State,
} from "@/lib/commerce/cafe24-oauth";
import { storeCafe24Token } from "@/lib/onsite/storage";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ message: "Missing Cafe24 OAuth code or state." }, { status: 400 });
  }

  const parsedState = readCafe24State(state);
  if (!parsedState) {
    return NextResponse.json({ message: "Invalid Cafe24 OAuth state." }, { status: 400 });
  }

  if (!hasCafe24OAuthConfig()) {
    return NextResponse.json(
      {
        message: "Cafe24 OAuth is not configured.",
        projectKey: parsedState.projectKey,
        mallId: parsedState.mallId,
      },
      { status: 501 },
    );
  }

  try {
    const token = await exchangeCafe24Code({
      mallId: parsedState.mallId,
      code,
      redirectUri: getCafe24RedirectUri(request),
    });
    const expiresAt = token.expires_at ??
      (typeof token.expires_in === "number" && token.expires_in > 0
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : undefined);

    const storage = await storeCafe24Token({
      projectKey: parsedState.projectKey,
      mallId: parsedState.mallId,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt,
      scopes: token.scopes || [],
    });

    return NextResponse.json({
      ok: true,
      mallId: parsedState.mallId,
      projectKey: parsedState.projectKey,
      scopes: token.scopes || [],
      tokenStored: storage.stored,
      message: "Cafe24 OAuth connection is ready. Run /api/cafe24/sync to import product context.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Cafe24 OAuth callback failed.",
      },
      { status: 502 },
    );
  }
}
