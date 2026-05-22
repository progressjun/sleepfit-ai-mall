# SlipAI Installation Guide (Cafe24)

## 1) One-Line Install

Install this once in the Cafe24 common layout that runs on every page, preferably right before
`</body>`:

```html
<script async src="https://YOUR_SLIPAI_PROJECT.vercel.app/onsite.js" data-site-id="your_mall_id"></script>
```

This is the advertiser-facing install. The storefront loads a small SlipAI SDK, and the server decides
which banner, recommendation, chat message, product card, and CTA should appear.

## 2) Advanced Install

Use this when a brand needs an explicit project key, mall ID, shared-secret token, or dwell timing:

```html
<script
  async
  src="https://YOUR_SLIPAI_PROJECT.vercel.app/onsite.js"
  data-site-id="your_mall_id"
  data-project-key="pk_your_project_key"
  data-mall-id="your_mall_id"
  data-widget-token="optional_if_widget_secret_set"
  data-dwell-seconds="30">
</script>
```

`data-widget-token` is required only when `ONSITE_WIDGET_SHARED_SECRET` is set on the server.

The existing init-queue install is also supported for low-code builders:

```html
<script>
  window.slipai =
    window.slipai ||
    function () {
      (window.slipai.q = window.slipai.q || []).push(arguments);
    };
  window.slipai("init", {
    projectKey: "pk_your_project_key",
    mallId: "your_mall_id",
    token: "optional_if_widget_secret_set",
    dwellSeconds: 30
  });
</script>
<script async src="https://YOUR_SLIPAI_PROJECT.vercel.app/widget/v1.js"></script>
```

Do not pin the script with a version query string in production. Stable `/onsite.js` and `/widget/v1.js`
URLs let SlipAI updates roll out through GitHub -> Vercel without changing the advertiser site again.

## 3) What Gets Installed

- One SDK script on the storefront.
- Shadow DOM floating advisor chat and onsite recommendation banner.
- SlipAI-owned anonymous visitor/session IDs in browser storage.
- Product page detection, product image extraction, and internal link discovery.
- Event tracking for `page_view`, `dwell_30s`, `scroll`, `cart_click`, `chat_open`, `chat_message`,
  `banner_resolved`, `impression`, `click`, `close`, and conversion-style manual events.
- Server-side recommendation/chat calls. The browser never receives `OPENAI_API_KEY`.

## 4) Required Server Settings

Set these in `.env.local` locally and Vercel Environment Variables in production:

```bash
OPENAI_API_KEY=...
ONSITE_OPENAI_MODEL=gpt-5-mini
ONSITE_OPENAI_MAX_OUTPUT_TOKENS=900
ONSITE_OPENAI_REASONING_EFFORT=minimal

NEXT_PUBLIC_SLIPAI_DEFAULT_PROJECT_KEY=pk_slipai_test
NEXT_PUBLIC_SLIPAI_DEFAULT_MALL_ID=slipai-test-kr
ONSITE_WIDGET_ALLOWED_ORIGINS=https://your-mall.cafe24.com
ONSITE_WIDGET_SHARED_SECRET=optional_shared_secret

ONSITE_RATE_LIMIT_EVENTS=600
ONSITE_RATE_LIMIT_RECOMMENDATION=80
ONSITE_RATE_LIMIT_CHAT=120
```

For durable production storage, configure Supabase variables as documented in
`docs/VERCEL_DEPLOYMENT.md`. In-memory fallback is for demos only.

## 5) Public Endpoints

- `GET /onsite.js`
- `GET /widget/v1.js`
- `POST /api/widget/resolve`
- `POST /api/events`
- `POST /api/chat`
- `POST /api/onsite/events`
- `POST /api/onsite/recommendation`
- `POST /api/onsite/chat`
- `POST /api/onsite/discovery`
- `GET/POST /api/onsite/crawl`
- `GET /api/onsite/ops`

## 6) Scope Constraints

SlipAI only answers within the installed store context:

- current mall and current product
- crawled/synced products and reviews
- product options, comparison, shipping/exchange/return guidance only when supplied by the mall
- no coding, general knowledge, other brands, investment, politics, news, private customer data, or unsupported claims

## 7) Check Before Publish

- Vercel or custom HTTPS URL is live.
- `OPENAI_API_KEY` is only in server environment variables.
- `ONSITE_WIDGET_ALLOWED_ORIGINS` is strict for production.
- Product page shows the recommendation banner after 30 seconds.
- Product cards include images and click through to product URLs when available.
- AI chat answers in Korean and refuses unrelated coding/general questions.
