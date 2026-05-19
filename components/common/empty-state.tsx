import type { ReactNode } from "react";
import { InboxIcon } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-white p-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <InboxIcon />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <p className="max-w-md text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}
