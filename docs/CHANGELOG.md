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
