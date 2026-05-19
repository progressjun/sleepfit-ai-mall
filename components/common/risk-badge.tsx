import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

const labels: Record<RiskLevel, string> = {
  low: "낮음",
  medium: "중간",
  high: "높음",
};

const tone: Record<RiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <Badge variant="secondary" className={cn("border-transparent", tone[level])}>
      리스크 {labels[level]}
    </Badge>
  );
}
