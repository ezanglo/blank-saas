import { Skeleton } from "@/components/ui/skeleton";

export default function ChangelogLoading() {
  return (
    <main className="px-6 py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <Skeleton className="mb-3 h-10 w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
        <ol className="relative ml-1 mt-12 space-y-12 border-l border-border pl-8">
          {[1, 2, 3].map((i) => (
            <li key={i} className="relative space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-7 w-3/4 max-w-md" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
