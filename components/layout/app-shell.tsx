import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { TopHeader } from "./top-header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#f6f8fb] text-slate-950">
      <div className="flex min-h-dvh">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopHeader />
          <main className="w-full min-w-0 max-w-full flex-1 overflow-x-hidden px-5 py-5 2xl:px-7">{children}</main>
        </div>
      </div>
    </div>
  );
}
