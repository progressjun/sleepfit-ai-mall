"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIcon,
  BotIcon,
  CheckCircle2Icon,
  Code2Icon,
  CopyIcon,
  ExternalLinkIcon,
  Globe2Icon,
  MessageCircleIcon,
  MousePointerClickIcon,
  RefreshCwIcon,
  SearchCheckIcon,
  ServerIcon,
  ShieldCheckIcon,
  SignalIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OpsSummary {
  installation: {
    id: string;
    projectKey: string;
    mallId: string;
    status: string;
    allowedOrigins: string[];
    hasWidgetSecret: boolean;
  };
  counters: {
    events: number;
    recommendations: number;
    bannerCtaClicks: number;
    chatMessages: number;
    blockedChatMessages: number;
  };
  eventCounts: Record<string, number>;
  recentEvents: Array<{
    eventName: string;
    pageUrl?: string;
    productName?: string;
    createdAt: string;
  }>;
  installedSites: Array<{
    origin: string;
    pageCount: number;
    eventCount: number;
    lastSeenAt: string;
    lastPageUrl?: string;
    productNames: string[];
  }>;
  crawlSummary: {
    crawled: number;
    failed: number;
    queue: number;
    discoveredTotal: number;
    active: boolean;
  };
}

interface OpsResponse {
  ok: boolean;
  message?: string;
  data?: OpsSummary;
}

const metricCards = [
  { key: "events", label: "수집 이벤트", icon: ActivityIcon },
  { key: "recommendations", label: "AI 추천 호출", icon: BotIcon },
  { key: "bannerCtaClicks", label: "배너 클릭", icon: MousePointerClickIcon },
  { key: "chatMessages", label: "상담 메시지", icon: MessageCircleIcon },
] as const;

const widgetScriptVersion = "0.3.2-context-cors-20260521";
const configuredPublicOrigin = process.env.NEXT_PUBLIC_SLIPAI_PUBLIC_ORIGIN?.trim();
const defaultProjectKey = process.env.NEXT_PUBLIC_SLIPAI_DEFAULT_PROJECT_KEY?.trim() || "pk_slipai_test";
const defaultMallId = process.env.NEXT_PUBLIC_SLIPAI_DEFAULT_MALL_ID?.trim() || "slipai-test-kr";

function formatDate(value?: string) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function hostname(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

function pathLabel(value?: string) {
  if (!value) return "-";
  try {
    const parsed = new URL(value);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return value;
  }
}

function buildInstallSnippet({
  origin,
  projectKey,
  mallId,
  widgetToken,
}: {
  origin: string;
  projectKey: string;
  mallId: string;
  widgetToken: string;
}) {
  const tokenLine = widgetToken.trim() ? `    token: "${widgetToken.trim()}",\n` : "";

  return `<script>
  window.slipai =
    window.slipai ||
    function () {
      (window.slipai.q = window.slipai.q || []).push(arguments);
    };
  window.slipai("init", {
    projectKey: "${projectKey}",
    mallId: "${mallId}",
${tokenLine}    dwellSeconds: 30
  });
</script>
<script async src="${origin}/widget/v1.js?v=${widgetScriptVersion}"></script>`;
}

export default function WebsitePage() {
  const [projectKey, setProjectKey] = useState(defaultProjectKey);
  const [mallId, setMallId] = useState(defaultMallId);
  const [widgetToken, setWidgetToken] = useState("");
  const [origin, setOrigin] = useState(configuredPublicOrigin || "http://localhost:4010");
  const [summary, setSummary] = useState<OpsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const installSnippet = useMemo(
    () => buildInstallSnippet({ origin, projectKey, mallId, widgetToken }),
    [origin, projectKey, mallId, widgetToken],
  );

  const eventEntries = useMemo(
    () => Object.entries(summary?.eventCounts ?? {}).sort((a, b) => b[1] - a[1]),
    [summary],
  );

  const loadOps = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        projectKey,
        mallId,
      });
      if (widgetToken.trim()) params.set("widgetToken", widgetToken.trim());

      const response = await fetch(`/api/onsite/ops?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json()) as OpsResponse;

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.message || "설치 현황을 불러오지 못했습니다.");
      }

      setSummary(payload.data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "설치 현황을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [mallId, projectKey, widgetToken]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOrigin(configuredPublicOrigin || window.location.origin);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOps();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadOps]);

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(installSnippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#f6f8fb] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <SignalIcon className="size-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-950">SlipAI Vercel 관제센터</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Vercel 공개 URL은 광고주용 홈페이지가 아니라 설치 감지, 이벤트, 크롤링 상태를 보는 관제 화면입니다.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={summary?.installation.status === "active" ? "default" : "secondary"}>
                {summary?.installation.status ?? "local"}
              </Badge>
              <Badge variant="outline">{origin}</Badge>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">테스트 설치 스크립트</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    테스트몰 공통 레이아웃의 `&lt;/body&gt;` 직전에 1회 설치하면 관제센터에 적용 현황이 표시됩니다.
                  </p>
                </div>
                <Button onClick={copySnippet} variant="outline">
                  <CopyIcon className="size-4" />
                  {copied ? "복사됨" : "복사"}
                </Button>
              </div>
              <pre className="max-h-[340px] overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                <code>{installSnippet}</code>
              </pre>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="project-key">Project key</Label>
                  <Input id="project-key" value={projectKey} onChange={(event) => setProjectKey(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mall-id">Mall ID</Label>
                  <Input id="mall-id" value={mallId} onChange={(event) => setMallId(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="widget-token">Widget token</Label>
                  <Input
                    placeholder="운영에서 shared secret을 켠 경우에만 입력"
                    id="widget-token"
                    value={widgetToken}
                    onChange={(event) => setWidgetToken(event.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">서버 저장 범위</h2>
                  <p className="mt-1 text-sm text-slate-500">스크립트 운영에 필요한 내용만 저장합니다.</p>
                </div>
                <ServerIcon className="size-5 text-slate-400" />
              </div>
              <div className="space-y-3 text-sm">
                {[
                  "설치 프로젝트 키, 몰 ID, 허용 도메인",
                  "page_view, discovery, dwell, click, chat 이벤트",
                  "크롤링으로 확인된 상품명, 이미지, URL, 후기 요약",
                  "AI 추천/상담 응답 로그와 범위 차단 여부",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2Icon className="mt-0.5 size-4 text-emerald-600" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
                고객/광고주 임의 쿠키는 읽지 않고, SlipAI 전용 익명 방문 ID와 이벤트만 사용합니다.
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          {metricCards.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.key} className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">{metric.label}</span>
                    <Icon className="size-4 text-slate-400" />
                  </div>
                  <div className="mt-3 text-3xl font-semibold text-slate-950">
                    {summary?.counters[metric.key] ?? 0}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">스크립트가 감지된 홈페이지</h2>
                  <p className="mt-1 text-sm text-slate-500">서버에 들어온 이벤트 기준으로 설치 도메인을 묶어 보여줍니다.</p>
                </div>
                <Button onClick={loadOps} disabled={isLoading} variant="outline">
                  <RefreshCwIcon className={isLoading ? "size-4 animate-spin" : "size-4"} />
                  새로고침
                </Button>
              </div>

              {error ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
              ) : null}

              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">도메인</th>
                      <th className="px-3 py-2">감지 페이지</th>
                      <th className="px-3 py-2">이벤트</th>
                      <th className="px-3 py-2">최근 적용 위치</th>
                      <th className="px-3 py-2 text-right">최근 감지</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(summary?.installedSites ?? []).map((site) => (
                      <tr key={site.origin}>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2 font-medium text-slate-950">
                            <Globe2Icon className="size-4 text-slate-400" />
                            {hostname(site.origin)}
                          </div>
                          <a
                            className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-950"
                            href={site.origin}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {site.origin}
                            <ExternalLinkIcon className="size-3" />
                          </a>
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-700">{site.pageCount}</td>
                        <td className="px-3 py-3 font-medium text-slate-700">{site.eventCount}</td>
                        <td className="max-w-[280px] px-3 py-3">
                          <div className="truncate text-slate-700">{pathLabel(site.lastPageUrl)}</div>
                          {site.productNames.length ? (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {site.productNames.slice(0, 2).map((product) => (
                                <Badge key={product} variant="secondary">
                                  {product}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-500">{formatDate(site.lastSeenAt)}</td>
                      </tr>
                    ))}
                    {!summary?.installedSites.length ? (
                      <tr>
                        <td className="px-3 py-6 text-slate-500" colSpan={5}>
                          아직 감지된 설치 도메인이 없습니다. 테스트 사이트에 위 스크립트를 설치한 뒤 새로고침하세요.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div>
                <h2 className="text-base font-semibold text-slate-950">적용 상태</h2>
                <p className="mt-1 text-sm text-slate-500">위젯이 실제로 무엇을 하고 있는지 빠르게 확인합니다.</p>
              </div>
              <div className="grid gap-3">
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <SearchCheckIcon className="size-4 text-blue-600" />
                    URL 발견/크롤링
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-500">Queue</span>
                    <span className="text-right font-medium">{summary?.crawlSummary.queue ?? 0}</span>
                    <span className="text-slate-500">Crawled</span>
                    <span className="text-right font-medium">{summary?.crawlSummary.crawled ?? 0}</span>
                    <span className="text-slate-500">Failed</span>
                    <span className="text-right font-medium">{summary?.crawlSummary.failed ?? 0}</span>
                    <span className="text-slate-500">Discovered</span>
                    <span className="text-right font-medium">{summary?.crawlSummary.discoveredTotal ?? 0}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <ShieldCheckIcon className="size-4 text-emerald-600" />
                    보안/범위 제한
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Widget token</span>
                      <Badge variant={summary?.installation.hasWidgetSecret ? "default" : "secondary"}>
                        {summary?.installation.hasWidgetSecret ? "필수" : "미설정"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>차단된 상담</span>
                      <span className="font-medium text-slate-950">{summary?.counters.blockedChatMessages ?? 0}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <Code2Icon className="size-4 text-slate-500" />
                    이벤트 믹스
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {eventEntries.length ? (
                      eventEntries.map(([eventName, count]) => (
                        <Badge key={eventName} variant="secondary">
                          {eventName}: {count}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">아직 이벤트가 없습니다.</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
