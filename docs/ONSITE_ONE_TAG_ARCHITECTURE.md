# SlipAI One-Tag Onsite Architecture

## Core Principle

SlipAI is not a hardcoded banner component that each advertiser edits inside their storefront.
The storefront installs one small loader script, and SlipAI servers decide what to show, when to
show it, what product/review evidence to use, and how to record impressions, clicks, closes, chats,
and conversions.

```html
<script async src="https://slipai-test-kr.vercel.app/onsite.js" data-site-id="brand_mall_id"></script>
```

The lower-level SlipAI install still supports explicit project and mall keys when a brand needs a
shared secret or custom project mapping:

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
    dwellSeconds: 30
  });
</script>
<script async src="https://slipai-test-kr.vercel.app/widget/v1.js"></script>
```

The script is the executor. The server is the decision layer. The operator screen is the control
center. Product/review data and AI responses stay server-side; OpenAI API keys never go into the
browser.

## Runtime Flow

```text
Advertiser storefront
  -> /onsite.js or /widget/v1.js loader
  -> anonymous SlipAI visitor/session id
  -> page/product/discovery/event payloads
  -> /api/widget/resolve compatibility config
  -> /api/events compatibility tracking
  -> /api/chat compatibility AI proxy
  -> /api/onsite/context
  -> /api/onsite/recommendation
  -> /api/onsite/chat
  -> /api/onsite/events
  -> Shadow DOM banner/advisor UI
```

## Loader Responsibilities

- Read `siteId` from the one-line install, or `projectKey`, `mallId`, optional `widgetToken`,
  and trigger settings from the advanced init snippet.
- Create SlipAI-owned anonymous IDs in `localStorage` and `sessionStorage`.
- Collect page URL, referrer, viewport, product hints, image hints, and internal discovery links.
- Request server-side context and recommendations instead of hardcoding campaign copy.
- Render the banner/advisor inside Shadow DOM to reduce CSS collisions.
- Track `page_view`, `banner_resolved`, `impression`, `click`, `close`, `dwell_30s`, `scroll`,
  `cart_click`, `chat_open`, `chat_message`, and manual conversion-style events.
- Prefer `navigator.sendBeacon` for tracking and fall back to `fetch`.
- Never throw errors into the advertiser page.

## Server Responsibilities

- Authenticate widget traffic with project key, origin allowlist, and optional shared secret.
- Validate all payloads with schemas before storing or invoking AI.
- Keep OpenAI calls on the server.
- Limit AI answers to the installed mall's products, reviews, options, and purchase decision support.
- Block coding, general knowledge, other-brand, private customer data, and unsupported claims.
- Resolve recommendations from crawled/synced product and review data.
- Store events for operator visibility and future campaign reporting.

## Current MVP Mapping

SlipAI currently maps the generic "banner resolve API" concept to these endpoints:

- `/onsite.js`: one-line compatibility loader for `data-site-id` installs.
- `/api/widget/resolve`: compatibility config API returning `banner` and `chat` JSON.
- `/api/chat`: compatibility AI advisor API that proxies to the scoped onsite chat engine.
- `/api/events`: compatibility event API for generic banner/chat/conversion events.
- `/api/onsite/context`: server-driven greeting, placeholder, and quick guidance copy.
- `/api/onsite/recommendation`: server-driven banner content, review highlights, product cards, CTA, and disclosure.
- `/api/onsite/chat`: server-driven AI advisor answer scoped to the installed mall.
- `/api/onsite/events`: event tracking.
- `/api/onsite/discovery` and `/api/onsite/crawl`: zero-action storefront catalog discovery.

This means banner content is already server-driven. A future generic campaign manager can add
campaign tables, priority rules, and a dedicated `/api/banner/resolve` compatibility layer without
changing the installed storefront script.

## Future Campaign Layer

Add only after persistence, auth, and operator permissions are finalized:

- `campaigns`: active state, priority, banner type, position, copy, image, CTA, trigger, dates.
- `targeting_rules`: URL, device, UTM, audience, and product/category conditions.
- `events`: impression, click, close, conversion, revenue, and metadata.
- Admin CRUD for sites and campaigns.
- Reporting for CTR, CVR, close rate, conversion revenue, and campaign fatigue.

Until that layer exists, do not imply sales rank, bestseller status, discounts, coupons, inventory,
membership, order history, or private customer identity unless supplied by a verified integration.
