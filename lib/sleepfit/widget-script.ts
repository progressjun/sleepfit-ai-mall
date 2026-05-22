import { SLEEPFIT_VERSION } from "@/lib/sleepfit/version";

export function buildSleepfitWidgetScript() {
  return `
(function () {
  "use strict";

  if (window.__sleepfitAIInitialized) return;
  window.__sleepfitAIInitialized = true;

  var VERSION = "${SLEEPFIT_VERSION}";
  var BRAND = "SleepFit AI";
  var FALLBACK_IMAGE = "https://sleepfit-ai-mall.vercel.app/sleepfit-placeholder.svg";
  var script =
    document.currentScript ||
    document.querySelector('script[src*="/sleepfit.js"]') ||
    document.querySelector('script[src*="/api/sleepfit.js"]');

  if (!script) return;

  var mallId = script.getAttribute("data-mall-id") || "sleepnsleepmall";
  var debug = script.getAttribute("data-debug") === "true";
  var apiBase = script.getAttribute("data-api-base") || new URL(script.src, window.location.href).origin;
  var disabled = script.getAttribute("data-disabled") === "true";
  var surfaceConfig = script.getAttribute("data-surfaces") || "home,collection,product_detail,cart,purchase_complete";
  var forceSurface = script.getAttribute("data-surface") || "auto";
  var position = script.getAttribute("data-position") || "right";
  var autoOpen = script.getAttribute("data-auto-open") || "none";
  var allowedSurfaces = surfaceConfig.split(",").map(function (item) { return item.trim(); }).filter(Boolean);

  var host = null;
  var inlineHost = null;
  var bannerHost = null;
  var shadow = null;
  var inlineShadow = null;
  var bannerShadow = null;
  var current = null;
  var state = {
    panelOpen: false,
    started: false,
    loading: false,
    error: "",
    step: 0,
    answers: {},
    recommendation: null
  };

  var QUESTIONS = [
    {
      id: "posture",
      title: "주로 어떤 자세로 주무세요?",
      options: [
        { value: "side", label: "옆으로", hint: "어깨 지지감" },
        { value: "back", label: "바로 누워", hint: "중간 높이" },
        { value: "stomach", label: "엎드려", hint: "낮은 높이" },
        { value: "mixed", label: "자주 바뀜", hint: "조절형" }
      ]
    },
    {
      id: "heightPreference",
      title: "편한 베개 높이는 어느 쪽인가요?",
      options: [
        { value: "low", label: "낮은 편", hint: "목 부담 적게" },
        { value: "medium", label: "중간", hint: "무난한 높이" },
        { value: "high", label: "높은 편", hint: "받침감 있게" },
        { value: "unsure", label: "잘 모르겠음", hint: "조절형 우선" }
      ]
    },
    {
      id: "bodyFrame",
      title: "체형이나 어깨 너비는 어떤 편인가요?",
      options: [
        { value: "small", label: "작은 편", hint: "낮고 부드럽게" },
        { value: "average", label: "보통", hint: "중간 기준" },
        { value: "large", label: "큰 편", hint: "넓고 단단하게" }
      ]
    },
    {
      id: "heatSensitivity",
      title: "잘 때 더위를 많이 타세요?",
      options: [
        { value: "low", label: "거의 안 탐", hint: "기본 소재" },
        { value: "medium", label: "가끔", hint: "가벼운 냉감" },
        { value: "high", label: "많이 탐", hint: "냉감 우선" }
      ]
    },
    {
      id: "budget",
      title: "예산은 어느 정도로 볼까요?",
      options: [
        { value: "value", label: "부담 낮게", hint: "입문가" },
        { value: "mid", label: "중간대", hint: "대표 상품" },
        { value: "premium", label: "프리미엄", hint: "선물도 가능" },
        { value: "flexible", label: "유연하게", hint: "세트 비교" }
      ]
    },
    {
      id: "giftIntent",
      title: "선물용 구매인가요?",
      options: [
        { value: "no", label: "내가 쓸게요", hint: "실사용 기준" },
        { value: "yes", label: "선물용", hint: "후기·고급감" },
        { value: "unsure", label: "아직 고민", hint: "무난한 선택" }
      ]
    },
    {
      id: "firstPurchase",
      title: "슬립앤슬립 베개 첫 구매인가요?",
      options: [
        { value: "yes", label: "첫 구매", hint: "대표 라인" },
        { value: "no", label: "재구매", hint: "차이점 비교" },
        { value: "unsure", label: "잘 모르겠음", hint: "후기 기준" }
      ]
    }
  ];

  var VARIANTS = {
    A: {
      launcherText: "나에게 맞는 베개 20초 만에 찾기",
      productCta: "내 옵션 확인하기"
    },
    B: {
      launcherText: "내 수면 습관에 맞는 베개 추천받기",
      productCta: "이 상품이 맞는지 확인하기"
    }
  };

  function log(message, details) {
    if (!debug || !window.console) return;
    if (details === undefined) console.log("[SleepFit] " + message);
    else console.log("[SleepFit] " + message, details);
  }

  function safeStorageGet(storage, key) {
    try {
      return storage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function safeStorageSet(storage, key, value) {
    try {
      storage.setItem(key, value);
    } catch (_) {
      return;
    }
  }

  function randomId(prefix) {
    return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
  }

  function getVisitorId() {
    var key = "sleepfit_vid";
    var existing = safeStorageGet(window.localStorage, key);
    if (existing) return existing;
    var next = randomId("sfv");
    safeStorageSet(window.localStorage, key, next);
    return next;
  }

  function getSessionId() {
    var key = "sleepfit_sid";
    var existing = safeStorageGet(window.sessionStorage, key);
    if (existing) return existing;
    var next = randomId("sfs");
    safeStorageSet(window.sessionStorage, key, next);
    return next;
  }

  function getAbGroup() {
    var key = "sleepfit_ab_group";
    var existing = safeStorageGet(window.localStorage, key);
    if (existing === "A" || existing === "B") return existing;
    var next = Math.random() < 0.5 ? "A" : "B";
    safeStorageSet(window.localStorage, key, next);
    setTimeout(function () {
      track("ab_assigned", { abGroup: next });
    }, 0);
    return next;
  }

  var visitorId = getVisitorId();
  var sessionId = getSessionId();
  var abGroup = getAbGroup();

  function deviceType() {
    var width = window.innerWidth || 0;
    if (width && width < 768) return "mobile";
    if (width && width < 1024) return "tablet";
    if (width >= 1024) return "desktop";
    return "unknown";
  }

  function currentUrl() {
    return window.location.href;
  }

  function findProductNo() {
    var params = new URLSearchParams(window.location.search);
    var queryNo = params.get("product_no") || params.get("productNo") || params.get("product_id");
    if (queryNo) return queryNo;

    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && canonical.href) {
      var matchCanonical = canonical.href.match(/(?:product_no=|\\/)(\\d+)(?:[/?#]|$)/);
      if (matchCanonical) return matchCanonical[1];
    }

    var matchPath = window.location.pathname.match(/\\/product\\/(?:[^/]+\\/)?(\\d+)(?:\\/|$)/);
    if (matchPath) return matchPath[1];

    var input = document.querySelector('input[name="product_no"], input[name="productNo"], input[name="product_no[]"]');
    if (input && input.value) return input.value;

    var dataNode = document.querySelector("[data-product-no]");
    if (dataNode) {
      var dataNo = dataNode.getAttribute("data-product-no");
      if (dataNo) return dataNo;
    }

    var meta = document.querySelector('meta[property="product:retailer_item_id"], meta[property="og:product:id"]');
    if (meta && meta.content) return meta.content;

    return "";
  }

  function detectPageType(productNo) {
    if (forceSurface !== "auto") return forceSurface;
    var path = window.location.pathname.toLowerCase();
    var href = currentUrl().toLowerCase();

    if (/order.*(result|complete|finish)|order_result|orderend/.test(href)) return "purchase_complete";
    if (/basket|cart|order\\/basket/.test(path)) return "cart";
    if (/order|checkout|payment/.test(path)) return "checkout";
    if (productNo || /\\/product\\/detail\\.html/i.test(path) || /\\/product\\/(?:[^/]+\\/)?[0-9]+(?:\\/|$)/i.test(path)) return "product_detail";
    if (/\\/product\\/list|cate_no=|category|search|keyword=/.test(href)) return "collection";
    if (path === "/" || /\\/index\\.html?$/.test(path)) return "home";
    return "other";
  }

  function detectProduct() {
    var productNo = findProductNo();
    var pageType = detectPageType(productNo);
    if (pageType !== "product_detail") productNo = "";

    var title =
      document.querySelector(".headingArea h2, .xans-product-detail .headingArea h2, h1") ||
      document.querySelector("meta[property='og:title']") ||
      {};
    var price =
      document.querySelector("#span_product_price_text, .product_price, .price") ||
      document.querySelector("meta[property='product:price:amount']") ||
      {};
    var image =
      document.querySelector(".keyImg img, .thumbnail img") ||
      document.querySelector("meta[property='og:image']") ||
      {};

    return {
      pageType: pageType,
      productNo: productNo || undefined,
      name: title.textContent || title.content || document.title || "",
      priceText: price.textContent || price.content || "",
      imageUrl: image.src || image.content || "",
      url: currentUrl()
    };
  }

  function pageContext() {
    return {
      url: currentUrl(),
      referrer: document.referrer || "",
      title: document.title || "",
      pageType: current ? current.pageType : "other",
      viewport: {
        width: window.innerWidth || 0,
        height: window.innerHeight || 0
      }
    };
  }

  function shouldRenderSurface(pageType) {
    if (disabled) return false;
    if (pageType === "checkout") return false;
    return allowedSurfaces.indexOf(pageType) >= 0;
  }

  function apiUrl(path) {
    return apiBase.replace(/\\/$/, "") + path;
  }

  function postJson(path, payload, options) {
    options = options || {};
    var controller = window.AbortController ? new AbortController() : null;
    var timeout = setTimeout(function () {
      if (controller) controller.abort();
    }, options.timeout || 7000);

    return fetch(apiUrl(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SleepFit-Version": VERSION
      },
      body: JSON.stringify(payload),
      credentials: "omit",
      keepalive: Boolean(options.keepalive),
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        clearTimeout(timeout);
        if (!response.ok) throw new Error("SleepFit API " + response.status);
        return response.json();
      })
      .catch(function (error) {
        clearTimeout(timeout);
        throw error;
      });
  }

  function baseEvent(eventType, metadata) {
    metadata = metadata || {};
    var recommendedProductNo =
      metadata.recommendedProductNo ||
      metadata.productNo ||
      (state.recommendation && state.recommendation.primaryProduct && state.recommendation.primaryProduct.productNo) ||
      "";

    return {
      eventId: randomId("sfe"),
      eventType: eventType,
      timestamp: new Date().toISOString(),
      mallId: mallId,
      visitorId: visitorId,
      anonymousId: visitorId,
      sessionId: sessionId,
      pageUrl: currentUrl(),
      pageType: current ? current.pageType : "other",
      referrer: document.referrer || "",
      deviceType: deviceType(),
      userAgent: navigator.userAgent || "",
      currentProductNo: current && current.productNo ? current.productNo : "",
      recommendedProductNo: recommendedProductNo ? String(recommendedProductNo) : "",
      scenario: metadata.scenario || "",
      abGroup: abGroup,
      quizAnswers: Object.assign({}, state.answers),
      page: pageContext(),
      product: current,
      answers: Object.assign({}, state.answers),
      recommendation: state.recommendation || undefined,
      metadata: metadata
    };
  }

  function track(eventType, metadata) {
    var payload = baseEvent(eventType, metadata);

    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        if (navigator.sendBeacon(apiUrl("/api/sleepfit/events"), blob)) return;
      }
    } catch (_) {
      // Ignore telemetry errors so the purchase flow is never blocked.
    }

    postJson("/api/sleepfit/events", payload, { keepalive: true, timeout: 3000 }).catch(function (error) {
      log("event failed", error);
    });
  }

  function sleepfitStyle() {
    return [
      ":host{all:initial;font-family:Arial,'Noto Sans KR',sans-serif;color:#1f2a24;letter-spacing:0}",
      "*,*::before,*::after{box-sizing:border-box}",
      "button{font:inherit}",
      ".sleepfit-launcher{display:flex;align-items:center;gap:8px;border:0;border-radius:999px;background:#2f4938;color:#fff;padding:13px 16px;box-shadow:0 12px 30px rgba(20,32,26,.20);cursor:pointer;max-width:min(300px,calc(100vw - 32px));font-size:14px;font-weight:700;line-height:1.2}",
      ".sleepfit-launcher-dot{width:8px;height:8px;border-radius:50%;background:#d8f0dc;flex:0 0 auto}",
      ".sleepfit-panel{width:min(390px,calc(100vw - 24px));max-height:min(760px,78vh);overflow:auto;border:1px solid rgba(47,73,56,.12);border-radius:10px;background:#fff;box-shadow:0 20px 50px rgba(20,32,26,.18)}",
      ".sleepfit-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px 16px 10px;border-bottom:1px solid #eef2ef}",
      ".sleepfit-brand{font-size:12px;font-weight:700;color:#5f7166}",
      ".sleepfit-title{margin:4px 0 0;font-size:18px;font-weight:800;line-height:1.28;color:#243329}",
      ".sleepfit-close{width:32px;height:32px;border:1px solid #dce5de;border-radius:8px;background:#fff;color:#47564c;cursor:pointer;font-size:20px;line-height:1}",
      ".sleepfit-body{padding:16px}",
      ".sleepfit-note{margin:0;color:#607166;font-size:13px;line-height:1.55}",
      ".sleepfit-progress{height:4px;background:#edf2ef;border-radius:999px;overflow:hidden;margin:12px 0 16px}",
      ".sleepfit-progress-bar{height:100%;background:#2f4938;border-radius:999px;transition:width .18s ease}",
      ".sleepfit-question{font-size:18px;font-weight:800;line-height:1.35;margin:0 0 12px;color:#1f2a24}",
      ".sleepfit-options{display:grid;gap:8px}",
      ".sleepfit-option{width:100%;display:flex;justify-content:space-between;gap:10px;text-align:left;border:1px solid #dfe7e2;background:#fff;border-radius:8px;padding:12px;cursor:pointer;color:#243329}",
      ".sleepfit-option:hover,.sleepfit-option:focus{border-color:#2f4938;outline:0;box-shadow:0 0 0 3px rgba(47,73,56,.10)}",
      ".sleepfit-option-label{font-size:14px;font-weight:800;line-height:1.35}",
      ".sleepfit-option-hint{font-size:12px;color:#718177;white-space:nowrap}",
      ".sleepfit-step-row{display:flex;align-items:center;justify-content:space-between;margin-top:12px;color:#6f7e74;font-size:12px}",
      ".sleepfit-back{border:0;background:transparent;color:#2f4938;font-weight:700;cursor:pointer;padding:6px 0}",
      ".sleepfit-loading{display:grid;place-items:center;min-height:220px;text-align:center;color:#46564d}",
      ".sleepfit-spinner{width:28px;height:28px;border:3px solid #e3ebe6;border-top-color:#2f4938;border-radius:50%;animation:sleepfit-spin .8s linear infinite;margin-bottom:12px}",
      "@keyframes sleepfit-spin{to{transform:rotate(360deg)}}",
      ".sleepfit-result{display:grid;gap:12px}",
      ".sleepfit-scenario{border-radius:8px;background:#f5f8f6;padding:10px 12px;font-size:13px;line-height:1.55;color:#405047}",
      ".sleepfit-product{display:grid;grid-template-columns:78px 1fr;gap:12px;border:1px solid #e1e8e4;border-radius:8px;padding:10px;background:#fff}",
      ".sleepfit-product-main{border-color:#b9cbbf;background:#fbfdfb}",
      ".sleepfit-img{width:78px;height:78px;border-radius:7px;object-fit:cover;background:#f4f7f5}",
      ".sleepfit-product-name{margin:0;font-size:14px;font-weight:800;line-height:1.35;color:#1f2a24}",
      ".sleepfit-price{margin:4px 0 0;font-size:13px;font-weight:800;color:#2f4938}",
      ".sleepfit-copy{margin:6px 0 0;font-size:12px;line-height:1.5;color:#596a60}",
      ".sleepfit-proof{margin:0;padding:0;display:grid;gap:6px;list-style:none}",
      ".sleepfit-proof li{font-size:12px;line-height:1.45;color:#586960;background:#f7faf8;border-radius:7px;padding:8px 10px}",
      ".sleepfit-cta{width:100%;border:0;border-radius:8px;background:#2f4938;color:#fff;padding:13px 14px;font-size:14px;font-weight:800;cursor:pointer}",
      ".sleepfit-subtitle{font-size:13px;font-weight:800;color:#34463b;margin:4px 0 0}",
      ".sleepfit-alt-list{display:grid;gap:8px}",
      ".sleepfit-alt{display:grid;grid-template-columns:54px 1fr auto;align-items:center;gap:10px;border:1px solid #e3e9e5;border-radius:8px;background:#fff;padding:8px;cursor:pointer;text-align:left;color:#243329}",
      ".sleepfit-alt img{width:54px;height:54px;border-radius:6px;object-fit:cover;background:#f4f7f5}",
      ".sleepfit-alt-name{font-size:13px;font-weight:800;line-height:1.35}",
      ".sleepfit-alt-point{font-size:11px;color:#6d7c72;margin-top:3px}",
      ".sleepfit-arrow{font-size:18px;color:#2f4938}",
      ".sleepfit-error{border-radius:8px;background:#fff7ed;color:#8a4b0f;padding:10px 12px;font-size:13px;line-height:1.5}",
      ".sleepfit-inline{border:1px solid #dfe8e2;background:#fff;border-radius:8px;padding:14px;margin:12px 0;box-shadow:0 8px 24px rgba(36,51,41,.07)}",
      ".sleepfit-inline-row{display:flex;align-items:center;justify-content:space-between;gap:12px}",
      ".sleepfit-inline-title{margin:0;font-size:15px;font-weight:800;line-height:1.35;color:#243329}",
      ".sleepfit-inline-copy{margin:4px 0 0;font-size:12px;line-height:1.45;color:#65756b}",
      ".sleepfit-inline-button{flex:0 0 auto;border:0;border-radius:8px;background:#2f4938;color:#fff;padding:10px 12px;font-size:13px;font-weight:800;cursor:pointer}",
      ".sleepfit-banner{border:1px solid #dfe8e2;background:#f8faf8;border-radius:8px;padding:13px;margin:0 0 14px}",
      ".sleepfit-banner .sleepfit-inline-button{background:#fff;color:#2f4938;border:1px solid #cbd8cf}",
      "@media(max-width:430px){.sleepfit-panel{width:calc(100vw - 20px);max-height:74vh}.sleepfit-inline-row{align-items:flex-start;flex-direction:column}.sleepfit-inline-button{width:100%}.sleepfit-launcher{font-size:13px;padding:12px 14px}.sleepfit-product{grid-template-columns:68px 1fr}.sleepfit-img{width:68px;height:68px}}"
    ].join("");
  }

  function ensureStyle(root) {
    if (root.querySelector("style[data-sleepfit-style]")) return;
    var style = document.createElement("style");
    style.setAttribute("data-sleepfit-style", "true");
    style.textContent = sleepfitStyle();
    root.appendChild(style);
  }

  function createHost() {
    var existing = document.querySelector("[data-sleepfit-root]");
    if (existing && existing.shadowRoot) {
      host = existing;
      shadow = existing.shadowRoot;
      return;
    }

    host = document.createElement("div");
    host.setAttribute("data-sleepfit-root", "true");
    host.style.position = "fixed";
    host.style.zIndex = "99990";
    host.style.bottom = "calc(88px + env(safe-area-inset-bottom, 0px))";
    host.style[position === "left" ? "left" : "right"] = "16px";
    host.style.maxWidth = "calc(100vw - 32px)";
    host.style.pointerEvents = "auto";
    shadow = host.attachShadow({ mode: "open" });
    document.documentElement.appendChild(host);
  }

  function makeShadowHost(attribute) {
    var existing = document.querySelector("[" + attribute + "]");
    if (existing && existing.shadowRoot) return existing;
    var node = document.createElement("div");
    node.setAttribute(attribute, "true");
    node.style.display = "block";
    node.attachShadow({ mode: "open" });
    return node;
  }

  function productDetailTarget() {
    return (
      document.querySelector(".infoArea, .xans-product-detail .infoArea, #totalProducts, .xans-product-option") ||
      document.querySelector(".xans-product-detail, form[name='form1'], form#frm_image_zoom") ||
      document.querySelector("main, #contents, #container, body")
    );
  }

  function collectionTarget() {
    return (
      document.querySelector(".xans-product-listnormal, .prdList, .product_list, #contents, #container, main") ||
      document.body
    );
  }

  function cartTarget() {
    return (
      document.querySelector(".xans-order-basketpackage, .orderListArea, #orderFixArea, #contents, #container, main") ||
      document.body
    );
  }

  function mountInline() {
    if (!current || !shouldRenderSurface(current.pageType)) return;

    if (current.pageType === "collection" && !bannerHost) {
      bannerHost = makeShadowHost("data-sleepfit-banner-root");
      bannerShadow = bannerHost.shadowRoot;
      var collection = collectionTarget();
      if (collection && collection.parentNode) collection.parentNode.insertBefore(bannerHost, collection);
      else document.body.insertBefore(bannerHost, document.body.firstChild);
    }

    if ((current.pageType === "product_detail" || current.pageType === "cart" || current.pageType === "purchase_complete") && !inlineHost) {
      inlineHost = makeShadowHost("data-sleepfit-inline-root");
      inlineShadow = inlineHost.shadowRoot;
      var target = current.pageType === "cart" ? cartTarget() : productDetailTarget();
      if (target && target.parentNode && current.pageType === "product_detail") target.parentNode.insertBefore(inlineHost, target);
      else if (target) target.appendChild(inlineHost);
      else document.body.appendChild(inlineHost);
    }
  }

  function showLauncher() {
    return current && (current.pageType === "home" || current.pageType === "collection");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderFloating() {
    if (!shadow) return;
    ensureStyle(shadow);
    var html = "";

    if (state.panelOpen) {
      html += renderPanel();
    } else if (showLauncher()) {
      html += '<button class="sleepfit-launcher" type="button" data-sleepfit-action="start">';
      html += '<span class="sleepfit-launcher-dot"></span>';
      html += '<span>' + escapeHtml(VARIANTS[abGroup].launcherText) + '</span>';
      html += "</button>";
    }

    shadow.innerHTML = "<style data-sleepfit-style='true'>" + sleepfitStyle() + "</style>" + html;
    bindShadow(shadow);
  }

  function renderInline() {
    if (bannerShadow) {
      bannerShadow.innerHTML =
        "<style data-sleepfit-style='true'>" +
        sleepfitStyle() +
        "</style>" +
        '<div class="sleepfit-banner"><div class="sleepfit-inline-row"><div><p class="sleepfit-inline-title">상품이 많아 고민된다면, 수면 습관 기준으로 골라보세요</p><p class="sleepfit-inline-copy">답변을 바탕으로 대표 상품 1개와 비교 후보만 좁혀드립니다.</p></div><button class="sleepfit-inline-button" type="button" data-sleepfit-action="start">내 수면핏 찾기</button></div></div>';
      bindShadow(bannerShadow);
    }

    if (!inlineShadow || !current) return;
    var title = "이 상품이 내 수면 습관에 맞는지 확인해보세요";
    var copy = "20초 진단으로 추천 옵션과 비교 상품을 확인합니다.";
    var label = VARIANTS[abGroup].productCta;

    if (current.pageType === "cart") {
      title = "함께 쓰면 만족도가 높은 구성";
      copy = "장바구니 상품과 같이 보기 좋은 베개·커버 후보를 좁혀드립니다.";
      label = "함께 볼 상품 찾기";
    }

    if (current.pageType === "purchase_complete") {
      title = "다음 수면 환경까지 함께 맞춰보세요";
      copy = "이번 구매와 어울리는 다음 상품 후보를 확인합니다.";
      label = "추천 상품 보기";
    }

    inlineShadow.innerHTML =
      "<style data-sleepfit-style='true'>" +
      sleepfitStyle() +
      "</style>" +
      '<div class="sleepfit-inline"><div class="sleepfit-inline-row"><div><p class="sleepfit-inline-title">' +
      escapeHtml(title) +
      '</p><p class="sleepfit-inline-copy">' +
      escapeHtml(copy) +
      '</p></div><button class="sleepfit-inline-button" type="button" data-sleepfit-action="start">' +
      escapeHtml(label) +
      "</button></div></div>";
    bindShadow(inlineShadow);
  }

  function renderPanel() {
    var html = '<section class="sleepfit-panel" role="dialog" aria-label="SleepFit AI 추천 진단">';
    html += '<div class="sleepfit-head"><div><div class="sleepfit-brand">' + BRAND + '</div>';
    html += '<h2 class="sleepfit-title">수면핏 추천</h2></div>';
    html += '<button class="sleepfit-close" type="button" aria-label="닫기" data-sleepfit-action="close">×</button></div>';
    html += '<div class="sleepfit-body">';

    if (state.loading) {
      html += '<div class="sleepfit-loading"><div><div class="sleepfit-spinner"></div><p class="sleepfit-note">답변과 상품 정보를 맞춰보고 있습니다.</p></div></div>';
    } else if (state.recommendation) {
      html += renderResult(state.recommendation);
    } else {
      html += renderQuestion();
    }

    html += "</div></section>";
    return html;
  }

  function renderQuestion() {
    var question = QUESTIONS[state.step] || QUESTIONS[0];
    var progress = Math.round(((state.step + 1) / QUESTIONS.length) * 100);
    var html = '<div class="sleepfit-progress" aria-hidden="true"><div class="sleepfit-progress-bar" style="width:' + progress + '%"></div></div>';
    html += '<p class="sleepfit-question">' + escapeHtml(question.title) + "</p>";
    if (state.error) html += '<div class="sleepfit-error">' + escapeHtml(state.error) + "</div>";
    html += '<div class="sleepfit-options">';
    question.options.forEach(function (option) {
      html += '<button class="sleepfit-option" type="button" data-sleepfit-action="answer" data-sleepfit-question="' + escapeHtml(question.id) + '" data-sleepfit-answer="' + escapeHtml(option.value) + '">';
      html += '<span class="sleepfit-option-label">' + escapeHtml(option.label) + '</span>';
      html += '<span class="sleepfit-option-hint">' + escapeHtml(option.hint) + '</span>';
      html += "</button>";
    });
    html += "</div>";
    html += '<div class="sleepfit-step-row"><span>' + (state.step + 1) + " / " + QUESTIONS.length + "</span>";
    if (state.step > 0) html += '<button class="sleepfit-back" type="button" data-sleepfit-action="back">이전</button>';
    html += "</div>";
    return html;
  }

  function productCard(product, isMain) {
    var html = '<div class="sleepfit-product ' + (isMain ? "sleepfit-product-main" : "") + '">';
    html += '<img class="sleepfit-img" loading="lazy" src="' + escapeHtml(product.imageUrl || FALLBACK_IMAGE) + '" alt="' + escapeHtml(product.name || "추천 상품") + '">';
    html += '<div><p class="sleepfit-product-name">' + escapeHtml(product.name || "") + '</p>';
    if (product.priceText) html += '<p class="sleepfit-price">' + escapeHtml(product.priceText) + "</p>";
    html += '<p class="sleepfit-copy">' + escapeHtml(product.reason || product.optionHint || "") + "</p>";
    if (product.proofCopy) html += '<p class="sleepfit-copy">' + escapeHtml(product.proofCopy) + "</p>";
    html += "</div></div>";
    return html;
  }

  function renderResult(data) {
    var html = '<div class="sleepfit-result">';
    if (data.scenarioMessage) html += '<div class="sleepfit-scenario">' + escapeHtml(data.scenarioMessage) + "</div>";
    html += productCard(data.primaryProduct, true);
    if (data.primaryProduct.optionHint) html += '<div class="sleepfit-scenario">' + escapeHtml(data.primaryProduct.optionHint) + "</div>";
    html += '<button class="sleepfit-cta" type="button" data-sleepfit-action="primary-cta">' + escapeHtml(data.cta.label || data.primaryProduct.ctaLabel || "추천 상품 보기") + "</button>";

    if (data.reviewProof && data.reviewProof.length) {
      html += '<ul class="sleepfit-proof">';
      data.reviewProof.slice(0, 3).forEach(function (item) {
        html += "<li>" + escapeHtml(item) + "</li>";
      });
      html += "</ul>";
    }

    if (data.alternatives && data.alternatives.length) {
      html += '<p class="sleepfit-subtitle">비교 후보</p><div class="sleepfit-alt-list">';
      data.alternatives.slice(0, 2).forEach(function (item, index) {
        html += '<button class="sleepfit-alt" type="button" data-sleepfit-action="product-click" data-sleepfit-kind="alternative" data-sleepfit-index="' + index + '" data-sleepfit-url="' + escapeHtml(item.url) + '" data-sleepfit-product-no="' + escapeHtml(item.productNo) + '">';
        html += '<img loading="lazy" src="' + escapeHtml(item.imageUrl || FALLBACK_IMAGE) + '" alt="' + escapeHtml(item.name) + '">';
        html += '<span><span class="sleepfit-alt-name">' + escapeHtml(item.name) + '</span><span class="sleepfit-alt-point">' + escapeHtml(item.differencePoint || item.reason) + "</span></span>";
        html += '<span class="sleepfit-arrow">›</span></button>';
      });
      html += "</div>";
    }

    if (data.crossSellProducts && data.crossSellProducts.length) {
      html += '<p class="sleepfit-subtitle">함께 보면 좋은 상품</p><div class="sleepfit-alt-list">';
      data.crossSellProducts.slice(0, 2).forEach(function (item, index) {
        html += '<button class="sleepfit-alt" type="button" data-sleepfit-action="product-click" data-sleepfit-kind="cross_sell" data-sleepfit-index="' + index + '" data-sleepfit-url="' + escapeHtml(item.url) + '" data-sleepfit-product-no="' + escapeHtml(item.productNo) + '">';
        html += '<img loading="lazy" src="' + escapeHtml(item.imageUrl || FALLBACK_IMAGE) + '" alt="' + escapeHtml(item.name) + '">';
        html += '<span><span class="sleepfit-alt-name">' + escapeHtml(item.name) + '</span><span class="sleepfit-alt-point">' + escapeHtml(item.reason) + "</span></span>";
        html += '<span class="sleepfit-arrow">›</span></button>';
      });
      html += "</div>";
    }

    return html + "</div>";
  }

  function bindShadow(root) {
    if (!root) return;
    Array.prototype.forEach.call(root.querySelectorAll("[data-sleepfit-action]"), function (node) {
      node.addEventListener("click", handleAction);
    });
    Array.prototype.forEach.call(root.querySelectorAll("img"), function (img) {
      img.addEventListener("error", function () {
        if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
      });
    });
  }

  function rerender() {
    renderFloating();
    renderInline();
  }

  function openPanel(start) {
    state.panelOpen = true;
    state.error = "";
    if (start) {
      state.started = true;
      state.step = 0;
      state.answers = {};
      state.recommendation = null;
      track("widget_open");
      track("quiz_start");
    } else {
      track("widget_open");
    }
    rerender();
  }

  function closePanel() {
    state.panelOpen = false;
    track("widget_close");
    rerender();
  }

  function answerQuestion(questionId, value) {
    state.answers[questionId] = value;
    track("answer_select", {
      questionId: questionId,
      answer: value
    });

    if (state.step < QUESTIONS.length - 1) {
      state.step += 1;
      rerender();
      return;
    }

    track("quiz_complete");
    requestRecommendation();
  }

  function fallbackRecommendation() {
    return {
      primaryProduct: {
        productNo: current && current.productNo ? String(current.productNo) : "330",
        name: current && current.productNo ? current.name || "슬립앤슬립 깊은잠베개" : "슬립앤슬립 깊은잠베개",
        url: current && current.productNo ? current.url : "https://sleepnsleepmall.com/product/detail.html?product_no=330",
        imageUrl: current && current.imageUrl ? current.imageUrl : FALLBACK_IMAGE,
        priceText: current && current.priceText ? current.priceText : "94,900원",
        optionHint: "추천 API가 지연되어 대표 옵션 기준으로 안내합니다. 상품상세의 S/M 옵션을 함께 비교해보세요.",
        reason: "수면 자세와 높이 취향을 기준으로 대표 베개를 먼저 확인해볼 수 있습니다.",
        proofCopy: "리뷰가 많은 대표 베개 라인입니다.",
        ctaLabel: current && current.productNo ? VARIANTS[abGroup].productCta : "추천 상품 보러가기"
      },
      alternatives: [],
      crossSellProducts: [],
      scenarioMessage: "일시적으로 추천 서버 응답이 지연되어 기본 추천을 표시합니다.",
      reviewProof: ["추천 저장 실패가 구매 흐름을 막지 않도록 기본 추천을 제공합니다."],
      cta: {
        label: current && current.productNo ? VARIANTS[abGroup].productCta : "추천 상품 보러가기",
        action: current && current.productNo ? "scroll_to_option" : "open_product"
      },
      abGroup: abGroup
    };
  }

  function requestRecommendation() {
    state.loading = true;
    state.error = "";
    rerender();

    var payload = {
      mallId: mallId,
      visitorId: visitorId,
      anonymousId: visitorId,
      sessionId: sessionId,
      abGroup: abGroup,
      page: pageContext(),
      pageType: current ? current.pageType : "other",
      product: current,
      currentProductNo: current && current.productNo ? current.productNo : undefined,
      answers: Object.assign({}, state.answers)
    };

    postJson("/api/sleepfit/recommend", payload, { timeout: 7000 })
      .then(function (data) {
        state.loading = false;
        state.recommendation = data;
        track("recommendation_shown", {
          recommendedProductNo: data.primaryProduct && data.primaryProduct.productNo,
          scenario: data.scenarioMessage || ""
        });
        if (data.primaryProduct) track("product_impression", { productNo: data.primaryProduct.productNo });
        (data.alternatives || []).forEach(function (item) {
          track("product_impression", { productNo: item.productNo, kind: "alternative" });
        });
        (data.crossSellProducts || []).forEach(function (item) {
          track("product_impression", { productNo: item.productNo, kind: "cross_sell" });
        });
        rerender();
      })
      .catch(function (error) {
        log("recommend failed", error);
        state.loading = false;
        state.error = "추천을 불러오지 못해 기본 추천을 표시합니다.";
        state.recommendation = fallbackRecommendation();
        track("error", { message: "recommend_failed" });
        rerender();
      });
  }

  function optionTarget() {
    return (
      document.querySelector("#totalProducts") ||
      document.querySelector(".xans-product-option") ||
      document.querySelector("[id*='option'], [class*='option']") ||
      document.querySelector(".infoArea") ||
      document.querySelector(".xans-product-detail")
    );
  }

  function scrollToOption() {
    var target = optionTarget();
    if (target && target.scrollIntoView) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.setAttribute("data-sleepfit-focus", "true");
      return true;
    }
    return false;
  }

  function goToProduct(url) {
    if (!url) return;
    window.location.href = url;
  }

  function handleAction(event) {
    var target = event.currentTarget;
    var action = target.getAttribute("data-sleepfit-action");

    if (action === "start") {
      openPanel(true);
      return;
    }

    if (action === "close") {
      closePanel();
      return;
    }

    if (action === "back") {
      state.step = Math.max(0, state.step - 1);
      rerender();
      return;
    }

    if (action === "answer") {
      answerQuestion(target.getAttribute("data-sleepfit-question"), target.getAttribute("data-sleepfit-answer"));
      return;
    }

    if (action === "primary-cta" && state.recommendation) {
      var primary = state.recommendation.primaryProduct;
      track("cta_click", {
        action: state.recommendation.cta.action,
        productNo: primary && primary.productNo
      });
      if (state.recommendation.cta.action === "scroll_to_option") {
        scrollToOption();
        closePanel();
      } else if (primary && primary.url) {
        goToProduct(primary.url);
      }
      return;
    }

    if (action === "product-click") {
      var kind = target.getAttribute("data-sleepfit-kind") || "alternative";
      var productNo = target.getAttribute("data-sleepfit-product-no") || "";
      var url = target.getAttribute("data-sleepfit-url") || "";
      track(kind === "cross_sell" ? "cross_sell_click" : "product_click", {
        productNo: productNo,
        kind: kind,
        index: target.getAttribute("data-sleepfit-index") || ""
      });
      goToProduct(url);
    }
  }

  function init() {
    current = detectProduct();
    if (!shouldRenderSurface(current.pageType)) {
      log("surface skipped", current.pageType);
      return;
    }

    createHost();
    mountInline();
    rerender();
    track("widget_view");

    if (autoOpen === "product" && current.pageType === "product_detail") {
      setTimeout(function () {
        openPanel(false);
      }, 1200);
    }

    window.sleepfitAI = {
      version: VERSION,
      open: function () {
        openPanel(true);
        return this.getState();
      },
      close: function () {
        closePanel();
        return this.getState();
      },
      reset: function () {
        state.step = 0;
        state.answers = {};
        state.recommendation = null;
        state.loading = false;
        openPanel(true);
        return this.getState();
      },
      track: function (eventType, metadata) {
        track(eventType, metadata || {});
      },
      getState: function () {
        return {
          version: VERSION,
          mallId: mallId,
          visitorId: visitorId,
          sessionId: sessionId,
          abGroup: abGroup,
          pageType: current ? current.pageType : "other",
          product: current,
          answers: Object.assign({}, state.answers),
          recommendation: state.recommendation
        };
      },
      destroy: function () {
        if (host && host.parentNode) host.parentNode.removeChild(host);
        if (inlineHost && inlineHost.parentNode) inlineHost.parentNode.removeChild(inlineHost);
        if (bannerHost && bannerHost.parentNode) bannerHost.parentNode.removeChild(bannerHost);
        window.__sleepfitAIInitialized = false;
      }
    };

    log("initialized", window.sleepfitAI.getState());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();`;
}
