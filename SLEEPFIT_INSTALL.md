# SleepFit AI Installation Guide

## Cafe24 one-line install

Install this script once in the Cafe24 common layout, preferably right before `</body>`:

```html
<script async src="https://YOUR_VERCEL_DOMAIN/sleepfit.js" data-mall-id="sleepnsleepmall"></script>
```

## What it does

- Shows an inline 20-second sleep-fit quiz on product detail pages.
- Shows a floating "나에게 맞는 베개 찾기" launcher on home and category pages.
- Recommends a pillow, bedding, or set using only public product information, review evidence, and anonymous quiz answers.
- Sends shoppers to the option area when the recommended product is the current product.
- Opens the recommended product page when the recommendation is a different product.
- Tracks anonymous `impression`, `quiz_start`, `answer_select`, `recommendation_view`, `cta_click`, and `add_to_cart_click` events.

## Public endpoints

- `GET /sleepfit.js`
- `POST /api/sleepfit/recommend`
- `POST /api/sleepfit/events`

## Production environment variables

```bash
SLEEPFIT_ALLOWED_ORIGINS="https://sleepnsleepmall.com,https://sleepnsleepmall.co.kr"
SLEEPFIT_RATE_LIMIT_WINDOW_MS=60000
SLEEPFIT_RATE_LIMIT_RECOMMEND=120
SLEEPFIT_RATE_LIMIT_EVENTS=1000
```

SleepFit does not require OpenAI for v1. The first version uses deterministic product-fit rules and curated public product/review evidence.

## Smoke tests

After deployment, open:

- `/sleepfit-demo.html`
- `/sleepfit-category-demo.html`
- `/sleepfit.js`

Expected product-detail behavior: complete the five quiz questions, see a recommendation, then click `추천 옵션 확인하기` and confirm the page scrolls to the Cafe24 option selector.
