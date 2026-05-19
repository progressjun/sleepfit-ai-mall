import {
  BadgeCheckIcon,
  KeyRoundIcon,
  LayoutTemplateIcon,
  LinkIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { RiskBadge } from "@/components/common/risk-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cafe24CapabilityChecklist } from "@/lib/commerce/cafe24-capabilities";

const cafe24ReadinessItems = [
  {
    title: "앱/OAuth",
    area: "OAuth/App",
    description: "앱 권한 범위, access token/refresh token 저장, 토큰 갱신 실패 대응",
    icon: KeyRoundIcon,
    risk: "medium" as const,
  },
  {
    title: "상품/진열",
    area: "상품",
    description: "상품 기본정보, 옵션/품목, 진열분류, 추가 이미지, 상세 HTML 이전",
    icon: LayoutTemplateIcon,
    risk: "medium" as const,
  },
  {
    title: "주문/회원",
    area: "주문/회원",
    description: "주문 조회 범위, 회원 등급/적립금, 개인정보 보관 기간 확인",
    icon: BadgeCheckIcon,
    risk: "high" as const,
  },
  {
    title: "디자인 스킨",
    area: "디자인 스킨",
    description: "스킨 백업 후 공통 레이아웃, 상품상세, 주문완료 템플릿 분리 수정",
    icon: LinkIcon,
    risk: "medium" as const,
  },
  {
    title: "마케팅 측정",
    area: "마케팅 측정",
    description: "GTM 삽입 위치, purchase value/currency, 중복 전환 방지 키 점검",
    icon: ShieldAlertIcon,
    risk: "high" as const,
  },
];

export function Cafe24ReadinessPanel() {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Cafe24형 운영 전면 체크</CardTitle>
        <p className="text-sm leading-6 text-slate-600">
          실제 외부 API는 호출하지 않지만, 솔루션사 관리자 콘솔에서 필요한 연결 지점을 기준으로 점검합니다.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {cafe24ReadinessItems.map((item) => {
          const Icon = item.icon;
          const capability = cafe24CapabilityChecklist.find((entry) => entry.area === item.area);
          return (
            <div key={item.title} className="rounded-2xl border bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                  <Icon />
                </div>
                <RiskBadge level={item.risk} />
              </div>
              <p className="text-sm font-semibold text-slate-950">{item.title}</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">{item.description}</p>
              <p className="mt-3 text-xs font-medium text-slate-500">
                {capability?.items.slice(0, 3).join(" · ")}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
