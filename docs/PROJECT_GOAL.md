# Project Goal

## Primary Goal
SlipAI is a one-tag onsite recommendation banner for Cafe24 and other commerce storefronts.
Advertisers install a stable script once, and SlipAI collects same-mall product/review context to show a Korean onsite banner recommending the product with the strongest review evidence.

## MVP Scope
- One stable storefront script: `/onsite.js` or `/widget/v1.js`.
- Anonymous page/event collection: `page_view`, `dwell_30s`, `scroll`, `cart_click`, banner `impression/click/close`.
- Background discovery/crawling of same-domain product pages.
- Review-count based product recommendation banner.
- Product cards with image, product name, price when available, review-based reason, and click-through URL.
- No visible AI 상담사/chat launcher on installed storefronts.

## Product Rules
- Recommend only products from the installed mall/catalog.
- Prioritize products with the most collected reviews.
- Explain why a product is recommended using review count, review highlights, and product data.
- Do not claim sales rank, bestseller status, inventory, coupons, or private customer data unless that data is explicitly supplied.
- Keep OpenAI/API keys server-side only; the script never exposes secrets.

## Maintenance Priority
1. Keep the stable install script working.
2. Prevent broken Korean/mojibake and old English widget copy.
3. Keep product cards readable, clickable, and image-safe.
4. Keep crawler/review extraction reliable.
5. Add persistence/observability before real advertiser traffic.
