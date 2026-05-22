# AI Maintenance Guide

## Scope
- Storefront script: `/onsite.js`, `/widget/v1.js`, `/api/widget/v1.js`
- Banner APIs: `/api/onsite/events`, `/api/onsite/recommendation`, `/api/onsite/discovery`, `/api/onsite/crawl`
- Operator APIs: `/api/onsite/ops`, `/website`
- Legacy chat APIs may remain for compatibility, but the installed storefront widget must not render or call AI 상담사/chat.

## Required Checks
1. Work on `SlipAI` or a feature branch, never directly on `main`/`master`.
2. Run:
   - `npm.cmd run verify`
   - `node scripts\slipai-health-check.mjs`
3. For public rollout checks, run:
   - `SLIPAI_HEALTH_BASE_URL=https://slipai-test-kr.vercel.app node scripts\slipai-health-check.mjs`
4. Confirm the stable script contains Korean recommendation banner copy and no visible chat/advisor UI.
5. Confirm recommendation responses return same-mall product cards with images or placeholders, URLs when available, and review-based reasons.

## Release Rules
- Do not expose API keys, Cafe24 tokens, Supabase service keys, or widget secrets in frontend code.
- Keep `/onsite.js` and `/widget/v1.js` as stable auto-update URLs.
- Do not pin production storefront installs with version query strings.
- Do not make security/auth/API key/DB/payment/privacy/ad-consent changes automatically; propose them first.

## Regression Watch
- Broken Korean/mojibake
- Old English widget copy
- Missing product image fallback
- Product cards with collapsed text
- Recommendation cards from outside the installed mall
- Duplicate cards unless the banner explicitly explains the currently viewed product is the most-reviewed item
- Chat launcher or chat API calls reappearing in the storefront widget
