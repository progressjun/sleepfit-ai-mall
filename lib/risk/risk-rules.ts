import type { RiskFlag } from "@/types";

const riskyExpressions = [
  "완치",
  "치료",
  "100% 효과",
  "부작용 없음",
  "무조건",
  "보장",
  "즉시 효과",
  "의학적 효능",
  "다이어트 보장",
  "최저가 보장",
  "경쟁사 비방",
  "허위 후기",
  "과장 광고",
];

export function detectRiskFlags(text: string): RiskFlag[] {
  const found = riskyExpressions.filter((expression) => text.includes(expression));

  return found.map((expression) => ({
    level:
      expression.includes("완치") ||
      expression.includes("치료") ||
      expression.includes("허위")
        ? "high"
        : "medium",
    title: `주의 표현 감지: ${expression}`,
    description:
      "광고 심의, 소비자 오인, 플랫폼 정책 리스크가 있을 수 있어 대체 표현 검토가 필요합니다.",
  }));
}

export function detectRiskFlagsFromObject(input: unknown): RiskFlag[] {
  const text = JSON.stringify(input ?? "");
  const unique = new Map<string, RiskFlag>();

  for (const flag of detectRiskFlags(text)) {
    unique.set(flag.title, flag);
  }

  return Array.from(unique.values());
}
