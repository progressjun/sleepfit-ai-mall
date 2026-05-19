import type { CommerceProvider } from "../provider";
import { MockCommerceProvider } from "./mock-provider";

export class ShopifyProviderPlaceholder
  extends MockCommerceProvider
  implements CommerceProvider
{
  getProviderName() {
    return "Shopify Adapter Placeholder";
  }

  async connect(params: unknown) {
    void params;
    return {
      success: false,
      connectionId: "shopify_placeholder",
      message:
        "Admin API, OAuth app, webhook, storefront data 연결을 2차에서 붙일 수 있는 placeholder입니다.",
    };
  }
}
