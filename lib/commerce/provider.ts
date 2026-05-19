import type {
  ConnectionResult,
  Order,
  Product,
  ProductDetail,
  Review,
  ScriptInstallResult,
  ScriptPayload,
  TokenResult,
  UpdateResult,
} from "@/types";

export interface CommerceProvider {
  getProviderName(): string;
  connect(params: unknown): Promise<ConnectionResult>;
  refreshToken(connectionId: string): Promise<TokenResult>;
  listProducts(projectId: string): Promise<Product[]>;
  getProduct(productId: string): Promise<ProductDetail>;
  updateProduct(productId: string, payload: unknown): Promise<UpdateResult>;
  listOrders?(projectId: string): Promise<Order[]>;
  listReviews?(projectId: string): Promise<Review[]>;
  installScript?(
    projectId: string,
    script: ScriptPayload,
  ): Promise<ScriptInstallResult>;
}
