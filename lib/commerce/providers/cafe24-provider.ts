import type { CommerceProvider } from "../provider";
import { cafe24RequiredScopes } from "../cafe24-capabilities";
import { MockCommerceProvider } from "./mock-provider";

export class Cafe24ProviderPlaceholder
  extends MockCommerceProvider
  implements CommerceProvider
{
  getProviderName() {
    return "Cafe24 Adapter Placeholder";
  }

  async connect(params: unknown) {
    void params;
    return {
      success: false,
      connectionId: "cafe24_placeholder",
      message:
        `OAuth 인증, access token, refresh token, Admin API, webhook 연결 지점이 준비된 placeholder입니다. 필요 scope: ${cafe24RequiredScopes.join(", ")}`,
    };
  }
}
