# Next Actions

## Priority 1
1. Connect the GitHub repository to Vercel and add the required Production/Preview environment variables from `docs/VERCEL_DEPLOYMENT.md`.
2. Add Supabase-backed persistent storage before real advertiser traffic; Vercel memory fallback is only acceptable for demos.
3. Add lightweight tests for `crawl`, `discovery`, and home recommendation triggers (payload validation + auth guard).
4. Add browser smoke checks for:
   - Home first visit banner (`public/slipai-home-demo.html`)
   - Product detail dwell banner (`public/slipai-product-demo.html`)
   - Init queue install (`public/slipai-init-demo.html`)
5. Add an automated smoke check for the menu-free `/website` install ops screen.
6. Verify crawler behavior on a real Cafe24 staging mall with multiple product detail URL formats.
7. Add a small support checklist for confirming card click-through URLs and image extraction quality after install.
8. Keep crawler smoke-test artifacts fresh after each rollout and verify banner + chat open + recommendation response after dwell.

## Priority 2
1. Add observability counters in logs for crawl queue depth, error reasons, robots block ratio.
2. Add simple dashboard endpoint for crawl summary for support operations.

## Priority 3
1. Add optional `maxDepth`/`requestCap` controls in installation settings for brands that need stricter crawling policies.
2. Expand widget UI copy for review-first banner cycle and low-bandwidth fallbacks.
