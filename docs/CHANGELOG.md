# Changelog

## Unreleased

### 2026-05-21
- Created the long-running `SlipAI` branch for GitHub-backed version management.
- Added `docs/SLIPAI_BRANCH_MAINTENANCE.md` with branch workflow, safe-change rules, recurring verification expectations, and deployment notes.
- Added `scripts/slipai-health-check.mjs` to verify Korean widget copy, event ingestion, ops summary access, coding-question scope refusal, and optional full AI recommendation/chat smoke checks without printing secrets.
- Registered the Codex maintenance automation `slipai-3-hour-maintenance-check`.
- Updated current status and next-action docs for the Vercel public URL handoff and recurring maintenance loop.
- Tuned `/website` copy and defaults so the Vercel page reads as a SlipAI control center for the test deployment.
- Added server-driven onsite context copy so the chat greeting and input hint adapt to the installed mall's crawled products instead of using a fixed generic size prompt.
- Repaired the Cafe24 widget demo page copy so local visual checks show a clean Korean product detail page.
- Bumped the install snippet cache key after the onsite context/CORS fix so external test malls fetch the latest widget instead of a cached older script.
- Added health-supplement context detection so probiotic and nutrition-product pages use guidance like ingredients, intake method, reviews, and product composition.
- Added a chat product-card fallback so "not this product" recommendation questions still show same-mall alternatives when the AI returns only the current item.
- Switched production install guidance to the stable `/widget/v1.js` URL without a pinned version query so Vercel releases can auto-reflect on installed storefronts.
- Shortened production widget cache headers and added a stable-channel response header for faster rollout pickup.
- Repaired mojibake on the `/website` SlipAI control center and clarified the automatic update flow in Korean.
- Added `docs/ONSITE_ONE_TAG_ARCHITECTURE.md` to lock the product direction as a loader SDK + server decision API + event tracking system.
- Cleaned onsite recommendation/chat fallback Korean copy so AI fallback responses stay readable.
- Expanded onsite event validation and widget tracking for `banner_resolved`, `impression`, `click`, `close`, and conversion-style manual events.
- Added `/onsite.js` one-line install compatibility plus `/api/widget/resolve`, `/api/chat`, and `/api/events` compatibility endpoints for generic onsite banner/advisor integrations.
- Added `data-site-id` support and `window.PMOnsite.track/open/close/getState` compatibility while keeping the existing SlipAI init queue and server-only OpenAI API flow.
- Hardened onsite recommendation quality: remove current-product duplicates, deduplicate product cards, prefer products with real images/URLs, hide cards when no valid alternative exists, and add image placeholders so broken images do not collapse the UI.
- Repaired onsite recommendation fallback copy and added static mojibake checks for core onsite files.
- Rebuilt onsite fallback recommendation copy with clean Korean, added generated fallback thumbnails for demo/mock recommendations, and added widget-side guards for duplicate/current-product cards.
- Improved product-detail dwell recommendation reliability with a safety timer and added debug-only state attributes for local QA.
- Raised demo-only frequency caps/cooldowns so repeated visual QA does not hide the recommendation banner after the normal shopper frequency cap is reached.
- Expanded the health check to assert product-card image fallback and client-side current-product dedupe guards.
- Hardened onsite chat so unsupported product/category questions, such as asking for multivitamins on a mall where that category is not in the collected catalog, are blocked before OpenAI and never return generic buying checklists.
- Cleaned onsite chat scope/prompt copy and added health-check assertions for installed-mall-only Korean chat answers.
- Removed the visible onsite AI 상담사 widget from the storefront loader and converted SlipAI to a banner-only experience.
- Changed onsite recommendations to prioritize the same-mall product with the most collected reviews and explain the recommendation reason from review count/review content.
- Updated widget/compat health checks so they assert chat is disabled and the stable script shows only Korean recommendation banner UI.

### 2026-05-19
- Added on-site crawler onboarding flow:
  - Added `POST /api/onsite/discovery` to collect discovered URLs from installed scripts.
  - Added `GET/POST /api/onsite/crawl` endpoint and shared queue crawler.
  - Integrated script bootstrap + SPA route-change discovery triggers.
  - Added `ONSITE_*` env controls for crawl depth/rate-limit/interval.
- Added in-memory crawler state + robots.txt caching with bounded re-try and retry-delay.
- Added crawler-related defaults to `.env.example` (`ONSITE_DISCOVERY_PUMP_MAX_TASKS`, `ONSITE_CRAWL_*`, discovery/crawl limits).
- Updated install guide with discovery/crawl steps.
- Minor hardening polish:
  - Replaced unreadable fallback review text in crawler seed parser.
  - Cleaned demo validation page copy for "Talk to advisor" action test.
- Added crawler extraction hardening for zero-action rollout:
  - `product_no` extraction now supports path-style IDs (`/product/<id>`).
  - Image candidate extraction now resolves relative paths and falls back to in-page images when OG/Twitter image tags are missing.
  - Crawl discovery now keeps search-category navigation links eligible (instead of hard-blocking `/search`), improving first-pass catalog sweep depth.
  - Removed synthetic review text injection from crawler seed parser so recommendations are based on real extracted review evidence only.
- Fixed related product image handling in recommendation API: related products now use their own crawled image when available and no longer inherit the current product image as a fallback.
- Added Google/Meta-style `window.slipai("init", ...)` queue compatibility so builders such as Lovable can install the widget with a two-script loader snippet.
- Added `public/slipai-init-demo.html` to smoke-test init queue installs separately from the `data-*` install snippet.
- Added home/list proactive shopping-guide recommendations:
  - SlipAI-owned `localStorage` visit state now separates first visit and returning visit copy without reading third-party cookies.
  - Home/collection/other pages request `home_first_visit` or `home_returning_visit` recommendations after 3 seconds, once per session.
  - Product cards now prioritize crawled image URLs and navigate to the stored product URL when available.
  - Korean banner/chat copy and scope-safe Korean refusal copy were tightened for installed-mall-only 상담.
- Added `public/slipai-home-demo.html` and `public/slipai-product-demo.html` for visual smoke testing of home-entry and product-detail recommendation flows.
- Reworked `/website` into a menu-free SlipAI install ops screen that shows the install snippet, server-side script data scope, event counters, detected install domains/pages, crawler state, and event mix.
- Added Vercel deployment readiness:
  - Added `vercel.json` and `.vercelignore` for GitHub-to-Vercel builds.
  - Updated install snippets to use the Vercel public URL instead of local tunnel placeholders.
  - Added `docs/VERCEL_DEPLOYMENT.md` with GitHub integration, Vercel environment variables, production install script, and smoke checks.
  - Aligned example onsite OpenAI settings with the verified `gpt-5-mini` configuration.

## 2026-05-19
- Initial SlipAI MVP baseline (script install + event API + recommendation/chat flow, API verification + CI checks).
