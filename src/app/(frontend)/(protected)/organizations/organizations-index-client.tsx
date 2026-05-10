"use client";

import { useSearchParams } from "next/navigation";

import { CreateOrganizationDialog } from "@/components/org/create-org-dialog";
import { OrgLink } from "@/components/org/org-link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganizations } from "@/lib/query/hooks";

function OrgHubAlerts() {
  const searchParams = useSearchParams();
  const err = searchParams.get("error");

  if (err === "forbidden") {
    return (
      <div
        role="alert"
        className="border-destructive/40 bg-destructive/10 mb-6 rounded-lg border px-4 py-3 text-sm"
      >
        <p className="text-destructive font-medium">Access denied</p>
        <p className="text-muted-foreground mt-1">
          You don&apos;t have permission to view that page.
        </p>
      </div>
    );
  }

  if (err === "feature_disabled") {
    return (
      <div role="alert" className="bg-muted/40 mb-6 rounded-lg border px-4 py-3 text-sm">
        <p className="font-medium">Feature unavailable</p>
        <p className="text-muted-foreground mt-1">
          That feature isn&apos;t enabled for this workspace.
        </p>
      </div>
    );
  }

  return null;
}

export function OrganizationsIndexClient() {
  const { data: orgs, isLoading } = useOrganizations();

  if (isLoading && !orgs) {
    return (
      <section className="flex flex-col gap-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-[180px] w-full rounded-lg" />
      </section>
    );
  }

  const list = orgs ?? [];

  return (
    <section className="flex flex-col gap-8">
      <OrgHubAlerts />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground text-sm">Browse and manage your workspaces.</p>
        </div>
        <CreateOrganizationDialog trigger={<Button size="sm">New organization</Button>} />
      </div>

      {list.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No organizations yet</CardTitle>
            <CardDescription>Use “New organization” to create one.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((org) => (
            <OrgLink key={org.id} org={org} href={`/organizations/${org.slug}`} className="block">
              <Card className="hover:bg-muted/40 h-full transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{org.name}</CardTitle>
                  <CardDescription>/{org.slug}</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground pt-0 text-sm">Open workspace</CardContent>
              </Card>
            </OrgLink>
          ))}
        </div>
      )}
    </section>
  );
}
