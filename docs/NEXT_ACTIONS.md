# Next Actions

## Priority 1
1. Run verification pass on local store-crawl path:
   - Start local dev server
   - Install widget script on a sample page and confirm `POST /api/onsite/discovery` receives link payload
   - Confirm crawl queue grows and `processCrawlQueue` stores products
2. Add lightweight tests for `crawl` and `discovery` endpoints (payload validation + auth guard).

## Priority 2
1. Add observability counters in logs for crawl queue depth, error reasons, robots block ratio.
2. Add simple dashboard endpoint for crawl summary for support operations.

## Priority 3
1. Add optional `maxDepth`/`requestCap` controls in installation settings for brands that need stricter crawling policies.
2. Expand widget UI copy for review-first banner cycle and low-bandwidth fallbacks.

