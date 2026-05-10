import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationSlugLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[200px] w-full rounded-lg" />
    </div>
  );
}
