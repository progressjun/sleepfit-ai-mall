# SleepFit AI 카페24 설치 가이드

## 설치 코드

카페24 공통 레이아웃 하단, `</body>` 바로 위에 아래 스크립트를 한 번만 삽입합니다.

```html
<script async src="https://sleepfit-ai-mall.vercel.app/sleepfit.js" data-mall-id="sleepnsleepmall"></script>
```

## 설치 위치

- 카페24 관리자 → 디자인 편집 → 공통 레이아웃 또는 공통 스크립트 영역
- 가능한 위치: footer, 하단 공통 include, `</body>` 직전
- 중복 삽입 방지 로직이 있으나, 운영에서는 한 번만 넣는 것을 권장합니다.

## 허용 도메인

현재 기본 허용 도메인:

- `https://sleepnsleepmall.com`
- `https://www.sleepnsleepmall.com`
- `https://sleepnsleepmall.co.kr`
- `https://www.sleepnsleepmall.co.kr`
- `https://sleepnsleepmall.cafe24.com`

환경변수로 직접 제어할 때:

```bash
SLEEPFIT_ALLOWED_ORIGINS="https://sleepnsleepmall.com,https://www.sleepnsleepmall.com,https://sleepnsleepmall.co.kr,https://www.sleepnsleepmall.co.kr,https://sleepnsleepmall.cafe24.com"
```

## 선택 옵션

```html
<script
  async
  src="https://sleepfit-ai-mall.vercel.app/sleepfit.js"
  data-mall-id="sleepnsleepmall"
  data-position="right"
  data-surfaces="home,collection,product_detail,cart,purchase_complete"
  data-auto-open="none"
></script>
```

| Attribute | 기본값 | 설명 |
| --- | --- | --- |
| `data-position` | `right` | 플로팅 버튼 위치. `right` 또는 `left` |
| `data-surfaces` | `home,collection,product_detail,cart,purchase_complete` | 노출 페이지 타입 |
| `data-auto-open` | `none` | 자동 열림. 운영에서는 `none` 권장 |
| `data-disabled` | `false` | 긴급 중지 시 `true` |
| `data-debug` | `false` | 브라우저 콘솔 디버그 로그 |
| `data-api-base` | script origin | API 도메인을 별도로 지정할 때 사용 |

## 페이지별 확인 방법

메인 페이지:

- 하단 플로팅 버튼이 보이는지 확인
- 문구 A/B 중 하나가 보이는지 확인
- 클릭 시 진단 패널이 열리는지 확인

카테고리 페이지:

- 상품 리스트 상단 미니 배너가 삽입되는지 확인
- 하단 플로팅 버튼이 보이는지 확인
- 진단 완료 후 1순위 추천, 대안 2개, 함께 볼 상품 1~2개가 노출되는지 확인

상품상세 페이지:

- 옵션/구매 버튼 근처에 인라인 카드가 보이는지 확인
- 진단 완료 후 현재 상품이 추천되면 CTA가 옵션 영역으로 스크롤되는지 확인
- 네이버페이, 장바구니, 바로구매 버튼을 가리지 않는지 확인

장바구니 페이지:

- 장바구니 하단 또는 주문 영역 근처에 추천 카드가 보이는지 확인
- 함께 볼 상품 CTA가 상품상세로 이동하는지 확인

구매완료 페이지:

- 다음 구매 추천 카드가 보이는지 확인
- 리뷰/재구매 흐름을 방해하지 않는지 확인

## 정상 작동 확인 URL

- `https://sleepfit-ai-mall.vercel.app/api/sleepfit/health`
- `https://sleepfit-ai-mall.vercel.app/sleepfit-demo.html`
- `https://sleepfit-ai-mall.vercel.app/sleepfit-category-demo.html`
- `https://sleepfit-ai-mall.vercel.app/product/list.html?cate_no=45`
- `https://sleepfit-ai-mall.vercel.app/sleepfit-admin?key=demo`

## 문제 발생 시 체크리스트

- 스크립트가 한 번만 삽입되어 있는가
- 브라우저 콘솔에 CORS 오류가 있는가
- `sleepnsleepmall.com`, `sleepnsleepmall.co.kr`, `sleepnsleepmall.cafe24.com` 중 실제 origin이 허용되어 있는가
- `/sleepfit.js`가 200으로 응답하는가
- `/api/sleepfit/recommend`가 200으로 응답하는가
- `/api/sleepfit/events` 실패가 UI를 멈추게 하지 않는가
- 카페24 옵션 영역 selector가 실제 페이지에서 감지되는가
- 모바일 하단 고정 구매 버튼과 플로팅 버튼이 겹치지 않는가
- SnapReview, 네이버페이, 카페24 장바구니 버튼 위로 패널이 과도하게 올라오지 않는가
