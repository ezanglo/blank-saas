import { Skeleton } from "@/components/ui/skeleton";

/** Organization index — title + list/card region. */
export default function OrganizationsLoading() {
  return (
    <section className="flex flex-col gap-6">
      <Skeleton className="h-10 w-72 max-w-full" />
      <Skeleton className="h-[220px] w-full rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    </section>
  );
}
