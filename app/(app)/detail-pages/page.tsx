"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/common/section-header";
import { Cafe24ReadinessPanel } from "@/components/cafe24/cafe24-readiness-panel";
import { DetailGenerationCard } from "@/components/detail-pages/detail-generation-card";
import { DetailPagePreview } from "@/components/detail-pages/detail-page-preview";
import { ProductInputForm } from "@/components/detail-pages/product-input-form";
import { ProductSelector } from "@/components/detail-pages/product-selector";
import { RiskFlagPanel } from "@/components/detail-pages/risk-flag-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoStore } from "@/lib/store/use-demo-store";

export default function DetailPagesPage() {
  const products = useDemoStore((state) => state.products);
  const generations = useDemoStore((state) => state.detailPageGenerations);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? products[0];
  const latest = generations.find((item) => item.productId === selectedProduct?.id);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="상세페이지 제작 스튜디오"
        description="상품별 USP, 구매장벽, FAQ, 광고 카피를 기반으로 전환형 상세페이지 초안을 생성합니다."
      />
      <Cafe24ReadinessPanel />
      <div className="grid gap-6 2xl:grid-cols-[360px_minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>상품 선택</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductSelector products={products} selectedProductId={selectedProductId} onSelect={setSelectedProductId} />
            </CardContent>
          </Card>
          {selectedProduct && <ProductInputForm key={selectedProduct.id} product={selectedProduct} />}
        </div>
        <DetailPagePreview generation={latest} />
        <div className="flex flex-col gap-4">
          <DetailGenerationCard generation={latest} />
          <RiskFlagPanel flags={latest?.riskFlags ?? []} />
        </div>
      </div>
    </div>
  );
}
