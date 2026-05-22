# SleepFit AI Installation Guide

## Cafe24 one-line install

카페24 공통 레이아웃의 `</body>` 바로 위에 한 번만 설치합니다.

```html
<script async src="https://sleepfit-ai-mall.vercel.app/sleepfit.js?v=20260522-3" data-mall-id="sleepnsleepmall"></script>
```

## 기본 노출 위치

- 홈/카테고리/검색 페이지: 우측 하단 `나에게 맞는 베개 찾기` 플로팅 버튼
- 상품상세 페이지: 가격/옵션 영역 근처 인라인 `20초 수면핏 진단` 블록
- 장바구니/주문/로그인/마이페이지: 기본 미노출

## Optional script controls

필요할 때 스크립트 속성만 추가해서 운영자가 바로 조정할 수 있습니다.

```html
<script
  async
  src="https://sleepfit-ai-mall.vercel.app/sleepfit.js?v=20260522-3"
  data-mall-id="sleepnsleepmall"
  data-position="right"
  data-surfaces="home,collection,product_detail"
  data-auto-open="product"
></script>
```

| Attribute | Default | What it does |
| --- | --- | --- |
| `data-position` | `right` | 플로팅 버튼 위치. `right` 또는 `left`. |
| `data-surfaces` | `home,collection,product_detail` | 노출할 화면. `home`, `collection`, `product_detail`, `*` 사용 가능. |
| `data-auto-open` | `product` | 자동 오픈. `product`, `always`, `never`. |
| `data-disabled` | `false` | 긴급 중지 시 `true`. |
| `data-debug` | `false` | 브라우저 콘솔 디버그 로그. |
| `data-api-base` | script origin | API 도메인을 별도로 지정할 때 사용. |

## Public endpoints

- `GET /sleepfit.js`
- `GET /api/sleepfit/health`
- `POST /api/sleepfit/recommend`
- `POST /api/sleepfit/events`

## Production environment variables

```bash
SLEEPFIT_ALLOWED_ORIGINS="https://sleepnsleepmall.com,https://www.sleepnsleepmall.com,https://sleepnsleepmall.co.kr,https://www.sleepnsleepmall.co.kr"
SLEEPFIT_RATE_LIMIT_WINDOW_MS=60000
SLEEPFIT_RATE_LIMIT_RECOMMEND=120
SLEEPFIT_RATE_LIMIT_EVENTS=1000
```

SleepFit v1.1은 OpenAI 키 없이 동작합니다. 공개 상품 정보, 수동 보정 태그, 리뷰 근거, 익명 진단 답변만 사용합니다.

## Smoke tests

배포 후 아래 URL을 확인합니다.

- `https://sleepfit-ai-mall.vercel.app/api/sleepfit/health`
- `https://sleepfit-ai-mall.vercel.app/sleepfit-category-demo.html`
- `https://sleepfit-ai-mall.vercel.app/product/list.html?cate_no=45`
- `https://sleepfit-ai-mall.vercel.app/sleepfit-demo.html`

상품상세 기대 동작: 5문항 진단 완료 후 `추천 옵션 확인하기` 클릭 시 카페24 옵션 셀렉트로 스크롤됩니다.
