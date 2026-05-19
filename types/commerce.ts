import type { Product } from "./product";

export interface ConnectionResult {
  success: boolean;
  connectionId: string;
  message: string;
}

export interface TokenResult {
  success: boolean;
  expiresAt?: string;
  message: string;
}

export interface ProductDetail extends Product {
  descriptionHtml: string;
  images: string[];
}

export interface UpdateResult {
  success: boolean;
  externalId?: string;
  message: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
}

export interface Review {
  id: string;
  productId: string;
  rating: number;
  content: string;
}

export interface ScriptPayload {
  name: string;
  snippet: string;
  events: string[];
}

export interface ScriptInstallResult {
  success: boolean;
  message: string;
}
