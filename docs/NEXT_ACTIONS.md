# Next Actions

## Priority 1
1. Keep Vercel Production/Preview environment variables aligned with `docs/VERCEL_DEPLOYMENT.md`.
2. Keep `SLIPAI_HEALTH_BASE_URL=https://slipai-test-kr.vercel.app` in recurring checks and run `node scripts/slipai-health-check.mjs` after each rollout.
3. Keep the 30-minute Codex maintenance automation active on the `SlipAI` branch and review any proposed safe fixes before merging.
4. Add Supabase-backed persistent storage before real advertiser traffic; Vercel memory fallback is only acceptable for demos.
5. Add lightweight tests for `crawl`, `discovery`, and home recommendation triggers (payload validation + auth guard).
6. Add browser smoke checks for:
   - Home first visit banner (`public/slipai-home-demo.html`)
   - Product detail dwell banner (`public/slipai-product-demo.html`)
   - Init queue install (`public/slipai-init-demo.html`)
   - One-line `/onsite.js` + `data-site-id` install on a hosted test storefront.
7. Add an automated smoke check for the menu-free `/website` install ops screen.
8. Verify crawler behavior on a real Cafe24 staging mall with multiple product detail URL formats.
9. Add a small support checklist for confirming card click-through URLs and image extraction quality after install.
10. Keep crawler smoke-test artifacts fresh after each rollout and verify banner impression, product image/card click-through, and review-count recommendation response after dwell.
11. For feature updates, ship through PR -> Vercel Preview -> Production merge so installed storefronts pick up the stable `/onsite.js` or `/widget/v1.js` release automatically.
12. Before adding a generic campaign manager, design persistence/auth/permission boundaries for campaign tables instead of adding ad-hoc DB schema.
13. Add a visual regression smoke check that asserts onsite product cards have no current-product duplicates, no collapsed text columns, and either a real image or the SlipAI placeholder.
14. Promote the current Browser DOM-based visual assertions into an automated local smoke script so screenshot capture timeouts do not block regression checks.
15. Replace the keyword-based legacy chat guard with catalog-backed product/category indexing only if chat compatibility is re-enabled later.
16. Add review-count observability to the operator screen so the top-recommended product and its collected review count are visible per installed mall.

## Priority 2
1. Add observability counters in logs for crawl queue depth, error reasons, robots block ratio.
2. Add simple dashboard endpoint for crawl summary for support operations.

## Priority 3
1. Add optional `maxDepth`/`requestCap` controls in installation settings for brands that need stricter crawling policies.
2. Expand widget UI copy for review-first banner cycle and low-bandwidth fallbacks.
