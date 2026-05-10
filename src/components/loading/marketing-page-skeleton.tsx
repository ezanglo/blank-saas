import { Skeleton } from "@/components/ui/skeleton";

/** Hero + stacked sections between marketing nav and footer. */
export function MarketingPageSkeleton() {
  return (
    <div className="flex flex-col">
      <section className="relative border-b px-6 py-16 md:py-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <Skeleton className="mx-auto h-4 w-48 md:ml-0" />
          <Skeleton className="mx-auto h-12 w-full max-w-xl md:mx-0 md:h-14 md:max-w-2xl" />
          <Skeleton className="mx-auto h-20 w-full max-w-lg md:mx-0" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-36 rounded-md" />
            <Skeleton className="h-10 w-40 rounded-md" />
          </div>
        </div>
      </section>
      {[1, 2, 3].map((block) => (
        <section key={block} className="border-b px-6 py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-start md:gap-12">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-3/4 max-w-sm" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-48 flex-1 rounded-xl md:min-h-[200px]" />
          </div>
        </section>
      ))}
    </div>
  );
}
