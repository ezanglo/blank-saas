import { Skeleton } from "@/components/ui/skeleton";

export default function LegalLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <Skeleton className="mb-10 h-10 w-2/3 max-w-md" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
