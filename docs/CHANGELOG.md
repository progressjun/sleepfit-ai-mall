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

## 2026-05-19
- Initial SlipAI MVP baseline (script install + event API + recommendation/chat flow, API verification + CI checks).

