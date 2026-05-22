# SlipAI Branch Maintenance

## Repository
- GitHub repository: `progressjun/slipai`
- Long-running branch: `SlipAI`
- Default branch: `master`
- Rule: keep product hardening and deployment-readiness updates on `SlipAI` first, then merge only after verification.

## Maintenance Loop
- Codex automation checks this workspace every 3 hours.
- Automation ID: `slipai-3-hour-maintenance-check`
- The automation should keep using the `SlipAI` branch and avoid direct edits on `master`.
- Safe changes can be committed and pushed to `SlipAI` after verification.
- Security, authentication, payment, privacy, API key, and DB schema changes must be proposed first instead of applied silently.

## Required Checks
1. Confirm Git branch and remote:
   - `git branch --show-current`
   - `git remote -v`
2. Run project verification:
   - `npm.cmd run verify`
3. Run SlipAI Korean/widget smoke check against a running local or deployed URL:
   - `node scripts/slipai-health-check.mjs`
4. When testing against Vercel or another public URL:
   - Set `SLIPAI_HEALTH_BASE_URL` to the public app URL.
   - Set `SLIPAI_HEALTH_ORIGIN` to an allowed storefront origin.
   - Set `SLIPAI_HEALTH_WIDGET_TOKEN` only when the server requires a widget token.
5. For a full recommendation smoke check that can call costly endpoints:
   - Set `SLIPAI_HEALTH_FULL_AI=1`.
   - Use this sparingly because it may consume API tokens.

## What The Health Check Verifies
- `/widget/v1.js` is reachable.
- The widget exposes `window.__SLIPAI`.
- The visible widget UI uses Korean copy:
  - `SlipAI 추천`
  - `추천 이유 보기`
  - `상품 보러가기`
- Old English UI strings are not present.
- The event API accepts a `page_view` payload.
- The ops API can read the installation summary.
- The storefront widget does not render or call AI 상담사/chat.
- Optional full mode validates recommendation Korean responses and product cards.

## Commit Policy
- Stage only SlipAI maintenance files when unrelated local work exists.
- Do not stage local secrets or `.env.local`.
- Update these Markdown files with every maintenance change:
  - `docs/CURRENT_STATUS.md`
  - `docs/NEXT_ACTIONS.md`
  - `docs/CHANGELOG.md`

## Current Deployment Note
- Vercel Git Integration is prepared in the repository.
- The Vercel account still needs a one-time authenticated project connection and production environment variables before public storefront installs can rely on the Vercel URL.
