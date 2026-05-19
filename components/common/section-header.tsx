import type { ReactNode } from "react";

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-4xl flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Commerce operation module
            </p>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">{title}</h1>
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {action}
      </div>
    </div>
  );
}
