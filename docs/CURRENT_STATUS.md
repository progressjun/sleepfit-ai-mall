# Current Status (2026-05-19)

## Current Snapshot
- `widget/v1.js` endpoint is available and serves the SlipAI script.
- Core onsite APIs are implemented:
  - `/api/onsite/events`
  - `/api/onsite/recommendation`
  - `/api/onsite/chat`
  - `/api/onsite/discovery`
  - `/api/onsite/crawl`
- Security controls are active via optional shared-secret, origin allowlist, and strict CORS handling.
- Delivery is stable for both in-memory fallback and Supabase-backed persistence.
- Crawler loop now supports bounded background discovery from visited storefront URLs.

## Recent Outcomes
- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm run build` (Next 16.2.6): pass
- Manual behavior checks: widget event tracking and UI render still operational after crawler wiring.

## Next Checks
- Register crawler summary observability for support ops.
- Add minimal test coverage for discovery payload and crawl trigger endpoints.
- Keep `ONSITE_WIDGET_SHARED_SECRET` + `ONSITE_WIDGET_ALLOWED_ORIGINS` set before production rollout.
