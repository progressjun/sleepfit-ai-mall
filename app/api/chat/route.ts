import { NextResponse } from "next/server";
import { POST as postOnsiteChat } from "@/app/api/onsite/chat/route";
import { corsHeaders, optionsResponse } from "@/lib/onsite/cors";
import { toCompatOnsiteChat } from "@/lib/onsite/compat";

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

function recommendedActions(data: {
  cta?: { label?: string | null; action?: string | null } | null;
  products?: Array<{ name?: string | null; url?: string | null }>;
}) {
  const actions: Array<{ type: string; label: string; url?: string }> = [];
  const primaryProduct = data.products?.find((product) => product.url);

  if (data.cta?.label) {
    actions.push({
      type: data.cta.action === "open_chat" ? "lead_form" : "link",
      label: data.cta.label,
      ...(primaryProduct?.url ? { url: primaryProduct.url } : {}),
    });
  }

  if (primaryProduct?.url && primaryProduct.name) {
    actions.push({
      type: "link",
      label: `${primaryProduct.name} 보러가기`,
      url: primaryProduct.url,
    });
  }

  return actions.slice(0, 3);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Invalid chat payload." },
      { status: 400, headers: corsHeaders(request) },
    );
  }

  const normalized = toCompatOnsiteChat(body as Record<string, unknown>);
  const response = await postOnsiteChat(requestWithJson(request, normalized));
  const rawText = await response.text();
  let json: {
    data?: {
      message?: string;
      suggestedQuestions?: string[];
      products?: Array<{ name?: string | null; url?: string | null }>;
      cta?: { label?: string | null; action?: string | null } | null;
      disclosure?: string;
    };
    source?: string;
    conversationId?: string;
    message?: string;
  } | null = null;

  try {
    json = rawText ? JSON.parse(rawText) : null;
  } catch {
    // Preserve the upstream response if it is not JSON.
  }

  if (!response.ok || !json?.data) {
    return new Response(rawText, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  return NextResponse.json(
    {
      answer: json.data.message || "현재 답변을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      sessionId: normalized.sessionId,
      conversationId: json.conversationId || normalized.conversationId || normalized.sessionId,
      recommendedActions: recommendedActions(json.data),
      products: json.data.products || [],
      suggestedQuestions: json.data.suggestedQuestions || [],
      disclosure: json.data.disclosure || "",
      source: json.source || "mock",
    },
    { status: response.status, headers: response.headers },
  );
}
