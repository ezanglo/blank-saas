"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CreateOrganizationDialog } from "@/components/org/create-org-dialog";
import { OrgLink } from "@/components/org/org-link";
import { useOrganizations } from "@/lib/query/hooks";

export default function OrganizationsIndexPage() {
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
          <p className="text-sm text-muted-foreground">Browse and manage your workspaces.</p>
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
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{org.name}</CardTitle>
                  <CardDescription>/{org.slug}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground">Open workspace</CardContent>
              </Card>
            </OrgLink>
          ))}
        </div>
      )}
    </section>
  );
}
