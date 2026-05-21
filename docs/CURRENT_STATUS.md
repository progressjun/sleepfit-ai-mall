# Current Status (2026-05-19)

## Current Snapshot
- `widget/v1.js` endpoint is available and serves the SlipAI script.
- Vercel deployment readiness is configured with `vercel.json`, `.vercelignore`, and `docs/VERCEL_DEPLOYMENT.md`.
- GitHub remote is `progressjun/slipai`; Vercel Git Integration should import this repository and deploy from `master` after PR merge.
- Core onsite APIs are implemented:
  - `/api/onsite/events`
  - `/api/onsite/recommendation`
  - `/api/onsite/chat`
  - `/api/onsite/discovery`
  - `/api/onsite/crawl`
- Security controls are active via optional shared-secret, origin allowlist, and strict CORS handling.
- Delivery is stable for both in-memory fallback and Supabase-backed persistence.
- Crawler loop now supports bounded background discovery from visited storefront URLs.
- Crawl extraction now resolves relative asset URLs, captures in-page image fallbacks, and supports `product/<id>` style routes.
- Review fallback for crawler ingestion avoids synthetic text injection; recommendations prioritize real extracted review evidence.
- Widget now includes session frequency capping, cart-click comparison recommendations, and desktop exit-intent recommendations.
- `/api/onsite/ops` exposes installation, event, recommendation, chat, blocked-scope, and crawl counters for the operator screen.

## Recent Outcomes
- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm run build` (Next 16.2.6): pass
- Manual behavior checks: widget event tracking and UI render still operational after crawler wiring.

## Next Checks
- Register crawler summary observability for support ops.
- Add minimal test coverage for discovery payload and crawl trigger endpoints.
- Keep `ONSITE_WIDGET_SHARED_SECRET` + `ONSITE_WIDGET_ALLOWED_ORIGINS` set before production rollout.
- Validate recommendation payload image quality (related product image fallback no longer inherits current product image).
- Lovable/low-code test installs should use either the `data-*` one-script snippet or the now-supported `window.slipai("init", ...)` queue snippet.
