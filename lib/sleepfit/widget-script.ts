export function buildSleepfitWidgetScript() {
  return `
(function () {
  "use strict";

  if (window.sleepfitAI && window.sleepfitAI.version) return;

  var VERSION = "0.1.0";
  var BRAND = "SleepFit AI";
  var script =
    document.currentScript ||
    document.querySelector('script[src*="/sleepfit.js"]') ||
    document.querySelector('script[src*="/api/sleepfit.js"]');

  if (!script) return;

  var mallId = script.getAttribute("data-mall-id") || "sleepnsleepmall";
  var debug = script.getAttribute("data-debug") === "true";
  var apiBase = script.getAttribute("data-api-base") || new URL(script.src, window.location.href).origin;

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
    } catch (_) {}
  }

  function createId(prefix) {
    var bytes = new Uint8Array(8);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (var i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    }
    return (
      prefix +
      "_" +
      Array.prototype.map
        .call(bytes, function (value) {
          return value.toString(16).padStart(2, "0");
        })
        .join("")
    );
  }

  var visitorId = safeStorageGet(window.localStorage, "sleepfit_vid") || createId("sfv");
  var sessionId = safeStorageGet(window.sessionStorage, "sleepfit_sid") || createId("sfs");
  safeStorageSet(window.localStorage, "sleepfit_vid", visitorId);
  safeStorageSet(window.sessionStorage, "sleepfit_sid", sessionId);

  function getMeta(name) {
    var tag = document.querySelector('meta[property="' + name + '"]') || document.querySelector('meta[name="' + name + '"]');
    return tag ? tag.getAttribute("content") || "" : "";
  }

  function firstText(selectors) {
    for (var i = 0; i < selectors.length; i += 1) {
      var node = document.querySelector(selectors[i]);
      if (!node || !node.textContent) continue;
      var value = node.textContent.replace(/\\s+/g, " ").trim();
      if (value) return value;
    }
    return "";
  }

  function absoluteUrl(value) {
    try {
      return new URL(value || "", window.location.href).toString();
    } catch (_) {
      return value || "";
    }
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

  function firstImage() {
    var selectors = [
      ".xans-product-detail .keyImg img",
      ".xans-product-detail .prdImg img",
      ".xans-product-detail img[src]",
      "#prdDetailImg img",
      "#big_img",
      "#zoom_image",
      ".prdList__item img",
    ];
    var attrs = ["src", "data-src", "data-original", "ec-data-src"];

    for (var i = 0; i < selectors.length; i += 1) {
      var node = document.querySelector(selectors[i]);
      if (!node) continue;
      for (var j = 0; j < attrs.length; j += 1) {
        var value = node.getAttribute(attrs[j]) || node.currentSrc;
        if (value && value.indexOf("data:") !== 0) return absoluteUrl(value);
      }
    }

    return absoluteUrl(getMeta("og:image"));
  }

  function detectPageType(productNo) {
    var pathname = window.location.pathname || "/";
    var lowerPath = pathname.toLowerCase();
    if (productNo || /\\/product\\//i.test(pathname) || /product_no=/i.test(window.location.search)) return "product_detail";
    if (lowerPath === "/" || lowerPath === "/index.html" || lowerPath === "/index.htm") return "home";
    if (/\\/(category|collection|collections|search|shop|list)\\b/i.test(lowerPath) || /cate_no=|category_no=|keyword=/i.test(window.location.search)) {
      return "collection";
    }
    if (/\\/(cart|basket)\\b/i.test(lowerPath)) return "cart";
    if (/\\/(order|checkout)\\b/i.test(lowerPath)) return "checkout";
    return "other";
  }

  function detectProduct() {
    var productNo = findProductNo();
    var pageType = detectPageType(productNo);
    var name =
      firstText([".xans-product-detail h2", ".xans-product-detail .name", ".headingArea h2", ".infoArea h1", "h1"]) ||
      getMeta("og:title") ||
      document.title ||
      "";
    var price =
      firstText(["#span_product_price_text", ".xans-product-detail .price", ".product_price", ".price"]) ||
      getMeta("product:price:amount");

    return {
      pageType: pageType,
      productNo: productNo || undefined,
      name: name || undefined,
      priceText: price || undefined,
      imageUrl: firstImage() || undefined,
      url: window.location.href,
    };
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
      mallId: mallId,
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
        "X-SleepFit-Version": VERSION,
      },
      body: JSON.stringify(payload),
    }).then(function (response) {
      if (!response.ok) throw new Error("SleepFit request failed: " + response.status);
      return response.json();
    });
  }

  function track(eventName, metadata) {
    var payload = payloadBase();
    payload.eventName = eventName;
    payload.metadata = metadata || {};
    payload.occurredAt = new Date().toISOString();

    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        if (navigator.sendBeacon(apiBase + "/api/sleepfit/events", blob)) return;
      }
    } catch (_) {}

    return postJson("/api/sleepfit/events", payload).catch(function () {});
  }

  var questions = [
    {
      id: "posture",
      title: "주로 어떤 자세로 주무세요?",
      options: [
        { value: "side", label: "옆으로 자요", helper: "어깨 폭과 베개 높이를 중요하게 봅니다." },
        { value: "back", label: "바로 누워 자요", helper: "목과 뒤통수의 균형감을 봅니다." },
        { value: "stomach", label: "엎드려 자요", helper: "낮고 부담 적은 높이를 우선합니다." },
        { value: "mixed", label: "자주 뒤척여요", helper: "여러 자세를 버티는 타입을 찾습니다." },
      ],
    },
    {
      id: "heightPreference",
      title: "베개 높이는 어떤 쪽이 편하세요?",
      options: [
        { value: "low", label: "낮은 편", helper: "목이 꺾이지 않는 낮은 후보를 봅니다." },
        { value: "medium", label: "중간", helper: "가장 무난한 높이부터 추천합니다." },
        { value: "high", label: "높은 편", helper: "어깨 폭과 지지감을 더 반영합니다." },
        { value: "unsure", label: "잘 모르겠어요", helper: "조절 가능한 상품을 우선합니다." },
      ],
    },
    {
      id: "bodyFrame",
      title: "체형은 어느 쪽에 가까우세요?",
      options: [
        { value: "small", label: "작은 편", helper: "낮은 세팅을 먼저 고려합니다." },
        { value: "average", label: "보통", helper: "중간 높이와 조절형을 봅니다." },
        { value: "large", label: "큰 편", helper: "넓은 폭과 받침감을 더 봅니다." },
      ],
    },
    {
      id: "heatSensitivity",
      title: "잘 때 더위를 많이 타나요?",
      options: [
        { value: "high", label: "많이 타요", helper: "냉감 침구와 커버까지 같이 봅니다." },
        { value: "medium", label: "보통", helper: "필요하면 냉감 상품을 대안으로 둡니다." },
        { value: "low", label: "거의 안 타요", helper: "자세와 높이를 더 우선합니다." },
      ],
    },
    {
      id: "budget",
      title: "예산은 어느 정도로 볼까요?",
      options: [
        { value: "value", label: "합리적인 가격", helper: "가격 부담이 낮은 후보를 우선합니다." },
        { value: "mid", label: "중간 가격대", helper: "대표 상품 중심으로 추천합니다." },
        { value: "premium", label: "프리미엄도 가능", helper: "소재와 지지감 높은 후보를 봅니다." },
        { value: "flexible", label: "추천이 맞으면 OK", helper: "적합도를 가장 우선합니다." },
      ],
    },
  ];

  var answers = {};
  var currentStep = 0;
  var opened = false;
  var recommendation = null;

  function createHost(product) {
    var host = document.createElement("div");
    host.setAttribute("data-sleepfit-host", "true");

    if (product.pageType === "product_detail") {
      host.style.display = "block";
      host.style.margin = "14px 0";
      host.style.maxWidth = "460px";
      var target =
        document.querySelector("#span_product_price_text") ||
        document.querySelector("#optionG") ||
        document.querySelector(".productOption") ||
        document.querySelector(".infoArea") ||
        document.querySelector(".xans-product-detail");
      if (target && target.parentNode) {
        target.parentNode.insertBefore(host, target.nextSibling);
      } else {
        document.body.appendChild(host);
      }
    } else {
      host.style.position = "fixed";
      host.style.right = "18px";
      host.style.bottom = "18px";
      host.style.zIndex = "2147483001";
      host.style.maxWidth = "calc(100vw - 28px)";
      host.setAttribute("role", "button");
      host.setAttribute("tabindex", "0");
      host.setAttribute("aria-label", "나에게 맞는 베개 찾기");
      host.setAttribute("aria-expanded", "false");
      document.documentElement.appendChild(host);
    }

    return host;
  }

  var product = detectProduct();
  var host = createHost(product);
  var shadow = host.attachShadow({ mode: "open" });

  var css =
    ".sf{all:initial;box-sizing:border-box;color:#1d1713;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans KR',sans-serif;letter-spacing:0}.sf *{box-sizing:border-box;letter-spacing:0}.launcher{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;background:#231914;color:#fff;padding:13px 16px;font-size:14px;font-weight:800;box-shadow:0 14px 34px rgba(32,22,16,.22);cursor:pointer;pointer-events:auto}.launcher:hover{transform:translateY(-1px)}.dot{width:8px;height:8px;border-radius:999px;background:#90e0c1;box-shadow:0 0 0 4px rgba(144,224,193,.18)}.panel{width:390px;max-width:100%;border:1px solid rgba(35,25,20,.12);border-radius:10px;background:#fff;box-shadow:0 24px 70px rgba(32,22,16,.18);overflow:hidden;pointer-events:auto}.inline .panel{width:100%;box-shadow:0 12px 28px rgba(32,22,16,.08)}.closed .panel{display:none}.inline.closed .panel{display:block}.inline .launcher{display:none}.head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:16px 16px 13px;border-bottom:1px solid #eee7e1;background:#fffaf6}.title{font-size:15px;line-height:1.35;font-weight:900;word-break:keep-all}.sub{margin-top:4px;color:#77685d;font-size:12px;line-height:1.45;word-break:keep-all}.close{appearance:none;border:0;background:#f1ebe5;color:#5d4e44;width:30px;height:30px;border-radius:8px;font-size:18px;line-height:1;cursor:pointer}.body{padding:15px 16px 16px}.progress{height:5px;border-radius:999px;background:#eee7e1;overflow:hidden;margin-bottom:14px}.bar{height:100%;width:20%;border-radius:999px;background:#5b3a27;transition:width .24s ease}.q{font-size:17px;font-weight:900;line-height:1.38;word-break:keep-all}.opts{display:grid;gap:8px;margin-top:13px}.opt{appearance:none;width:100%;border:1px solid #eadfd5;background:#fff;border-radius:8px;padding:12px;text-align:left;cursor:pointer}.opt:hover{border-color:#6d4934;background:#fffaf6}.opt strong{display:block;color:#1d1713;font-size:13px;line-height:1.35}.opt span{display:block;margin-top:4px;color:#7c7067;font-size:11px;line-height:1.4;word-break:keep-all}.foot{display:flex;align-items:center;justify-content:space-between;margin-top:14px}.back{appearance:none;border:0;background:transparent;color:#6d4934;font-size:12px;font-weight:800;cursor:pointer;padding:8px 0}.step{color:#95877d;font-size:11px}.loading{padding:18px 0 8px;text-align:center;color:#5f524a;font-size:13px;line-height:1.6}.spinner{width:28px;height:28px;border-radius:999px;border:3px solid #eadfd5;border-top-color:#5b3a27;margin:0 auto 12px;animation:spin .8s linear infinite}.result{display:grid;gap:12px}.product{display:grid;grid-template-columns:76px minmax(0,1fr);gap:12px;align-items:center;border:1px solid #eadfd5;border-radius:10px;padding:10px;background:#fffaf6}.product img{width:76px;height:76px;object-fit:cover;border-radius:8px;background:#eee}.name{font-size:13px;font-weight:900;line-height:1.35;word-break:keep-all}.price{margin-top:4px;font-size:12px;font-weight:800;color:#5b3a27}.reason,.hint,.proof li,.alt p{font-size:12px;line-height:1.55;color:#5f524a;word-break:keep-all;overflow-wrap:break-word}.hint{border-left:3px solid #5b3a27;background:#fbf4ec;padding:9px 10px;border-radius:8px}.proof{margin:0;padding-left:18px;display:grid;gap:5px}.alts{display:grid;gap:7px}.alt{appearance:none;border:1px solid #eadfd5;background:#fff;border-radius:8px;padding:10px;text-align:left;cursor:pointer}.alt strong{display:block;font-size:12px;line-height:1.35;color:#1d1713}.alt p{margin:4px 0 0}.cta{appearance:none;width:100%;border:0;border-radius:8px;background:#1d1713;color:#fff;padding:13px 14px;font-size:14px;font-weight:900;cursor:pointer}.cta:hover{transform:translateY(-1px)}.restart{appearance:none;width:100%;border:1px solid #eadfd5;border-radius:8px;background:#fff;color:#5b3a27;padding:11px 12px;font-size:13px;font-weight:850;cursor:pointer}.notice{font-size:10px;line-height:1.45;color:#9a8c82;word-break:keep-all}.error{border:1px solid #f0c7c7;background:#fff7f7;color:#824040;border-radius:8px;padding:11px;font-size:12px;line-height:1.5}.hidden{display:none!important}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:480px){.panel{width:calc(100vw - 28px)}.inline .panel{width:100%}.q{font-size:16px}.product{grid-template-columns:64px minmax(0,1fr)}.product img{width:64px;height:64px}}";

  shadow.innerHTML =
    '<style>' +
    css +
    '</style>' +
    '<div class="sf ' +
    (product.pageType === "product_detail" ? "inline closed" : "closed") +
    '">' +
    '<button class="launcher" type="button"><span class="dot"></span><span>나에게 맞는 베개 찾기</span></button>' +
    '<section class="panel" aria-live="polite">' +
    '<div class="head"><div><div class="title">20초 수면핏 진단</div><div class="sub">수면 자세와 취향에 맞춰 베개·침구 후보를 바로 좁혀드릴게요.</div></div><button class="close" type="button" aria-label="닫기">×</button></div>' +
    '<div class="body"></div>' +
    '</section>' +
    '</div>';

  var root = shadow.querySelector(".sf");
  var launcher = shadow.querySelector(".launcher");
  var closeButton = shadow.querySelector(".close");
  var body = shadow.querySelector(".body");

  function openPanel() {
    root.classList.remove("closed");
    if (!root.classList.contains("inline")) {
      host.setAttribute("aria-expanded", "true");
    }
    opened = true;
    if (!safeStorageGet(window.sessionStorage, "sleepfit_started_" + sessionId)) {
      safeStorageSet(window.sessionStorage, "sleepfit_started_" + sessionId, "1");
      track("quiz_start", { pageType: detectProduct().pageType });
    }
    renderQuestion();
  }

  function closePanel() {
    if (root.classList.contains("inline")) return;
    root.classList.add("closed");
    host.setAttribute("aria-expanded", "false");
  }

  function progressWidth() {
    return Math.max(1, Math.min(questions.length, currentStep + 1)) / questions.length * 100;
  }

  function renderQuestion() {
    var question = questions[currentStep];
    body.innerHTML =
      '<div class="progress"><div class="bar" style="width:' +
      progressWidth() +
      '%"></div></div>' +
      '<div class="q">' +
      question.title +
      '</div>' +
      '<div class="opts"></div>' +
      '<div class="foot"><button class="back" type="button">' +
      (currentStep > 0 ? "이전" : "처음부터") +
      '</button><div class="step">' +
      (currentStep + 1) +
      " / " +
      questions.length +
      "</div></div>";

    var opts = body.querySelector(".opts");
    question.options.forEach(function (option) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "opt";
      button.innerHTML = "<strong></strong><span></span>";
      button.querySelector("strong").textContent = option.label;
      button.querySelector("span").textContent = option.helper;
      button.onclick = function () {
        answers[question.id] = option.value;
        track("answer_select", { question: question.id, value: option.value, step: currentStep + 1 });
        if (currentStep < questions.length - 1) {
          currentStep += 1;
          renderQuestion();
        } else {
          requestRecommendation();
        }
      };
      opts.appendChild(button);
    });

    body.querySelector(".back").onclick = function () {
      if (currentStep > 0) {
        currentStep -= 1;
        renderQuestion();
      } else {
        answers = {};
        currentStep = 0;
        renderQuestion();
      }
    };
  }

  function renderLoading() {
    body.innerHTML =
      '<div class="loading"><div class="spinner"></div><strong>수면핏을 계산 중입니다.</strong><br>상품 옵션과 후기 근거를 함께 맞춰보고 있어요.</div>';
  }

  function renderError() {
    body.innerHTML =
      '<div class="error">추천을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div><button class="restart" type="button">다시 진단하기</button>';
    body.querySelector(".restart").onclick = function () {
      recommendation = null;
      currentStep = 0;
      answers = {};
      renderQuestion();
    };
  }

  function scrollToOptionArea() {
    var target =
      document.querySelector("#product_option_id1") ||
      document.querySelector(".productOption") ||
      document.querySelector("#optionG") ||
      document.querySelector("#totalProducts") ||
      document.querySelector("#actionCart") ||
      document.querySelector("#actionBuy");
    if (target && target.scrollIntoView) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      if (target.focus) {
        try {
          target.focus({ preventScroll: true });
        } catch (_) {}
      }
      return true;
    }
    return false;
  }

  function sameCurrentProduct(productNo) {
    var current = detectProduct();
    return Boolean(productNo && current.productNo && String(productNo) === String(current.productNo));
  }

  function runCta() {
    if (!recommendation) return;
    track("cta_click", {
      action: recommendation.cta.action,
      productNo: recommendation.primaryProduct.productNo,
      productName: recommendation.primaryProduct.name,
    });

    if (recommendation.cta.action === "scroll_to_option" || sameCurrentProduct(recommendation.primaryProduct.productNo)) {
      if (scrollToOptionArea()) return;
    }

    window.location.href = recommendation.primaryProduct.url;
  }

  function renderResult(data) {
    recommendation = data;
    var proof = data.reviewProof
      .map(function (item) {
        return "<li></li>";
      })
      .join("");
    var alts = data.alternatives
      .map(function () {
        return '<button class="alt" type="button"><strong></strong><p></p></button>';
      })
      .join("");

    body.innerHTML =
      '<div class="result">' +
      '<div class="product"><img alt="" loading="lazy"><div><div class="name"></div><div class="price"></div></div></div>' +
      '<div class="reason"></div>' +
      '<div class="hint"></div>' +
      '<ul class="proof">' +
      proof +
      "</ul>" +
      (data.alternatives.length ? '<div class="alts">' + alts + "</div>" : "") +
      '<button class="cta" type="button"></button>' +
      '<button class="restart" type="button">다시 진단하기</button>' +
      '<div class="notice">SleepFit AI는 공개 상품 정보와 후기 근거, 진단 답변만 사용합니다. 의료 진단이나 치료 효과를 안내하지 않습니다.</div>' +
      "</div>";

    var image = body.querySelector(".product img");
    image.src = data.primaryProduct.imageUrl;
    image.alt = data.primaryProduct.name;
    body.querySelector(".name").textContent = data.primaryProduct.name;
    body.querySelector(".price").textContent = data.primaryProduct.priceText;
    body.querySelector(".reason").textContent = data.primaryProduct.reason;
    body.querySelector(".hint").textContent = data.primaryProduct.optionHint;

    var proofItems = body.querySelectorAll(".proof li");
    data.reviewProof.forEach(function (item, index) {
      if (proofItems[index]) proofItems[index].textContent = item;
    });

    var altButtons = body.querySelectorAll(".alt");
    data.alternatives.forEach(function (item, index) {
      var button = altButtons[index];
      if (!button) return;
      button.querySelector("strong").textContent = item.name;
      button.querySelector("p").textContent = item.reason;
      button.onclick = function () {
        track("cta_click", { action: "alternative_product", productNo: item.productNo, index: index + 1 });
        window.location.href = item.url;
      };
    });

    body.querySelector(".cta").textContent = data.cta.label;
    body.querySelector(".cta").onclick = runCta;
    body.querySelector(".restart").onclick = function () {
      recommendation = null;
      currentStep = 0;
      answers = {};
      renderQuestion();
    };

    track("recommendation_view", {
      productNo: data.primaryProduct.productNo,
      ctaAction: data.cta.action,
      alternativeCount: data.alternatives.length,
    });
  }

  function requestRecommendation() {
    renderLoading();
    var payload = payloadBase();
    payload.answers = answers;
    payload.currentProductNo = payload.product && payload.product.productNo ? payload.product.productNo : undefined;

    postJson("/api/sleepfit/recommend", payload)
      .then(function (data) {
        renderResult(data);
      })
      .catch(function (error) {
        log("recommendation failed", error && error.message ? error.message : error);
        renderError();
      });
  }

  function bindCartTracking() {
    document.addEventListener(
      "click",
      function (event) {
        var target = event.target && event.target.closest ? event.target.closest("a,button,input[type='button'],input[type='submit']") : null;
        if (!target) return;
        var text = (target.textContent || target.value || "").trim();
        var id = target.getAttribute("id") || "";
        var href = target.getAttribute("href") || "";
        var haystack = (text + " " + id + " " + href).toLowerCase();
        if (/basket|cart|actioncart|장바구니/.test(haystack)) {
          track("add_to_cart_click", { text: text.slice(0, 80), id: id, href: href });
        }
      },
      true,
    );
  }

  function init() {
    track("impression", { pageType: product.pageType, surface: product.pageType === "product_detail" ? "inline" : "floating" });
    bindCartTracking();

    if (launcher) launcher.addEventListener("click", openPanel);
    if (closeButton) closeButton.addEventListener("click", closePanel);
    if (!root.classList.contains("inline")) {
      host.addEventListener("click", function (event) {
        var path = typeof event.composedPath === "function" ? event.composedPath() : [];
        if (closeButton && path.indexOf(closeButton) !== -1) return;
        if (!root.classList.contains("closed") && launcher && path.indexOf(launcher) === -1) return;
        if (root.classList.contains("closed")) openPanel();
      });
      host.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openPanel();
      });
    }

    if (product.pageType === "product_detail") {
      openPanel();
    }

    window.sleepfitAI = {
      version: VERSION,
      brand: BRAND,
      open: openPanel,
      close: closePanel,
      track: track,
      getState: function () {
        return {
          version: VERSION,
          mallId: mallId,
          visitorId: visitorId,
          sessionId: sessionId,
          opened: opened,
          product: detectProduct(),
          answers: Object.assign({}, answers),
          recommendation: recommendation,
        };
      },
      reset: function () {
        recommendation = null;
        currentStep = 0;
        answers = {};
        openPanel();
        return this.getState();
      },
    };

    log("initialized", window.sleepfitAI.getState());
  }

  init();
})();`;
}
