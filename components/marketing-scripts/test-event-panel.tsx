import { AlertTriangleIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TestEventPanel() {
  return (
    <Card className="border-amber-200 bg-amber-50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <AlertTriangleIcon />
          구매 이벤트 주의사항
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm leading-6 text-amber-900">
        <p>purchase 이벤트에는 value, currency 전달이 필요합니다.</p>
        <p>주문번호 기준 중복 전환 방지 키를 유지해야 합니다.</p>
      </CardContent>
    </Card>
  );
}
