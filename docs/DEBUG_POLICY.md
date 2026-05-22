# Debug Policy

## Priorities
1. Script load failures or missing widget namespace.
2. API 400/401/429/500 errors from onsite endpoints.
3. Recommendation banner not showing after home delay or product dwell.
4. Product cards missing images, names, reasons, or click-through URLs when the crawler has them.
5. Broken Korean/mojibake or old English UI copy.
6. Chat/advisor UI accidentally reappearing in the storefront widget.

## First Checks
- `git status --short --branch`
- `npm.cmd run verify`
- `node scripts\slipai-health-check.mjs`
- Public deployment check with `SLIPAI_HEALTH_BASE_URL` when Vercel is live.

## Browser Checks
- `window.__SLIPAI.getState()` exists.
- Banner appears on home/list pages after the proactive delay.
- Banner appears on product detail pages after dwell.
- Banner product cards show a product image or SlipAI placeholder.
- Product card click navigates to the product URL when available.
- No AI 상담사 launcher, chat panel, chat input, or chat open event is produced by the installed widget.

## Safe Automatic Fixes
- Clear import/type/build errors.
- Repair broken Korean copy.
- Fix deterministic product-card rendering issues.
- Add or update health checks for regression coverage.

## Proposal-Only Areas
- API key handling.
- Authentication and authorization.
- Database schema changes.
- Payment, privacy, ad-consent, or legal policy changes.
- Broad UI redesigns.
