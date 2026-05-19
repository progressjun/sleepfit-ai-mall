import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <Icon className="text-slate-400" />
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="text-3xl font-semibold text-slate-950">{value}</div>
        <p className="text-xs leading-5 text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}
