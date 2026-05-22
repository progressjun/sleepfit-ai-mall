# SlipAI One-Tag Architecture

SlipAI is a lightweight storefront SDK plus server-side recommendation system.
The storefront installs one stable script; the server decides which review-based product banner to show.

```html
<script async src="https://slipai-test-kr.vercel.app/onsite.js" data-site-id="brand_mall_id"></script>
```

## Runtime Flow

```text
Storefront
  -> /onsite.js or /widget/v1.js
  -> collect anonymous visitor/session/page/product context
  -> send page_view and discovery URLs
  -> /api/onsite/discovery queues same-domain URLs
  -> crawler extracts products, images, and reviews
  -> /api/onsite/recommendation returns the most-reviewed same-mall product banner
  -> Shadow DOM renders the banner and product cards
  -> impression/click/close events are recorded
```

## Storefront Responsibilities

- Load the stable script once.
- Create an anonymous SlipAI visitor/session ID.
- Detect page type, product name, price, image, product number, and URL when possible.
- Send same-domain discovery URLs so the backend crawler can build the catalog.
- Render only the recommendation banner inside Shadow DOM.
- Never expose OpenAI keys, Cafe24 tokens, or server secrets.

## Server Responsibilities

- Validate widget auth, origin, and rate limits.
- Store events and crawler discoveries.
- Crawl same-domain product pages with bounded limits.
- Extract product name, price, image, URL, review text, and rating.
- Rank same-mall products by collected review count.
- Return Korean banner copy explaining why the top product is recommended.

## Public Interfaces

- `/onsite.js`: one-line compatibility loader for `data-site-id` installs.
- `/widget/v1.js`: advanced SlipAI loader for `window.slipai("init", ...)` installs.
- `/api/onsite/events`: event ingestion.
- `/api/onsite/discovery`: discovered URL ingestion.
- `/api/onsite/crawl`: bounded crawler worker trigger.
- `/api/onsite/recommendation`: review-count based banner content.
- `/api/widget/resolve`: compatibility banner resolver; chat is disabled.
- `/api/events`: compatibility event ingestion.

Legacy chat APIs may exist for backward compatibility, but the storefront widget must not render an AI 상담사 or call chat endpoints.

## Stable Install Contract

- Brands keep the same `/onsite.js` or `/widget/v1.js` URL.
- Future GitHub -> Vercel deployments update behavior through the stable script.
- Production installs should not pin version query strings.
- CSP allowlists may need the SlipAI domain for `script-src`, `connect-src`, and `img-src`.
