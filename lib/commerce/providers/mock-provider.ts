import { mockProducts } from "@/data/mock/products";
import type { ProductDetail, ScriptPayload } from "@/types";
import type { CommerceProvider } from "../provider";

export class MockCommerceProvider implements CommerceProvider {
  getProviderName() {
    return "Mock Provider";
  }

  async connect(params?: unknown): Promise<{ success: boolean; connectionId: string; message: string }> {
    void params;
    return {
      success: true,
      connectionId: "mock_connection_001",
      message: "Mock provider 연결이 준비되었습니다.",
    };
  }

  async refreshToken(connectionId: string) {
    return {
      success: true,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      message: `${connectionId} 토큰이 mock으로 갱신되었습니다.`,
    };
  }

  async listProducts() {
    return mockProducts;
  }

  async getProduct(productId: string): Promise<ProductDetail> {
    const product = mockProducts.find((item) => item.id === productId) ?? mockProducts[0];
    return {
      ...product,
      descriptionHtml: "<p>Mock provider 상세 설명입니다.</p>",
      images: ["/placeholder-product.png"],
    };
  }

  async updateProduct(productId: string) {
    return {
      success: true,
      externalId: productId,
      message: "MVP에서는 실제 상품을 수정하지 않고 적용 준비 상태만 반환합니다.",
    };
  }

  async installScript(_projectId: string, script: ScriptPayload) {
    return {
      success: true,
      message: `${script.name} 스크립트 설치가 mock으로 완료 처리되었습니다.`,
    };
  }
}
