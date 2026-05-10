import { Skeleton } from "@/components/ui/skeleton";

export default function ProtectedLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-[320px] w-full rounded-lg" />
    </div>
  );
}
