import { getSleepfitProduct } from "@/lib/sleepfit/catalog";
import type {
  SleepfitAbGroup,
  SleepfitAnswers,
  SleepfitDeviceType,
  SleepfitEventRequest,
  SleepfitEventType,
  SleepfitPageType,
} from "@/lib/sleepfit/schemas";

export interface StoredSleepfitEvent {
  eventId: string;
  eventType: SleepfitEventType;
  timestamp: string;
  receivedAt: string;
  mallId: string;
  sessionId: string;
  anonymousId: string;
  visitorId: string;
  pageUrl: string;
  pageType: SleepfitPageType;
  referrer: string;
  deviceType: SleepfitDeviceType;
  userAgent: string;
  currentProductNo: string;
  recommendedProductNo: string;
  scenario: string;
  abGroup: SleepfitAbGroup;
  quizAnswers?: Partial<SleepfitAnswers>;
  metadata: Record<string, unknown>;
}

const eventStore: StoredSleepfitEvent[] = [];
const MAX_EVENTS = 10_000;

function createEventId() {
  return `sfe_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeAlias(eventType: SleepfitEventType): SleepfitEventType {
  if (eventType === "impression") return "widget_view";
  if (eventType === "recommendation_view") return "recommendation_shown";
  if (eventType === "add_to_cart_click") return "cta_click";
  return eventType;
}

function normalizeString(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function inferDeviceType(event: SleepfitEventRequest): SleepfitDeviceType {
  const explicit = event.deviceType || event.device_type;
  if (explicit) return explicit;

  const width = event.page?.viewport?.width || 0;
  if (width > 0 && width < 768) return "mobile";
  if (width >= 768 && width < 1024) return "tablet";
  if (width >= 1024) return "desktop";

  const ua = (event.userAgent || event.user_agent || "").toLowerCase();
  if (/mobile|iphone|android/.test(ua)) return "mobile";
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (ua) return "desktop";
  return "unknown";
}

function normalizeEvent(event: SleepfitEventRequest): StoredSleepfitEvent {
  const eventType = normalizeAlias((event.eventType || event.event_type || event.eventName || "error") as SleepfitEventType);
  const pageType = event.pageType || event.page_type || event.product?.pageType || event.page?.pageType || "other";
  const recommendationPrimary = event.recommendation?.primaryProduct;
  const recommendedProductNo =
    normalizeString(event.recommendedProductNo) ||
    normalizeString(event.recommended_product_no) ||
    normalizeString(recommendationPrimary && "productNo" in recommendationPrimary ? recommendationPrimary.productNo : "") ||
    normalizeString(event.metadata.recommendedProductNo);

  return {
    eventId: event.eventId || event.event_id || createEventId(),
    eventType,
    timestamp: event.timestamp || event.occurredAt || new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    mallId: event.mall_id || event.mallId,
    sessionId: event.session_id || event.sessionId,
    anonymousId: event.anonymous_id || event.anonymousId || event.visitorId,
    visitorId: event.visitorId,
    pageUrl: event.page_url || event.pageUrl || event.page?.url || "",
    pageType,
    referrer: event.referrer || event.page?.referrer || "",
    deviceType: inferDeviceType(event),
    userAgent: event.user_agent || event.userAgent || "",
    currentProductNo:
      normalizeString(event.currentProductNo) ||
      normalizeString(event.current_product_no) ||
      normalizeString(event.product?.productNo),
    recommendedProductNo,
    scenario: event.scenario || normalizeString(event.metadata.scenario),
    abGroup: event.ab_group || event.abGroup || "A",
    quizAnswers: event.quiz_answers || event.quizAnswers || event.answers,
    metadata: event.metadata,
  };
}

export function recordSleepfitEvent(event: SleepfitEventRequest) {
  const stored = normalizeEvent(event);

  eventStore.push(stored);
  if (eventStore.length > MAX_EVENTS) eventStore.splice(0, eventStore.length - MAX_EVENTS);

  return {
    eventId: stored.eventId,
    stored: true,
  };
}

function eventsForMall(mallId: string) {
  return eventStore.filter((event) => event.mallId === mallId);
}

function count(events: StoredSleepfitEvent[], eventType: SleepfitEventType) {
  return events.filter((event) => event.eventType === eventType).length;
}

function rate(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function groupBy<T extends string>(events: StoredSleepfitEvent[], getKey: (event: StoredSleepfitEvent) => T) {
  return events.reduce<Record<T, StoredSleepfitEvent[]>>((groups, event) => {
    const key = getKey(event);
    groups[key] ||= [];
    groups[key].push(event);
    return groups;
  }, {} as Record<T, StoredSleepfitEvent[]>);
}

function metricsFor(events: StoredSleepfitEvent[]) {
  const widgetViews = count(events, "widget_view");
  const quizStarts = count(events, "quiz_start");
  const quizComplete = count(events, "quiz_complete");
  const recommendationShown = count(events, "recommendation_shown");
  const productClicks = count(events, "product_click");
  const ctaClicks = count(events, "cta_click");

  return {
    widgetViews,
    quizStarts,
    quizComplete,
    recommendationShown,
    productClicks,
    ctaClicks,
    recommendationCtr: rate(productClicks, recommendationShown),
    quizStartRate: rate(quizStarts, widgetViews),
    quizCompletionRate: rate(recommendationShown || quizComplete, quizStarts),
    ctaClickRate: rate(ctaClicks, recommendationShown),
  };
}

function byPage(events: StoredSleepfitEvent[]) {
  const groups = groupBy(events, (event) => event.pageType);
  return Object.entries(groups).map(([pageType, group]) => ({
    pageType,
    ...metricsFor(group),
  }));
}

function byScenario(events: StoredSleepfitEvent[]) {
  const groups = groupBy(events, (event) => (event.scenario || "unknown") as string);
  return Object.entries(groups).map(([scenario, group]) => ({
    scenario,
    ...metricsFor(group),
  }));
}

function byAbGroup(events: StoredSleepfitEvent[]) {
  const groups = groupBy(events, (event) => event.abGroup);
  return (["A", "B"] as const).map((abGroup) => ({
    abGroup,
    ...metricsFor(groups[abGroup] || []),
  }));
}

function productPerformance(events: StoredSleepfitEvent[]) {
  const productEvents = events.filter((event) => event.recommendedProductNo);
  const groups = groupBy(productEvents, (event) => event.recommendedProductNo);

  return Object.entries(groups)
    .map(([productNo, group]) => {
      const product = getSleepfitProduct(productNo);
      return {
        productNo,
        name: product?.product_name || `상품 ${productNo}`,
        impressions: count(group, "product_impression") + count(group, "recommendation_shown"),
        clicks: count(group, "product_click") + count(group, "cta_click") + count(group, "cross_sell_click"),
        ctr: rate(count(group, "product_click") + count(group, "cta_click") + count(group, "cross_sell_click"), Math.max(1, group.length)),
      };
    })
    .sort((a, b) => b.clicks - a.clicks);
}

function recentSevenDayTrend(events: StoredSleepfitEvent[]) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });

  return days.map((date) => {
    const group = events.filter((event) => event.timestamp.slice(0, 10) === date);
    return {
      date,
      widgetViews: count(group, "widget_view"),
      quizStarts: count(group, "quiz_start"),
      recommendationShown: count(group, "recommendation_shown"),
      productClicks: count(group, "product_click") + count(group, "cta_click"),
    };
  });
}

function mockEvents(mallId: string): StoredSleepfitEvent[] {
  const now = Date.now();
  const productNos = ["330", "36", "345", "394", "392"];
  const types: SleepfitEventType[] = [
    "widget_view",
    "widget_open",
    "quiz_start",
    "answer_select",
    "quiz_complete",
    "recommendation_shown",
    "product_impression",
    "product_click",
    "cta_click",
  ];

  return Array.from({ length: 96 }, (_, index) => {
    const productNo = productNos[index % productNos.length] || "330";
    const eventType = types[index % types.length] || "widget_view";
    const timestamp = new Date(now - (index % 7) * 86400000 - index * 600000).toISOString();

    return {
      eventId: `mock_${index}`,
      eventType,
      timestamp,
      receivedAt: timestamp,
      mallId,
      sessionId: `mock_session_${Math.floor(index / 4)}`,
      anonymousId: `mock_user_${Math.floor(index / 3)}`,
      visitorId: `mock_user_${Math.floor(index / 3)}`,
      pageUrl: index % 3 === 0 ? "https://sleepnsleepmall.com/index.html" : "https://sleepnsleepmall.com/product/list.html?cate_no=45",
      pageType: index % 5 === 0 ? "product_detail" : index % 3 === 0 ? "home" : "collection",
      referrer: "",
      deviceType: index % 2 === 0 ? "mobile" : "desktop",
      userAgent: "mock",
      currentProductNo: index % 5 === 0 ? "330" : "",
      recommendedProductNo: productNo,
      scenario: index % 4 === 0 ? "first_purchase" : index % 4 === 1 ? "heat_sensitive" : "category_choice_fatigue",
      abGroup: index % 2 === 0 ? "A" : "B",
      quizAnswers: undefined,
      metadata: { mock: true },
    };
  });
}

export function getSleepfitEventSummary(mallId: string) {
  const events = eventsForMall(mallId);
  const byName = events.reduce<Record<string, number>>((summary, event) => {
    summary[event.eventType] = (summary[event.eventType] || 0) + 1;
    return summary;
  }, {});

  return {
    total: events.length,
    byName,
    lastEventAt: events.at(-1)?.receivedAt || null,
  };
}

export function getSleepfitAdminMetrics(mallId: string) {
  const liveEvents = eventsForMall(mallId);
  const events = liveEvents.length > 0 ? liveEvents : mockEvents(mallId);
  const productStats = productPerformance(events);

  return {
    mallId,
    generatedAt: new Date().toISOString(),
    storageMode: liveEvents.length > 0 ? "memory" : "mock_fallback",
    hasLiveEvents: liveEvents.length > 0,
    totalEvents: events.length,
    keyMetrics: metricsFor(events),
    pagePerformance: byPage(events),
    productPerformance: productStats,
    scenarioPerformance: byScenario(events),
    abPerformance: byAbGroup(events),
    recent7Days: recentSevenDayTrend(events),
    topProducts: productStats.slice(0, 5),
    lowProducts: productStats.filter((item) => item.impressions >= 2 && item.clicks === 0).slice(0, 5),
    recentEvents: events.slice(-20).reverse(),
    notes:
      liveEvents.length > 0
        ? "현재 배포 환경의 서버 메모리에 저장된 이벤트 기준입니다. 장기 보관은 Supabase 연동으로 확장하세요."
        : "아직 저장된 이벤트가 없어 mock fallback으로 화면 구조를 보여줍니다.",
  };
}
