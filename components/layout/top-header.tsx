"use client";

import Link from "next/link";
import { BellIcon, SearchIcon, ShieldCheckIcon, SparklesIcon, UserCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoStore } from "@/lib/store/use-demo-store";

export function TopHeader() {
  const { currentUser, projects, activeProjectId } = useDemoStore();
  const activeProject = projects.find((project) => project.id === activeProjectId);

  return (
    <header className="sticky top-0 z-20 flex h-[76px] min-w-0 items-center justify-between border-b border-slate-200 bg-[#f6f8fb]/95 px-5 backdrop-blur 2xl:px-7">
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">Current project</p>
        <h2 className="truncate text-sm font-semibold text-slate-950">
          {activeProject?.projectName ?? "No project"}
        </h2>
      </div>
      <div className="flex items-center gap-2 xl:gap-3">
        <div className="hidden h-9 w-80 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 xl:flex">
          <SearchIcon className="size-4" />
          Search tasks, products, approvals, logs
        </div>
        <div className="hidden items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 2xl:flex">
          <ShieldCheckIcon className="size-4" />
          Provider placeholder · safe mode
        </div>
        <Link
          href="/workspace"
          className="hidden h-9 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-medium text-white lg:inline-flex"
        >
          <SparklesIcon className="size-4" />
          AI workspace
        </Link>
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 md:flex">
          <UserCircleIcon className="size-4 text-slate-500" />
          <span className="max-w-48 truncate">{currentUser.email}</span>
        </div>
        <Button variant="outline" size="icon-lg" aria-label="Notifications">
          <BellIcon className="size-4" />
        </Button>
      </div>
    </header>
  );
}
