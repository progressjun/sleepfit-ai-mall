export function buildWidgetScript() {
  return `
(function () {
  "use strict";

  var widgetBrand = "SlipAI";
  if ((window.__C24AI && window.__C24AI.version) || (window.__SLIPAI && window.__SLIPAI.version)) return;

  var VERSION = "0.2.4";
  var script =
    document.currentScript ||
    document.querySelector('script[src*="/widget/v1.js"]') ||
    document.querySelector('script[src*="/api/widget/v1.js"]');

  if (!script) return;

  var queuedCommands =
    window.slipai && window.slipai.q && typeof window.slipai.q.slice === "function"
      ? window.slipai.q.slice(0)
      : [];

  function queuedInitConfig() {
    for (var i = queuedCommands.length - 1; i >= 0; i -= 1) {
      var command = queuedCommands[i];
      if (!command || command[0] !== "init") continue;
      if (command[1] && typeof command[1] === "object") return command[1];
    }
    return {};
  }

  var initConfig = queuedInitConfig();
  var projectKey = script.getAttribute("data-project-key") || initConfig.projectKey || "";
  var mallId = script.getAttribute("data-mall-id") || initConfig.mallId || "";
  var widgetToken =
    script.getAttribute("data-widget-token") ||
    script.getAttribute("data-token") ||
    initConfig.widgetToken ||
    initConfig.token ||
    "";
  var dwellSeconds = Math.max(5, Number(script.getAttribute("data-dwell-seconds") || initConfig.dwellSeconds || "30"));
  var debug = script.getAttribute("data-debug") === "true" || initConfig.debug === true;
  var apiBase = initConfig.apiBase || new URL(script.src, window.location.href).origin;

  if (!projectKey || !mallId) {
    if (debug) console.warn("[" + widgetBrand + "] Missing data-project-key or data-mall-id.");
    return;
  }
  if (!/^pk_[A-Za-z0-9_-]+$/.test(projectKey)) {
    if (debug) console.error("[" + widgetBrand + "] Invalid data-project-key.");
    return;
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
    } catch (_) {}
  }

  function createId(prefix) {
    var bytes = new Uint8Array(8);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (var i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    }
    var raw = Array.prototype.map.call(bytes, function (value) {
      return value.toString(16).padStart(2, "0");
    }).join("");
    return prefix + "_" + raw;
  }

  var visitorId =
    safeStorageGet(window.localStorage, "slipai_vid") ||
    safeStorageGet(window.localStorage, "c24ai_vid") ||
    createId("vid");
  var sessionId =
    safeStorageGet(window.sessionStorage, "slipai_sid") ||
    safeStorageGet(window.sessionStorage, "c24ai_sid") ||
    createId("sid");
  safeStorageSet(window.localStorage, "slipai_vid", visitorId);
  safeStorageSet(window.localStorage, "c24ai_vid", visitorId);
  safeStorageSet(window.sessionStorage, "slipai_sid", sessionId);
  safeStorageSet(window.sessionStorage, "c24ai_sid", sessionId);

  function getMeta(name) {
    var tag = document.querySelector('meta[property="' + name + '"]') || document.querySelector('meta[name="' + name + '"]');
    return tag ? tag.getAttribute("content") || "" : "";
  }

  function firstText(selectors) {
    for (var i = 0; i < selectors.length; i += 1) {
      var node = document.querySelector(selectors[i]);
      if (node && node.textContent) {
        var value = node.textContent.trim();
        if (value) return value;
      }
    }
    return "";
  }

  function absoluteUrl(value) {
    try {
      return new URL(value, window.location.href).toString();
    } catch (_) {
      return value || "";
    }
  }

  function firstImage() {
    var selectors = [
      ".xans-product-detail .keyImg img",
      ".xans-product-detail .prdImg img",
      ".xans-product-detail img[src]",
      ".product-image img",
      "#big_img",
      "#zoom_image",
      "img[src*='thumb']",
    ];
    var attrs = ["src", "data-src", "data-original"];

    for (var i = 0; i < selectors.length; i += 1) {
      var node = document.querySelector(selectors[i]);
      if (!node) continue;
      for (var j = 0; j < attrs.length; j += 1) {
        var value = node.getAttribute(attrs[j]) || node.currentSrc;
        if (value && value.indexOf("data:") !== 0) return absoluteUrl(value);
      }
    }
    return "";
  }

  function findProductNo() {
    var params = new URLSearchParams(window.location.search);
    var queryNo = params.get("product_no") || params.get("productNo") || params.get("product_id");
    if (queryNo) return queryNo;

    var datasetNode = document.querySelector("[data-product-no], [data-product-id], [ec-data-product-no]");
    if (datasetNode) {
      return (
        datasetNode.getAttribute("data-product-no") ||
        datasetNode.getAttribute("data-product-id") ||
        datasetNode.getAttribute("ec-data-product-no") ||
        ""
      );
    }

    var match = window.location.pathname.match(/\\/product\\/(?:[^/]+\\/)?([0-9]+)(?:\\/|$)/);
    return match ? match[1] : "";
  }

  function detectProduct() {
    var productNo = findProductNo();
    var title = firstText([".xans-product-detail h2", ".xans-product-detail .name", ".headingArea h2", "h1"]) || document.title;
    var productUrl = window.location.href;
    var price =
      getMeta("product:price:amount") ||
      firstText([".xans-product-detail .price", ".product_price", ".price", "#span_product_price_text"]);

    return {
      pageType: productNo || /\\/product\\//.test(window.location.pathname) ? "product_detail" : "other",
      productNo: productNo || undefined,
      name: title || undefined,
      priceText: price || undefined,
      imageUrl: firstImage() || absoluteUrl(getMeta("og:image")) || undefined,
      url: productUrl,
    };
  }

  function isCandidatePath(pathname) {
    if (!pathname) return false;
    if (pathname.indexOf("/admin") === 0) return false;
    if (pathname.indexOf("/member") === 0) return false;
    if (pathname.indexOf("/order") === 0) return false;
    if (pathname.indexOf("/cart") === 0) return false;
    return true;
  }

  function collectDiscoveryLinks() {
    var anchors = document.querySelectorAll("a[href]");
    var links = [];
    var origin = window.location.origin;
    var productUrlHint = /\\/product\\//i;

    for (var i = 0; i < anchors.length; i += 1) {
      if (links.length >= 120) break;
      var anchor = anchors[i];
      var href = anchor.getAttribute("href");
      if (!href) continue;

      var raw = href.trim();
      if (!raw || raw.indexOf("#") === 0 || raw.indexOf("javascript:") === 0 || raw.indexOf("mailto:") === 0 || raw.indexOf("tel:") === 0) {
        continue;
      }

      try {
        var parsed = new URL(raw, window.location.href);
        if (parsed.origin !== origin) continue;
        if (!isCandidatePath(parsed.pathname)) continue;
        if (productUrlHint.test(window.location.pathname) && productUrlHint.test(parsed.pathname)) {
          // keep if same page type.
        }
        var normalized = parsed.toString();
        if (links.indexOf(normalized) === -1) links.push(normalized);
      } catch (_) {}
    }

    return links.slice(0, 80);
  }

  function pageContext() {
    return {
      url: window.location.href,
      referrer: document.referrer || "",
      title: document.title || "",
      viewport: {
        width: window.innerWidth || 0,
        height: window.innerHeight || 0,
      },
    };
  }

  function payloadBase() {
    return {
      projectKey: projectKey,
      mallId: mallId,
      widgetToken: widgetToken,
      visitorId: visitorId,
      sessionId: sessionId,
      page: pageContext(),
      product: detectProduct(),
    };
  }

  function postJson(path, payload) {
    return fetch(apiBase + path, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
        "X-C24AI-Version": VERSION,
        "X-SlipAI-Version": VERSION,
      },
      body: JSON.stringify(payload),
    }).then(function (response) {
      if (!response.ok) throw new Error("Request failed: " + response.status);
      return response.json().catch(function () {
        return { ok: true, status: response.status };
      });
    });
  }

  function track(eventName, metadata) {
    var payload = payloadBase();
    payload.eventName = eventName;
    payload.metadata = metadata || {};
    payload.occurredAt = new Date().toISOString();
    if (eventName === "dwell_30s") payload.dwellSeconds = dwellSeconds;

    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        if (navigator.sendBeacon(apiBase + "/api/onsite/events", blob)) return;
      }
    } catch (_) {}

    return postJson("/api/onsite/events", payload).catch(function () {});
  }

  function sendDiscovery(force) {
    var now = Date.now();
    if (!force && discoveryInFlight) return;
    if (!force && now - lastDiscoveryAt < 25000) return;

    var links = collectDiscoveryLinks();
    if (!links.length) return;
    lastDiscoveryAt = now;

    var payload = payloadBase();
    payload.pageUrl = window.location.href;
    payload.discoveredUrls = links;
    discoveryInFlight = true;

    postJson("/api/onsite/discovery", payload)
      .catch(function () {})
      .finally(function () {
        discoveryInFlight = false;
      });
  }

  function createHost() {
    var host = document.createElement("div");
    host.style.position = "fixed";
    host.style.right = "18px";
    host.style.bottom = "18px";
    host.style.zIndex = "2147483000";
    host.style.pointerEvents = "none";
    host.style.transform = "translateZ(0)";

    function positionHost() {
      if (window.innerWidth <= 420) {
        host.style.left = "14px";
        host.style.right = "14px";
      } else {
        host.style.left = "auto";
        host.style.right = "18px";
      }
    }
    positionHost();
    window.addEventListener("resize", positionHost, { passive: true });
    document.documentElement.appendChild(host);
    return host;
  }

  var host = createHost();
  var shadow = host.attachShadow({ mode: "open" });
  var css =
    ".wrap{all:initial;position:relative;width:360px;max-width:100%;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;pointer-events:auto;color:#101010}.banner,.chat{box-sizing:border-box;border:1px solid rgba(13,13,13,.12);background:rgba(255,255,255,.98);box-shadow:0 18px 54px rgba(0,0,0,.16),0 1px 0 rgba(255,255,255,.8) inset;border-radius:14px;overflow:hidden}.banner{display:none;margin-bottom:10px;transform-origin:bottom right}.banner.on{display:block;animation:c24aiSlideIn .36s cubic-bezier(.2,.8,.2,1)}.banner-body{padding:14px}.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:11px;color:#6b7280;font-weight:700}.eyebrow:before{content:'';display:inline-block;width:7px;height:7px;border-radius:999px;background:#10b981;box-shadow:0 0 0 4px rgba(16,185,129,.14);animation:c24aiPulse 2.2s ease-in-out infinite}.msg{margin:10px 0 12px;font-size:14px;line-height:1.48;font-weight:650}.review-wrap{display:none;margin-bottom:10px}.review-card{position:relative;background:#f7f7f8;border:1px solid #e5e5e5;border-radius:8px;padding:11px 12px 11px 42px;color:#1d2430}.review-card:before{content:'';position:absolute;left:14px;top:16px;width:12px;height:12px;border-radius:999px;background:linear-gradient(135deg,#10b981,#34d399);box-shadow:0 0 0 4px rgba(16,185,129,.12)}.review-copy{font-size:12px;line-height:1.5;font-weight:500}.review-meta{margin-top:6px;font-size:10px;color:#6b7280}.review-dots{display:flex;gap:4px;margin-top:8px}.review-dot{width:5px;height:5px;border-radius:999px;background:#d7d7d7;transition:all .2s ease}.review-dot.on{width:18px;background:#101010}.product-strip{display:grid;gap:7px}.product-card{appearance:none;width:100%;box-sizing:border-box;text-align:left;background:#fff;border:1px solid #ececf1;border-radius:8px;padding:10px 12px 10px 11px;display:grid;grid-template-columns:minmax(0,58px) minmax(0,1fr);gap:10px;align-items:center;cursor:pointer}.product-card:after{content:'';position:absolute;right:12px;top:50%;width:6px;height:6px;border-top:1.5px solid #8e8ea0;border-right:1.5px solid #8e8ea0;transform:translateY(-50%) rotate(45deg)}.product-card:hover{transform:translateY(-1px);border-color:#d9d9e3;box-shadow:0 8px 18px rgba(0,0,0,.07)}.product-media{width:58px;height:58px;border-radius:8px;overflow:hidden;background:#f4f4f4;border:1px solid #ececf1}.product-media img{display:block;width:100%;height:100%;object-fit:cover}.product-copy{min-width:0}.product-kicker{font-size:10px;color:#6b7280;font-weight:700}.product-name{margin-top:3px;font-size:12px;line-height:1.35;font-weight:760}.product-reason{margin-top:4px;font-size:11px;color:#5f6368;line-height:1.4}.product-price{margin-top:5px;font-size:11px;font-weight:760;color:#0d0d0d}.actions{display:flex;gap:8px;margin-top:12px}.btn{appearance:none;border:0;border-radius:8px;padding:10px 12px;font-size:13px;line-height:1.2;font-weight:720;cursor:pointer}.btn:hover{transform:translateY(-1px)}.primary{background:#0d0d0d;color:#fff}.ghost{background:#f3f3f5;color:#171717;border:1px solid #e2e2e2}.tiny{margin-top:8px;font-size:11px;color:#8a8fa1}.chat{display:none;height:430px;max-height:70vh;transform-origin:bottom right}.chat.on{display:flex;flex-direction:column;animation:c24aiPanelIn .28s cubic-bezier(.2,.8,.2,1)}.head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #ececf1}.title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:760}.title:before{content:'';width:8px;height:8px;border-radius:999px;background:#10b981;box-shadow:0 0 0 4px rgba(16,185,129,.16);animation:c24aiPulse 1.8s ease-in-out infinite}.close,.launcher{appearance:none;border:0;cursor:pointer}.close{background:#f4f4f4;color:#555;border-radius:8px;font-size:18px;line-height:1;width:30px;height:30px}.messages{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#f7f7f8}.bubble{max-width:88%;border-radius:10px;padding:9px 10px;font-size:13px;line-height:1.42;animation:c24aiBubble .2s ease-out}.assistant{align-self:flex-start;background:#fff;border:1px solid #e5e5e5}.visitor{align-self:flex-end;background:#0d0d0d;color:#fff}.typing{display:flex;gap:4px;align-items:center}.typing i{display:block;width:6px;height:6px;border-radius:999px;background:#10b981;animation:c24aiDot 1s ease-in-out infinite}.typing i:nth-child(2){animation-delay:.14s}.typing i:nth-child(3){animation-delay:.28s}.form{display:flex;gap:8px;padding:10px;border-top:1px solid #ececf1}.input{min-width:0;flex:1;border:1px solid #d9d9e3;border-radius:8px;padding:10px;font-size:13px;outline:none}.input:focus{border-color:#a9a9b3;box-shadow:0 0 0 3px rgba(13,13,13,.06)}.launcher{position:relative;display:flex;align-items:center;justify-content:center;margin-left:auto;width:58px;height:58px;border-radius:999px;background:#0d0d0d;color:#fff;font-size:14px;font-weight:760;box-shadow:0 14px 38px rgba(0,0,0,.22);overflow:hidden;animation:c24aiFloat 3.4s ease-in-out infinite}.launcher:before{content:'';position:absolute;inset:8px;border-radius:999px;border:1px solid rgba(255,255,255,.22)}.launcher:after{content:'';position:absolute;inset:-1px;border-radius:999px;border:1px solid rgba(255,255,255,.18);animation:c24aiRing 2.8s ease-out infinite}.product-item{position:relative}.hidden{display:none} @keyframes c24aiSlideIn{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes c24aiPanelIn{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes c24aiFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}@keyframes c24aiPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(.86)}}@keyframes c24aiRing{0%{opacity:.7;transform:scale(.84)}100%{opacity:0;transform:scale(1.18)}}@keyframes c24aiBubble{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}@keyframes c24aiDot{0%,100%{opacity:.35;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}@media (max-width:480px){.launcher{width:56px;height:56px}.chat{height:68vh}.msg{font-size:13px}.product-price{font-size:10.5px}.product-reason{font-size:10px}}";

  shadow.innerHTML =
    "<style>" +
    css +
    "</style>" +
    '<div class="wrap">' +
    '<div class="banner" part="banner"><div class="banner-body">' +
    '<div class="eyebrow">SlipAI Recommendation</div>' +
    '<div class="msg"></div>' +
    '<div class="review-wrap"><div class="review-card"><div class="review-copy"></div><div class="review-meta"></div><div class="review-dots"></div></div></div>' +
    '<div class="product-strip"></div>' +
    '<div class="actions"><button class="btn primary" type="button"></button><button class="btn ghost" type="button">Talk to advisor</button></div>' +
    '<div class="tiny"></div>' +
    '</div></div>' +
    '<div class="chat" part="chat"><div class="head"><div class="title">SlipAI advisor</div><button class="close" type="button" aria-label="Close chat">×</button></div>' +
    '<div class="messages"></div>' +
    '<form class="form"><input class="input" autocomplete="off" placeholder="Ask about product quality, reviews, or options" /><button class="btn primary" type="submit">Send</button></form>' +
    '</div>' +
    '<button class="launcher" type="button" aria-label="Open SlipAI advisor">SlipAI</button>' +
    "</div>";

  var banner = shadow.querySelector(".banner");
  var bannerMessage = shadow.querySelector(".banner .msg");
  var reviewCard = shadow.querySelector(".review-card");
  var reviewCopy = shadow.querySelector(".review-copy");
  var reviewMeta = shadow.querySelector(".review-meta");
  var reviewDots = shadow.querySelector(".review-dots");
  var reviewWrap = shadow.querySelector(".review-wrap");
  var productStrip = shadow.querySelector(".product-strip");
  var primaryButton = shadow.querySelector(".banner .primary");
  var ghostButton = shadow.querySelector(".banner .ghost");
  var chat = shadow.querySelector(".chat");
  var launcher = shadow.querySelector(".launcher");
  var closeButton = shadow.querySelector(".close");
  var messages = shadow.querySelector(".messages");
  var form = shadow.querySelector(".form");
  var input = shadow.querySelector(".input");
  var disclaimer = shadow.querySelector(".tiny");

  var recommendationRequested = false;
  var dwellTimer = 0;
  var dwellStartedAt = 0;
  var reviewTimer = 0;
  var reviewIndex = 0;
  var conversationId = "";
  var currentRoute = "";
  var scrollTracked = false;
  var routeDebounce = 0;
  var spaPatched = false;

  function addMessage(role, text) {
    var bubble = document.createElement("div");
    bubble.className = "bubble " + (role === "visitor" ? "visitor" : "assistant");
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  }

  function addTypingIndicator() {
    var bubble = document.createElement("div");
    bubble.className = "bubble assistant typing";
    bubble.setAttribute("aria-label", "SlipAI is writing");
    bubble.innerHTML = "<i></i><i></i><i></i>";
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  }

  function runCta(action) {
    track("banner_cta_click", { action: action });
    if (action === "open_chat") {
      openChat();
      return;
    }

    var selector =
      action === "add_to_cart"
        ? 'a[href*="basket"], button[name*="basket"], .btnBasket, #actionCart'
        : 'a[href*="order"], a[href*="purchase"], button[name*="buy"], .btnBuy, #actionBuy';
    var target = document.querySelector(selector);
    if (target && typeof target.click === "function") {
      target.click();
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showReviewHighlights(items) {
    var filtered = (items || []).filter(function (item) {
      return typeof item === "string" && item.trim().length > 0;
    });
    var total = filtered.length;

    if (!total) {
      reviewWrap.classList.add("hidden");
      reviewDots.textContent = "";
      return;
    }

    reviewWrap.classList.remove("hidden");
    function renderReview(index) {
      var safeIndex = ((index % total) + total) % total;
      reviewCopy.textContent = filtered[safeIndex];
      reviewMeta.textContent = "Review " + (safeIndex + 1) + " / " + total;
      reviewDots.textContent = "";
      for (var i = 0; i < total; i += 1) {
        var dot = document.createElement("span");
        dot.className = "review-dot" + (i === safeIndex ? " on" : "");
        reviewDots.appendChild(dot);
      }
    }

    reviewIndex = 0;
    renderReview(reviewIndex);
    if (reviewTimer) window.clearInterval(reviewTimer);
    reviewTimer = window.setInterval(function () {
      reviewIndex += 1;
      renderReview(reviewIndex);
    }, 2600);
  }

  function renderProducts(products) {
    var items = (products || []).filter(Boolean).slice(0, 3);
    productStrip.textContent = "";
    productStrip.style.display = items.length ? "grid" : "none";

    for (var i = 0; i < items.length; i += 1) {
      var item = items[i];
      var button = document.createElement("button");
      button.type = "button";
      button.className = "product-item product-card";
      button.setAttribute("aria-label", (item.name || "추천 상품") + " product");
      button.setAttribute("data-product-no", item.productNo || "");

      if (item.imageUrl) {
        var media = document.createElement("div");
        var img = document.createElement("img");
        media.className = "product-media";
        img.src = item.imageUrl;
        img.alt = item.name || "Product image";
        img.loading = "lazy";
        img.decoding = "async";
        img.onerror = function () {
          if (media && media.parentNode) media.parentNode.removeChild(media);
        };
        media.appendChild(img);
        button.appendChild(media);
      }

      var copy = document.createElement("div");
      copy.className = "product-copy";
      var kicker = document.createElement("div");
      kicker.className = "product-kicker";
      kicker.textContent = "Recommended item " + (i + 1);
      var name = document.createElement("div");
      name.className = "product-name";
      name.textContent = item.name || "추천 상품";
      var reason = document.createElement("div");
      reason.className = "product-reason";
      reason.textContent = item.reason || "추천 사유가 준비 중입니다.";
      var price = document.createElement("div");
      price.className = "product-price";
      price.textContent = item.priceText || "";
      copy.appendChild(kicker);
      copy.appendChild(name);
      copy.appendChild(reason);
      if (item.priceText) copy.appendChild(price);
      button.appendChild(copy);

      (function () {
        var nextProductNo = item.productNo;
        var nextUrl = item.url;
        var idx = i;
        button.onclick = function () {
          track("banner_cta_click", { action: "related_product_click", productNo: nextProductNo || "", index: idx + 1 });
          if (nextUrl && nextUrl !== window.location.href) {
            window.location.href = nextUrl;
          } else {
            openChat();
          }
        };
      })();

      productStrip.appendChild(button);
    }
  }

  function clearBanner() {
    if (reviewTimer) {
      window.clearInterval(reviewTimer);
      reviewTimer = 0;
    }
    banner.classList.remove("on");
    reviewCopy.textContent = "";
    reviewMeta.textContent = "";
    reviewDots.textContent = "";
    disclaimer.textContent = "";
    recommendationRequested = false;
  }

  function showBanner(data) {
    bannerMessage.textContent = data.message || "Here are helpful review highlights and similar products.";
    showReviewHighlights(data.reviewHighlights || []);
    renderProducts(data.products || []);
    disclaimer.textContent = data.disclosure || "";
    primaryButton.textContent = data.cta && data.cta.label ? data.cta.label : "Buy now";
    primaryButton.onclick = function () {
      runCta(data.cta && data.cta.action ? data.cta.action : "go_to_purchase");
    };
    ghostButton.onclick = openChat;
    banner.classList.add("on");
  }

  function getRouteKey() {
    var product = detectProduct();
    return window.location.pathname + window.location.search + "|" + (product.productNo || "noproduct");
  }

  function clearDwell() {
    if (dwellTimer) {
      window.clearTimeout(dwellTimer);
      dwellTimer = 0;
    }
  }

  var discoveryInFlight = false;
  var lastDiscoveryAt = 0;

  function requestRecommendation() {
    if (recommendationRequested) return;
    var product = detectProduct();
    if (product.pageType !== "product_detail") return;
    recommendationRequested = true;

    track("dwell_30s");
    postJson("/api/onsite/recommendation", Object.assign(payloadBase(), { recentEvents: ["page_view", "dwell_30s"] }))
      .then(function (result) {
        if (result && result.data) showBanner(result.data);
      })
      .catch(function () {});
  }

  function scheduleRecommendation() {
    if (recommendationRequested || dwellTimer || document.visibilityState === "hidden") return;
    var remaining = Math.max(0, dwellSeconds * 1000 - Math.max(0, Date.now() - dwellStartedAt));
    if (remaining <= 0) {
      requestRecommendation();
      return;
    }
    dwellTimer = window.setTimeout(function () {
      dwellTimer = 0;
      requestRecommendation();
    }, remaining);
  }

  function openChat() {
    chat.classList.add("on");
    launcher.classList.add("hidden");
    if (!messages.childElementCount) {
      addMessage("assistant", "SlipAI is ready to help with this store's products, reviews, and options.");
    }
    track("chat_open");
    window.setTimeout(function () {
      input.focus();
    }, 0);
  }

  function closeChat() {
    chat.classList.remove("on");
    launcher.classList.remove("hidden");
  }

  function sendChat(text) {
    addMessage("visitor", text);
    var typing = addTypingIndicator();
    track("chat_message", { length: text.length });
    postJson("/api/onsite/chat", Object.assign(payloadBase(), { message: text, conversationId: conversationId || undefined }))
      .then(function (result) {
        if (result && result.conversationId) conversationId = result.conversationId;
        if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
        addMessage("assistant", result && result.data && result.data.message ? result.data.message : "Preparing a response now. Please ask again in a moment.");
      })
      .catch(function () {
        if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
        addMessage("assistant", "Temporary error while processing your question. Please retry in a second.");
      });
  }

  function bindSpaNavigation() {
    if (spaPatched) return;
    spaPatched = true;
    var onChange = function () {
      if (routeDebounce) window.clearTimeout(routeDebounce);
      routeDebounce = window.setTimeout(function () {
        var next = getRouteKey();
        if (next === currentRoute) return;
        currentRoute = next;
        clearDwell();
        clearBanner();
        track("page_view");
        sendDiscovery();

        var product = detectProduct();
        if (product.pageType === "product_detail") {
          dwellStartedAt = Date.now();
          scheduleRecommendation();
        }
      }, 80);
    };

    if (window.history && window.history.pushState) {
      var originalPush = window.history.pushState;
      var originalReplace = window.history.replaceState;
      window.history.pushState = function () {
        var result = originalPush.apply(this, arguments);
        onChange();
        return result;
      };
      window.history.replaceState = function () {
        var result = originalReplace.apply(this, arguments);
        onChange();
        return result;
      };
    }
    window.addEventListener("popstate", onChange);
    onChange();
  }

  launcher.addEventListener("click", openChat);
  closeButton.addEventListener("click", closeChat);
  ghostButton.addEventListener("click", openChat);
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var value = input.value.trim();
    if (!value) return;
    input.value = "";
    sendChat(value);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      clearDwell();
      dwellStartedAt = Date.now();
      return;
    }
    scheduleRecommendation();
  });

  window.addEventListener(
    "scroll",
    function () {
      if (scrollTracked) return;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if ((window.scrollY / max) > 0.5) {
        scrollTracked = true;
        track("scroll", { depth: 50 });
      }
    },
    { passive: true },
  );

  document.addEventListener(
    "click",
    function (event) {
      var target = event.target && event.target.closest ? event.target.closest("a,button,input[type='button'],input[type='submit']") : null;
      if (!target) return;
      var text = (target.textContent || target.value || "").trim();
      var href = target.getAttribute("href") || "";
      if (/basket|cart|add_to_cart/i.test((text + " " + href).toLowerCase())) {
        track("cart_click", { text: text.slice(0, 80), href: href });
      }
    },
    true,
  );

  function init() {
    track("page_view");
    sendDiscovery(true);
    currentRoute = getRouteKey();
    bindSpaNavigation();

    if (detectProduct().pageType === "product_detail") {
      dwellStartedAt = Date.now();
      scheduleRecommendation();
    }

    window.__C24AI = {
      version: VERSION,
      config: { projectKey: projectKey, mallId: mallId },
      track: track,
      openChat: openChat,
      closeChat: closeChat,
      refreshProductContext: function () {
        clearBanner();
        if (detectProduct().pageType === "product_detail") {
          dwellStartedAt = Date.now();
          scheduleRecommendation();
        }
        return payloadBase().product;
      },
      getState: function () {
        return {
          version: VERSION,
          route: getRouteKey(),
          visitorId: visitorId,
          sessionId: sessionId,
          hasBanner: banner.classList.contains("on"),
          recommended: recommendationRequested,
        };
      },
    };
    window.__SLIPAI = window.__C24AI;

    window.slipai = function (command, payload) {
      if (command === "open" || command === "openChat") {
        openChat();
        return window.__C24AI;
      }
      if (command === "close" || command === "closeChat") {
        closeChat();
        return window.__C24AI;
      }
      if (command === "refresh" || command === "refreshProductContext") {
        return window.__C24AI.refreshProductContext();
      }
      if (command === "getState") {
        return window.__C24AI.getState();
      }
      if (command === "recommend" || command === "requestRecommendation") {
        requestRecommendation();
        return window.__C24AI;
      }
      if (command === "track") {
        var eventName = typeof payload === "string" ? payload : payload && payload.eventName;
        var metadata = payload && typeof payload === "object" ? payload.metadata || {} : {};
        if (eventName) track(eventName, metadata);
        return window.__C24AI;
      }
      return window.__C24AI;
    };
    window.slipai.version = VERSION;
    window.slipai.q = [];

    for (var i = 0; i < queuedCommands.length; i += 1) {
      if (!queuedCommands[i] || queuedCommands[i][0] === "init") continue;
      window.slipai.apply(window, queuedCommands[i]);
    }
  }

  init();
})();`;
}


