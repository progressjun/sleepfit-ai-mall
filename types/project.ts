import type { WorkStatus } from "@/types";

export type CommercePlatform =
  | "Cafe24"
  | "Legacy Mall"
  | "Hosted Mall"
  | "Custom Mall"
  | "WordPress"
  | "Shopify"
  | "Other";

export interface Project {
  id: string;
  projectName: string;
  brandName: string;
  currentSiteUrl: string;
  targetSiteUrl: string;
  currentPlatform: CommercePlatform;
  migrationStatus: WorkStatus;
  createdAt: string;
  updatedAt: string;
}
