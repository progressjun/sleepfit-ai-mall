import { buildSleepfitWidgetScript } from "@/lib/sleepfit/widget-script";

export const dynamic = "force-static";

const cacheControl =
  process.env.NODE_ENV === "production"
    ? "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
    : "no-store, max-age=0";

export function GET() {
  return new Response(buildSleepfitWidgetScript(), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "X-SleepFit-Widget-Channel": "stable",
      "Cache-Control": cacheControl,
    },
  });
}
