# SlipAI Installation Guide (Cafe24)

## 1) Install script only (homepage owner only needs this)

Put this single script in each Cafe24 HTML layer that runs on all pages (권장: `<head>` or before `</body>`):

```html
<script
  async
  src="https://YOUR_APP_DOMAIN/widget/v1.js"
  data-project-key="pk_your_project_key"
  data-mall-id="your_mall_id"
  data-widget-token="optional_if_widget_secret_set"
  data-dwell-seconds="30"
></script>
```

`/widget/v1.js` is served from this app.  
`data-widget-token` is optional when `ONSITE_WIDGET_SHARED_SECRET` is not set.

## 2) What gets installed

- Only one SDK script is installed on the storefront.
- Script creates a floating advisor chat + banner (Shadow DOM, no theme overwrite).
- Automatically sends:
  - `page_view`
  - `dwell_30s` (after configured timeout on product pages)
  - `scroll`, `cart_click`, `chat_open`, `chat_message`, `banner_cta_click`
- Recommendation API is called after 30s stay on product detail page.
- Recommendation payload includes image URLs and review highlights from crawled/synced catalog data.
- Discovery crawl starts from each page visit (home/detail/list/search/category links) and runs in background automatically.
- Recommendation data is returned from server-side OpenAI + local policy; browser never receives your OpenAI key.

## 3) Required server settings

In `.env.local` (server only):

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.4-mini
OPENAI_FALLBACK_MODEL=gpt-4.1-mini
OPENAI_REASONING_EFFORT=minimal

ONSITE_OPENAI_MODEL=gpt-5.4-nano
ONSITE_OPENAI_FALLBACK_MODEL=gpt-4.1-mini
ONSITE_OPENAI_MAX_OUTPUT_TOKENS=240

ONSITE_WIDGET_ALLOWED_ORIGINS="https://your-mall.cafe24.com"   # production should be strict
ONSITE_WIDGET_SHARED_SECRET=optional_shared_secret
ONSITE_RATE_LIMIT_EVENTS=600
ONSITE_RATE_LIMIT_RECOMMENDATION=80
ONSITE_RATE_LIMIT_CHAT=120

CAFE24_CLIENT_ID=...
CAFE24_CLIENT_SECRET=...
CAFE24_REDIRECT_URI=https://your-app-domain/api/cafe24/oauth/callback
```

## 4) Required pages

- `GET /widget/v1.js`
 - `POST /api/onsite/events`
 - `POST /api/onsite/recommendation`
 - `POST /api/onsite/chat`
 - `POST /api/onsite/discovery`
 - `GET/POST /api/onsite/crawl`
 - `GET /api/cafe24/oauth/start`
 - `GET /api/cafe24/oauth/callback`
 - `POST /api/cafe24/sync`

## 5) API flow

1. Ingestor installs script only on the homepage.
2. On first visit, widget sends discovered URLs from the current page to `/api/onsite/discovery`.
3. Crawler processes seed URLs in the background and stores products/reviews automatically.
4. Full catalog depth can be improved by running existing Cafe24 sync for authoritative product metadata (`/api/cafe24/sync`) when desired.
5. Customers browse page; widget tracks behavior and requests recommendation/chat using crawled and synced product data.

## 6) Scope constraints

SlipAI only answers within installed store context:
- current product context
- store reviews (pre-synced and policy filtered)
- shipping/return/refund guidance only when available in context
- no coding/general knowledge/other-brand/investment/news/etc.

## 7) Cost estimate (initial baseline)

Example assumption:  
- 40,000 daily visitors, average 1 banner call + 1 chat call per 8 sessions  
- 10,000 recommendation calls + 5,000 chat calls/day  
- Token target: concise outputs + `gpt-5.4-nano` fallback to `gpt-4.1-mini`  

Set `OPENAI_MODEL` and `ONSITE_OPENAI_MODEL` lower if daily budget is tight.

## 8) Check list before publish

- HTTPS endpoints
- strict CORS origins
- DB schema migration (products/reviews/event logs) or accepted memory fallback
- key exposure check (`OPENAI_API_KEY` must stay server-side only)
- script appears in all pages, and on product pages after 30 sec banner shows
- advisor asks and replies stay on brand/product scope only
