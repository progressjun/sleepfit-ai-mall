import { CreditCardIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PaymentRecommendation } from "@/types";

export function PaymentRecommendationCard({ recommendation }: { recommendation?: PaymentRecommendation }) {
  return (
    <Card className="border-slate-200 bg-gradient-to-br from-white to-cyan-50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCardIcon />
          추천 결제 구성
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {(recommendation?.recommendedPaymentMethods ?? ["추천안을 생성하면 결제수단이 표시됩니다."]).map((item) => (
          <span key={item} className="rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">{item}</span>
        ))}
      </CardContent>
    </Card>
  );
}
