import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors org overview: metric cards, chart band, table — inside DashboardShell main. */
export function DashboardRouteSkeleton() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6 @5xl/main:grid-cols-4">
          {["a", "b", "c", "d"].map((k) => (
            <div
              key={k}
              className="rounded-xl border bg-card/40 p-4 shadow-xs"
              aria-hidden
            >
              <Skeleton className="mb-3 h-3 w-24" />
              <Skeleton className="mb-4 h-8 w-32" />
              <Skeleton className="h-3 w-full max-w-[200px]" />
            </div>
          ))}
        </div>
        <div className="px-4 lg:px-6">
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </div>
        <div className="flex flex-col gap-2 px-4 lg:px-6">
          <Skeleton className="h-10 w-full rounded-md" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
