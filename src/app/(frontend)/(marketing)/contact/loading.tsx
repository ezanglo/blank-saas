import { Skeleton } from "@/components/ui/skeleton";

/** Narrow prose + form placeholders for /contact. */
export default function ContactLoading() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-10 px-6 py-12 md:py-16">
      <div className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
