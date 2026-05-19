"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ActivityIcon,
  BotIcon,
  CheckSquareIcon,
  CreditCardIcon,
  FileTextIcon,
  GaugeIcon,
  HomeIcon,
  LayoutDashboardIcon,
  MonitorCogIcon,
  PanelsTopLeftIcon,
  SettingsIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TagsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Control tower",
    items: [
      { href: "/dashboard", label: "운영 관제", icon: LayoutDashboardIcon },
      { href: "/solution-audit", label: "솔루션 점검", icon: PanelsTopLeftIcon },
      { href: "/workspace", label: "자연어 작업실", icon: SparklesIcon },
      { href: "/hermes", label: "Hermes 에이전트", icon: BotIcon },
    ],
  },
  {
    label: "Commerce modules",
    items: [
      { href: "/migration", label: "이전/데이터", icon: MonitorCogIcon },
      { href: "/website", label: "스킨/홈페이지", icon: HomeIcon },
      { href: "/detail-pages", label: "상품상세", icon: FileTextIcon },
      { href: "/ai-cs", label: "CS/게시판", icon: BotIcon },
      { href: "/marketing-scripts", label: "전환 측정", icon: TagsIcon },
      { href: "/payments", label: "결제/정산", icon: CreditCardIcon },
    ],
  },
  {
    label: "Governance",
    items: [
      { href: "/approval", label: "승인 대기열", icon: CheckSquareIcon },
      { href: "/logs", label: "작업 로그", icon: ActivityIcon },
      { href: "/settings", label: "설정", icon: SettingsIcon },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[268px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm">
          <ShoppingBagIcon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-950">Commerce OS</p>
          <p className="truncate text-xs text-slate-500">AI migration control</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              {group.label}
            </p>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors",
                      active && "bg-slate-950 text-white shadow-sm",
                      !active && "hover:bg-slate-100 hover:text-slate-950",
                    )}
                  >
                    <Icon className="size-4" data-icon="inline-start" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="m-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <GaugeIcon className="size-4" />
          Safe apply mode
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-600">
          AI 생성물은 승인 후에도 외부 시스템에 자동 적용하지 않습니다.
        </p>
      </div>
    </aside>
  );
}
