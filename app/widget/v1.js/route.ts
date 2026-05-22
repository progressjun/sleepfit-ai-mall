import { buildWidgetScript } from "@/lib/onsite/widget-script";

export const dynamic = "force-static";

const widgetCacheControl =
  process.env.NODE_ENV === "production"
    ? "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
    : "no-store, max-age=0";

export function GET() {
  return new Response(buildWidgetScript(), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "X-SlipAI-Widget-Channel": "stable",
      "Cache-Control": widgetCacheControl,
    },
  });
}
