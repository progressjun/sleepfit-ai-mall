"use client";

import { SectionHeader } from "@/components/common/section-header";
import { PaymentInputForm } from "@/components/payments/payment-input-form";
import { PaymentRecommendationCard } from "@/components/payments/payment-recommendation-card";
import { PgChecklist } from "@/components/payments/pg-checklist";
import { useDemoStore } from "@/lib/store/use-demo-store";

export default function PaymentsPage() {
  const latest = useDemoStore((state) => state.paymentRecommendations[0]);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="페이먼츠 선택 지원"
        description="객단가, 결제 방식, 반복구매 구조에 맞는 결제 환경을 검토합니다."
      />
      <div className="grid gap-6 2xl:grid-cols-[520px_minmax(0,1fr)]">
        <PaymentInputForm />
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="xl:col-span-2">
            <PaymentRecommendationCard recommendation={latest} />
          </div>
          <PgChecklist title="PG 선택 체크리스트" items={latest?.pgChecklist ?? []} />
          <PgChecklist title="승인 필요 항목" items={latest?.approvalRequirements ?? []} />
          <PgChecklist title="결제 이탈 리스크" items={latest?.conversionRisks ?? []} />
          <PgChecklist title="테스트 체크리스트" items={latest?.testPlan ?? []} />
        </div>
      </div>
    </div>
  );
}
