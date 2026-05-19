import { buildWidgetScript } from "@/lib/onsite/widget-script";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildWidgetScript(), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
