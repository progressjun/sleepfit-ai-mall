#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

function loadEnvFile(fileName) {
  const filePath = path.join(rootDir, fileName);
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex < 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (!key || process.env[key] != null) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const baseUrl = normalizeBaseUrl(
  process.env.SLIPAI_HEALTH_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    "http://localhost:4010",
);
const origin = normalizeOrigin(process.env.SLIPAI_HEALTH_ORIGIN || "https://slipai-health.local");
const projectKey = process.env.SLIPAI_HEALTH_PROJECT_KEY || "pk_slipai_health";
const mallId = process.env.SLIPAI_HEALTH_MALL_ID || "slipai-health";
const widgetToken = process.env.SLIPAI_HEALTH_WIDGET_TOKEN || process.env.ONSITE_WIDGET_SHARED_SECRET || "";
const runAiEndpoints = process.env.SLIPAI_HEALTH_FULL_AI === "1";

const visitorId = `health_${Date.now()}_visitor`;
const sessionId = `health_${Date.now()}_session`;
const page = {
  url: `${origin}/health`,
  referrer: "",
  title: "SlipAI health check",
  viewport: { width: 390, height: 844 },
};
const product = {
  pageType: "home",
  productNo: "health-001",
  name: "라이트 코튼 데일리 티셔츠",
  priceText: "29,000원",
  imageUrl: `${origin}/assets/slipai-health-product.jpg`,
  url: `${origin}/product/health-001`,
};

const checks = [];

function normalizeBaseUrl(value) {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

function normalizeOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return "https://slipai-health.local";
  }
}

function record(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

function hasKorean(value) {
  return /[가-힣]/.test(String(value || ""));
}

function hasMojibake(value) {
  return /�|諛|援|泥|媛|怨|섏|쓽|곷떞|\?곹뭹/.test(String(value || ""));
}

function headers(extra = {}) {
  return {
    Origin: origin,
    "Content-Type": "application/json",
    "User-Agent": "SlipAIHealthCheck/1.0",
    ...extra,
  };
}

function withAuth(payload) {
  return widgetToken ? { ...payload, widgetToken } : payload;
}

async function fetchText(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: headers({ Accept: "application/javascript,text/plain,*/*" }),
  });
  const text = await response.text();
  return { response, text };
}

async function fetchJson(pathname, payload) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: headers({ Accept: "application/json" }),
    body: JSON.stringify(withAuth(payload)),
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Keep raw text for diagnostics.
  }
  return { response, text, json };
}

async function fetchOps() {
  const params = new URLSearchParams({ projectKey, mallId });
  if (widgetToken) params.set("widgetToken", widgetToken);
  const response = await fetch(`${baseUrl}/api/onsite/ops?${params.toString()}`, {
    headers: headers({ Accept: "application/json" }),
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Keep raw text for diagnostics.
  }
  return { response, text, json };
}

function assertProductCards(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return "추천 상품 카드가 비어 있습니다.";
  }

  for (const item of products) {
    if (!item || typeof item.name !== "string" || !item.name.trim()) {
      return "추천 상품 카드에 상품명이 없습니다.";
    }
    if (item.url) {
      try {
        new URL(item.url);
      } catch {
        return `추천 상품 URL이 유효하지 않습니다: ${item.url}`;
      }
    }
  }

  return "";
}

async function checkWidgetScript() {
  const { response, text } = await fetchText(`/widget/v1.js?health=${Date.now()}`);
  record("widget script status", response.ok, `${response.status} ${response.statusText}`);
  record("widget exposes namespace", text.includes("window.__SLIPAI"), "window.__SLIPAI 확인");
  const compat = await fetchText(`/onsite.js?health=${Date.now()}`);
  record("onsite.js compatibility status", compat.response.ok, `${compat.response.status} ${compat.response.statusText}`);
  record("onsite.js data-site-id support", compat.text.includes("data-site-id"), "data-site-id 원태그 확인");
  record("onsite.js PMOnsite support", compat.text.includes("window.PMOnsite"), "PMOnsite 호환 API 확인");
  record("widget Korean title", text.includes("SlipAI 추천"), "추천 배너 타이틀 한글 확인");
  record("widget Korean CTA", text.includes("추천 이유 보기") && text.includes("상품 보러가기"), "추천 배너 CTA 한글 확인");
  record("widget home trigger", text.includes("home_first_visit"), "홈 진입 추천 트리거 확인");
  record("widget advisor removed", !text.includes("SlipAI 상담사") && !text.includes("/api/onsite/chat") && !text.includes("chat_open"), "상담사 UI/API 호출 미포함 확인");
  record("widget no context endpoint", !text.includes("/api/onsite/context"), "상담 문구 endpoint 미호출 확인");
  record(
    "widget no old English UI",
    !text.includes("SlipAI advisor") && !text.includes("Ask about product quality"),
    "구 영문 UI 문구 미검출",
  );
  record(
    "widget no generic size prompt",
    !text.includes("상품, 사이즈, 후기 중 어떤 부분이 고민되나요?"),
    "고정 범용 입력 문구 미검출",
  );
  record(
    "widget product media fallback",
    text.includes(".product-media") && text.includes("product-placeholder") && text.includes("img.onerror"),
    "상품 이미지 실패 시 카드가 무너지지 않는 placeholder 확인",
  );
  record(
    "widget current-product dedupe guard",
    text.includes("compactProductName") && text.includes("current.name") && text.includes("candidate.name"),
    "현재 상품이 추천 카드에 중복 노출되지 않도록 클라이언트 방어 확인",
  );
  record("widget no mojibake", !hasMojibake(text), "위젯 스크립트 깨진 한글 미검출");
}

async function checkContextEventAndOps() {
  const contextResult = await fetchJson("/api/onsite/context", {
    projectKey,
    mallId,
    visitorId,
    sessionId,
    page,
    product,
  });
  const context = contextResult.json?.data || {};
  record("context API status", contextResult.response.ok, `${contextResult.response.status} ${contextResult.text.slice(0, 120)}`);
  record("context Korean greeting", hasKorean(context.greeting), String(context.greeting || "").slice(0, 120));
  record("context Korean placeholder", hasKorean(context.placeholder), String(context.placeholder || "").slice(0, 120));
  record(
    "context customized away from generic",
    !String(context.placeholder || "").includes("상품, 사이즈"),
    String(context.placeholder || "").slice(0, 120),
  );
  record("context no mojibake", !hasMojibake(JSON.stringify(context)), "컨텍스트 응답 깨진 한글 미검출");

  const resolveResult = await fetchJson("/api/widget/resolve", {
    siteId: mallId,
    visitorId,
    sessionId,
    pageUrl: page.url,
    path: "/health",
    referrer: page.referrer,
    productContext: product,
  });
  record("compat widget resolve status", resolveResult.response.ok, `${resolveResult.response.status} ${resolveResult.text.slice(0, 120)}`);
  record("compat widget resolve banner", resolveResult.json?.banner?.show === true, JSON.stringify(resolveResult.json?.banner || {}).slice(0, 160));
  record("compat widget resolve chat disabled", resolveResult.json?.chat?.enabled === false, JSON.stringify(resolveResult.json?.chat || {}).slice(0, 160));

  const payload = {
    projectKey,
    mallId,
    visitorId,
    sessionId,
    eventName: "page_view",
    page,
    product,
    metadata: { source: "slipai-health-check" },
    occurredAt: new Date().toISOString(),
  };
  const eventResult = await fetchJson("/api/onsite/events", payload);
  record("event API status", eventResult.response.ok, `${eventResult.response.status} ${eventResult.text.slice(0, 120)}`);
  record("event API ok", eventResult.json?.ok === true, JSON.stringify(eventResult.json || {}).slice(0, 180));

  const compatEventResult = await fetchJson("/api/events", {
    siteId: mallId,
    visitorId,
    sessionId,
    eventName: "banner_impression",
    pageUrl: page.url,
    productContext: product,
    payload: { source: "slipai-health-check" },
    timestamp: new Date().toISOString(),
  });
  record("compat event API status", compatEventResult.response.ok, `${compatEventResult.response.status} ${compatEventResult.text.slice(0, 120)}`);
  record("compat event API ok", compatEventResult.json?.ok === true, JSON.stringify(compatEventResult.json || {}).slice(0, 180));

  const opsResult = await fetchOps();
  record("ops API status", opsResult.response.ok, `${opsResult.response.status} ${opsResult.text.slice(0, 120)}`);
  record("ops API ok", opsResult.json?.ok === true, JSON.stringify(opsResult.json || {}).slice(0, 180));
}

async function checkAiRecommendations() {
  if (!runAiEndpoints) {
    record(
      "AI recommendation smoke",
      true,
      "SLIPAI_HEALTH_FULL_AI=1 이 아니므로 비용 발생 가능 endpoint는 건너뜁니다.",
    );
    return;
  }

  const recommendation = await fetchJson("/api/onsite/recommendation", {
    projectKey,
    mallId,
    visitorId,
    sessionId,
    page,
    product,
    trigger: "home_first_visit",
    recentEvents: ["page_view"],
  });
  const recommendationMessage = recommendation.json?.data?.message || "";
  const recommendationProducts = recommendation.json?.data?.products;
  record("recommendation API status", recommendation.response.ok, `${recommendation.response.status}`);
  record("recommendation Korean message", hasKorean(recommendationMessage), recommendationMessage.slice(0, 120));
  record("recommendation no mojibake", !hasMojibake(JSON.stringify(recommendation.json || {})), "추천 응답 깨진 한글 미검출");
  record("recommendation product cards", !assertProductCards(recommendationProducts), assertProductCards(recommendationProducts));

}

function checkStaticOnsiteCopy() {
  const mojibakePattern = /[\uFFFD\uF900-\uFAFF\u4E00-\u9FFF]|\?[\u3131-\uD7A3]/;
  const files = [
    "lib/onsite/mock.ts",
    "app/api/onsite/recommendation/route.ts",
    "app/api/onsite/chat/route.ts",
    "lib/onsite/widget-script.ts",
    "public/slipai-product-demo.html",
    "public/slipai-home-demo.html",
    "public/cafe24-widget-demo.html",
  ];

  for (const file of files) {
    const fullPath = path.join(rootDir, file);
    const text = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : "";
    record(`static copy no mojibake: ${file}`, !mojibakePattern.test(text), "온사이트 핵심 문구 깨짐 여부 확인");
  }
}

async function main() {
  checkStaticOnsiteCopy();
  await checkWidgetScript();
  await checkContextEventAndOps();
  await checkAiRecommendations();

  const failed = checks.filter((check) => !check.ok);
  const summary = {
    ok: failed.length === 0,
    baseUrl,
    origin,
    projectKey,
    mallId,
    fullAiSmoke: runAiEndpoints,
    checks,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        message: error instanceof Error ? error.message : "unknown_error",
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
