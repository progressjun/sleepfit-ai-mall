const DEFAULT_METHODS = "GET,POST,OPTIONS";
const DEFAULT_HEADERS = "Content-Type,X-C24AI-Version,X-SlipAI-Version";
const SECURITY_HEADERS = {
  "Cross-Origin-Resource-Policy": "same-site",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "geolocation=(),camera=(),microphone=(),payment=(),usb=(),interest-cohort=()",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
};

function configuredOrigins() {
  return (process.env.ONSITE_WIDGET_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getCorsOrigin(request: Request) {
  const origin = request.headers.get("origin") || "*";
  const allowed = configuredOrigins();
  const inProduction = process.env.NODE_ENV === "production";

  if (allowed.length === 0) {
    return inProduction ? "" : "*";
  }

  if (allowed.includes("*")) {
    return "*";
  }

  if (allowed.includes(origin)) {
    return origin;
  }

  return inProduction ? "" : allowed[0] || "*";
}

export function corsHeaders(request: Request) {
  return {
    "Access-Control-Allow-Origin": getCorsOrigin(request),
    "Access-Control-Allow-Methods": DEFAULT_METHODS,
    "Access-Control-Allow-Headers": DEFAULT_HEADERS,
    "Access-Control-Max-Age": "86400",
    ...SECURITY_HEADERS,
    Vary: "Origin",
  };
}

export function optionsResponse(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}
