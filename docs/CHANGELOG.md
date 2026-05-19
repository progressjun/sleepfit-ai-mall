# Changelog

## Unreleased

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

## 2026-05-19
- Initial SlipAI MVP baseline (script install + event API + recommendation/chat flow, API verification + CI checks).
