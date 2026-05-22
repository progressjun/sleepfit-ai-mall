# Current Status (2026-05-21)

## Current Snapshot
- `widget/v1.js` and `onsite.js` endpoints are available and serve the SlipAI script through stable auto-update URLs.
- Vercel deployment readiness is configured with `vercel.json`, `.vercelignore`, and `docs/VERCEL_DEPLOYMENT.md`.
- GitHub remote is `progressjun/slipai`; Vercel Git Integration should import this repository and deploy from `master` after PR merge.
- Long-running GitHub maintenance branch `SlipAI` is created and tracks `origin/SlipAI`.
- `docs/SLIPAI_BRANCH_MAINTENANCE.md` documents the branch workflow, verification loop, and safe-change rules.
- `scripts/slipai-health-check.mjs` provides a no-secret-output smoke check for Korean widget copy, event ingestion, ops summary, and scope-guard refusal behavior.
- `docs/ONSITE_ONE_TAG_ARCHITECTURE.md` documents the one-tag loader + server decision layer + event tracking architecture.
- Core onsite APIs are implemented:
  - `/api/widget/resolve`
  - `/api/chat` (legacy compatibility only; the storefront widget no longer opens chat)
  - `/api/events`
  - `/api/onsite/events`
  - `/api/onsite/recommendation`
  - `/api/onsite/chat` (legacy compatibility only; not called by the storefront widget)
  - `/api/onsite/discovery`
  - `/api/onsite/crawl`
- Security controls are active via optional shared-secret, origin allowlist, and strict CORS handling.
- Delivery is stable for both in-memory fallback and Supabase-backed persistence.
- Crawler loop now supports bounded background discovery from visited storefront URLs.
- Crawl extraction now resolves relative asset URLs, captures in-page image fallbacks, and supports `product/<id>` style routes.
- Review fallback for crawler ingestion avoids synthetic text injection; recommendations prioritize real extracted review evidence.
- Widget now includes session frequency capping, cart-click review-based recommendations, and desktop exit-intent recommendation banners.
- Widget event tracking now includes server-resolved banner, impression, click, close, and manual conversion-style events in addition to the original SlipAI behavior events.
- The storefront widget is now banner-only: it no longer renders the AI 상담사 launcher/chat panel and does not call the chat API from installed stores.
- Recommendation responses now prioritize the same-mall products with the most collected reviews and explain why each product is recommended.
- Recommendation responses now remove current-product duplicates, deduplicate product cards, prefer real image/URL candidates, and let the widget show a stable placeholder when an image fails.
- Demo/mock recommendation fallbacks now return readable Korean and generated thumbnail images, so fallback cards do not look blank while real crawled product images remain preferred in production.
- Onsite chat now blocks unsupported product/category questions before model generation when the requested category is not present in the same-mall catalog, preventing generic category buying checklists from leaking into 상담 responses.
- Product-detail dwell recommendations now include a safety timer, and debug-only widget attributes expose timer/request/skip state for local QA.
- `/api/onsite/ops` exposes installation, event, recommendation, legacy chat, blocked-scope, and crawl counters for the operator screen.
- `/website` now shows the stable install snippet without a pinned version query so future Vercel releases can auto-reflect on installed storefronts.
- Advertiser-facing one-line installs can use `/onsite.js` with `data-site-id`; advanced installs can still use `window.slipai("init", ...)` and `/widget/v1.js`.

## Recent Outcomes
- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm run build` (Next 16.2.6): pass
- `node scripts/slipai-health-check.mjs`: pass
- Manual behavior checks: widget event tracking and UI render still operational after crawler wiring.
- Browser QA on `public/slipai-product-demo.html`: pass for no current-product duplicates, 3 visible recommendation cards, image media present, and no mojibake after demo frequency cap was raised.
- API QA: banner recommendation requests now return `source: "catalog"` with Korean review-count based product reasons.
- GitHub Actions verify job passed on the deployment-readiness branch before `SlipAI` branch creation.

## Next Checks
- Finish the one-time Vercel account/project connection and production environment variable setup.
- Point `SLIPAI_HEALTH_BASE_URL` at the final public app URL once Vercel is live.
- Register crawler summary observability for support ops.
- Add minimal test coverage for discovery payload and crawl trigger endpoints.
- Keep `ONSITE_WIDGET_SHARED_SECRET` + `ONSITE_WIDGET_ALLOWED_ORIGINS` set before production rollout.
- Validate recommendation payload image quality (related product image fallback no longer inherits current product image).
- Lovable/low-code test installs should use either the one-line `/onsite.js` + `data-site-id` snippet or the advanced `window.slipai("init", ...)` queue snippet, pointing to stable script URLs without a version query for production.
