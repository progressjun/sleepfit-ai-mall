import type { SleepfitAbGroup } from "@/lib/sleepfit/schemas";

export interface SleepfitAbVariant {
  group: SleepfitAbGroup;
  launcherText: string;
  productDetailCta: string;
}

export const SLEEPFIT_AB_TEST = {
  storageKey: "sleepfit_ab_group",
  variants: {
    A: {
      group: "A",
      launcherText: "나에게 맞는 베개 20초 만에 찾기",
      productDetailCta: "내 옵션 확인하기",
    },
    B: {
      group: "B",
      launcherText: "내 수면 습관에 맞는 베개 추천받기",
      productDetailCta: "이 상품이 맞는지 확인하기",
    },
  } satisfies Record<SleepfitAbGroup, SleepfitAbVariant>,
};
