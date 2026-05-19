import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
    </div>
  );
}
