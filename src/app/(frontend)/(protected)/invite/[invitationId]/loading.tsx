import { Skeleton } from "@/components/ui/skeleton";

/** Invite flow uses minimal chrome; content sits in max-w-6xl container. */
export default function InviteLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
      <Skeleton className="h-8 w-56 max-w-full" />
      <Skeleton className="h-[200px] w-full rounded-xl" />
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-28 rounded-md" />
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </div>
  );
}
