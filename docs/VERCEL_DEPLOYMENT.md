# SlipAI Vercel Deployment

## Target Architecture

```text
GitHub repository
  -> Vercel Git Integration
  -> Production URL such as https://YOUR_SLIPAI_PROJECT.vercel.app
  -> Storefront installs /widget/v1.js from that URL
```

Local tunnels such as Cloudflare quick tunnel, localtunnel, or ngrok are only for short smoke tests.
They should not be used for advertiser or customer traffic because the URL can expire and depends on the
local PC staying online.

## One-Time Vercel Setup

1. In Vercel, import the GitHub repository `progressjun/slipai`.
2. Framework preset: `Next.js`.
3. Install command: `npm ci`.
4. Build command: `npm run build`.
5. Production branch: repository default branch, currently `master`.
6. Preview deployments: enabled for pull requests and non-production branches.
7. After the first deploy, copy the Production URL and set `NEXT_PUBLIC_SLIPAI_PUBLIC_ORIGIN` to that URL.

## Required Vercel Environment Variables

Set these in Vercel Project Settings -> Environment Variables for Production and Preview.
Never commit the real values to GitHub.

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5-mini
OPENAI_REASONING_EFFORT=minimal
OPENAI_MAX_OUTPUT_TOKENS=1500
OPENAI_PROMPT_CACHE_RETENTION=24h

ONSITE_OPENAI_MODEL=gpt-5-mini
ONSITE_OPENAI_MAX_OUTPUT_TOKENS=900
ONSITE_OPENAI_REASONING_EFFORT=minimal

NEXT_PUBLIC_SLIPAI_PUBLIC_ORIGIN=https://YOUR_SLIPAI_PROJECT.vercel.app
ONSITE_WIDGET_ALLOWED_ORIGINS=https://your-mall.cafe24.com,https://www.your-mall.com
ONSITE_WIDGET_SHARED_SECRET=use-a-long-random-secret

ONSITE_RATE_LIMIT_WINDOW_MS=60000
ONSITE_RATE_LIMIT_EVENTS=600
ONSITE_RATE_LIMIT_RECOMMENDATION=80
ONSITE_RATE_LIMIT_CHAT=120
ONSITE_RATE_LIMIT_DISCOVERY=240
ONSITE_RATE_LIMIT_CRAWL=20
```

For durable production storage, also set Supabase variables before sending real traffic:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Without Supabase, SlipAI falls back to in-memory storage. That is acceptable for demos, but Vercel
serverless instances can cold-start or scale across instances, so crawler/catalog/event state is not durable.

## Storefront Install Script

After Vercel creates the public URL, install this once before `</body>` in the Cafe24 common layout:

```html
<script>
  window.slipai =
    window.slipai ||
    function () {
      (window.slipai.q = window.slipai.q || []).push(arguments);
    };

  window.slipai("init", {
    projectKey: "pk_brand_key",
    mallId: "brand_mall_id",
    token: "same-value-as-ONSITE_WIDGET_SHARED_SECRET",
    dwellSeconds: 30
  });
</script>
<script
  async
  src="https://YOUR_SLIPAI_PROJECT.vercel.app/widget/v1.js?v=0.3.1-ko-20260521">
</script>
```

If no `ONSITE_WIDGET_SHARED_SECRET` is set, omit `token`, but production should use a secret and strict
`ONSITE_WIDGET_ALLOWED_ORIGINS`.

## Smoke Check

1. Open `https://YOUR_SLIPAI_PROJECT.vercel.app/website`.
2. Confirm the copied install snippet uses the Vercel URL, not `localhost` or a tunnel URL.
3. Open `https://YOUR_SLIPAI_PROJECT.vercel.app/widget/v1.js?v=healthcheck`.
4. Confirm the response contains `SlipAI 상담사`.
5. Install the snippet on a test storefront.
6. In the browser console, confirm `window.__SLIPAI.getState()` exists.
7. On a product page, wait 30 seconds and confirm the recommendation banner appears.
8. Ask a product question and confirm the advisor answers only within the installed mall/product scope.
9. Ask a coding/general question and confirm SlipAI refuses.

## Git Flow

- Work on `codex/*` branches.
- Open a pull request into `master`.
- Vercel creates a Preview Deployment for the PR.
- After verification, merge into `master`.
- Vercel creates or updates the Production Deployment automatically.
