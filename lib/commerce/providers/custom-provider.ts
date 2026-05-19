import type { CommerceProvider } from "../provider";
import { MockCommerceProvider } from "./mock-provider";

export class CustomProviderPlaceholder
  extends MockCommerceProvider
  implements CommerceProvider
{
  getProviderName() {
    return "Custom Mall Adapter Placeholder";
  }

  async connect(params: unknown) {
    void params;
    return {
      success: false,
      connectionId: "custom_placeholder",
      message:
        "CSV, REST API, SFTP, webhook 등 프로젝트별 연결 방식을 확장하는 placeholder입니다.",
    };
  }
}
