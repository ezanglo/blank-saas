import { Skeleton } from "@/components/ui/skeleton";

/** Side nav + panel — matches Organization Settings layout. */
export function OrgSettingsRouteSkeleton() {
  return (
    <div className="w-full px-4 py-8 sm:px-0">
      <Skeleton className="mb-8 h-9 w-64 max-w-full" />
      <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:gap-12">
        <aside className="w-full lg:w-64 lg:shrink-0">
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))}
          </div>
        </aside>
        <div className="min-w-0 flex-1 space-y-4">
          <Skeleton className="h-10 w-full max-w-md rounded-md" />
          <Skeleton className="h-[220px] w-full rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}
