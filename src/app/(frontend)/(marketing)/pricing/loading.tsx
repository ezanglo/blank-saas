import { Skeleton } from "@/components/ui/skeleton";

export default function PricingLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-12 text-center">
        <Skeleton className="mx-auto mb-3 h-10 w-48" />
        <Skeleton className="mx-auto h-4 w-full max-w-lg" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[400px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-16 h-56 w-full rounded-xl" />
    </div>
  );
}
