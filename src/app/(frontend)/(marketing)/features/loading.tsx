import { Skeleton } from "@/components/ui/skeleton";

export default function FeaturesLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-16 text-center">
        <Skeleton className="mx-auto mb-3 h-10 w-64" />
        <Skeleton className="mx-auto h-4 w-full max-w-xl" />
      </div>
      {[1, 2, 3, 4].map((row) => (
        <div
          key={row}
          className="mb-16 grid gap-10 md:grid-cols-2 md:items-center"
        >
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4 max-w-sm" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
          </div>
          <Skeleton className="h-56 rounded-xl md:h-64" />
        </div>
      ))}
    </div>
  );
}
