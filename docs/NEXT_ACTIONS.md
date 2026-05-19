# Next Actions

## Priority 1
1. Run verification pass on local store-crawl path:
   - Start local dev server
   - Install widget script on a sample page and confirm `POST /api/onsite/discovery` receives link payload
   - Confirm crawl queue grows and `processCrawlQueue` stores products
   - Validate that discovered products include image URLs in stored payload.
2. Add lightweight tests for `crawl` and `discovery` endpoints (payload validation + auth guard).
3. Keep crawler smoke-test artifacts fresh: run script on `public/cafe24-widget-demo.html` after each rollout and verify banner + chat open + recommendation response after dwell.
4. Verify related-product image usage in recommendation payload for storefront products.
5. Run visual smoke test for both supported install snippets:
   - `public/cafe24-widget-demo.html` (`data-*` snippet)
   - `public/slipai-init-demo.html` (`window.slipai("init", ...)` snippet)

## Priority 2
1. Add observability counters in logs for crawl queue depth, error reasons, robots block ratio.
2. Add simple dashboard endpoint for crawl summary for support operations.

## Priority 3
1. Add optional `maxDepth`/`requestCap` controls in installation settings for brands that need stricter crawling policies.
2. Expand widget UI copy for review-first banner cycle and low-bandwidth fallbacks.
