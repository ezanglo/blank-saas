import { Skeleton } from "@/components/ui/skeleton";

/** Centered card region for guest auth routes (sign-in / sign-up, etc.). */
export function AuthGuestRouteSkeleton() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto h-4 w-full max-w-xs" />
        </div>
        <div className="h-[28rem] w-full animate-pulse rounded-xl border bg-card/40" aria-hidden />
      </div>
    </div>
  );
}
