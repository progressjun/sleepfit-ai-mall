"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIcon, BotIcon, MousePointerClickIcon, RefreshCwIcon, ShieldCheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const metrics = [
  { key: "events", label: "Events", icon: ActivityIcon },
  { key: "recommendations", label: "Reco calls", icon: BotIcon },
  { key: "bannerCtaClicks", label: "CTA clicks", icon: MousePointerClickIcon },
  { key: "chatMessages", label: "Chats", icon: BotIcon },
  { key: "blockedChatMessages", label: "Blocked", icon: ShieldCheckIcon },
] as const;

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function OnsiteOpsPanel() {
  const [projectKey, setProjectKey] = useState("pk_demo");
  const [mallId, setMallId] = useState("demo");
  const [widgetToken, setWidgetToken] = useState("demo_widget_token");
  const [summary, setSummary] = useState<OpsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventEntries = useMemo(
    () => Object.entries(summary?.eventCounts ?? {}).sort((a, b) => b[1] - a[1]),
    [summary],
  );

  const loadOps = useCallback(async (nextProjectKey: string, nextMallId: string, nextWidgetToken: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        projectKey: nextProjectKey,
        mallId: nextMallId,
      });
      if (nextWidgetToken.trim()) params.set("widgetToken", nextWidgetToken.trim());

      const response = await fetch(`/api/onsite/ops?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json()) as OpsResponse;

      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.message || "Failed to load onsite ops.");
      }

      setSummary(payload.data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load onsite ops.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  function refresh() {
    void loadOps(projectKey, mallId, widgetToken);
  }

  // Load demo ops once on mount; form edits refresh explicitly.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOps("pk_demo", "demo", "demo_widget_token");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadOps]);

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <BotIcon className="text-blue-600" />
            SlipAI onsite ops
          </CardTitle>
          {summary ? (
            <Badge variant={summary.installation.status === "active" ? "default" : "secondary"}>
              {summary.installation.status}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="onsite-project-key">Project key</Label>
            <Input id="onsite-project-key" value={projectKey} onChange={(event) => setProjectKey(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="onsite-mall-id">Mall ID</Label>
            <Input id="onsite-mall-id" value={mallId} onChange={(event) => setMallId(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="onsite-widget-token">Widget token</Label>
            <Input
              id="onsite-widget-token"
              value={widgetToken}
              onChange={(event) => setWidgetToken(event.target.value)}
              placeholder="Optional when no shared secret is set"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={refresh} disabled={isLoading} variant="outline">
              <RefreshCwIcon className={isLoading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        </div>

        {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <div className="grid gap-3 md:grid-cols-5">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Icon className="size-4" />
                  {metric.label}
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">
                  {summary?.counters[metric.key] ?? 0}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-sm font-semibold text-slate-950">Crawler</div>
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
            <div className="text-sm font-semibold text-slate-950">Event mix</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {eventEntries.length ? (
                eventEntries.map(([eventName, count]) => (
                  <Badge key={eventName} variant="secondary">
                    {eventName}: {count}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-slate-500">No events recorded yet.</span>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Page</th>
                <th className="px-3 py-2 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(summary?.recentEvents ?? []).slice(0, 8).map((event, index) => (
                <tr key={`${event.eventName}-${event.createdAt}-${index}`}>
                  <td className="px-3 py-2 font-medium text-slate-950">{event.eventName}</td>
                  <td className="px-3 py-2 text-slate-600">{event.productName || "-"}</td>
                  <td className="max-w-[260px] truncate px-3 py-2 text-slate-600">{event.pageUrl || "-"}</td>
                  <td className="px-3 py-2 text-right text-slate-500">{formatDate(event.createdAt)}</td>
                </tr>
              ))}
              {!summary?.recentEvents.length ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={4}>
                    Install the widget on a page and refresh after events arrive.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
