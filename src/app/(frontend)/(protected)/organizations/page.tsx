import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { OrganizationsIndexClient } from "./organizations-index-client";

function OrganizationsFallback() {
  return (
    <section className="flex flex-col gap-6">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-[180px] w-full rounded-lg" />
    </section>
  );
}

export default function OrganizationsPage() {
  return (
    <Suspense fallback={<OrganizationsFallback />}>
      <OrganizationsIndexClient />
    </Suspense>
  );
}
