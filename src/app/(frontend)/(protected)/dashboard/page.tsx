"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateOrganizationDialog } from "@/components/org/create-org-dialog";
import { OrgLink } from "@/components/org/org-link";
import { useOrganizations } from "@/lib/query/hooks";

export default function DashboardPage() {
  const { data: orgs, isLoading } = useOrganizations();

  if (isLoading && !orgs) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </section>
    );
  }

  const list = orgs ?? [];

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Your workspaces and quick access.
          </p>
        </div>
        <CreateOrganizationDialog />
      </div>

      {list.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Create your first organization</CardTitle>
            <CardDescription>
              Organizations group members, invitations, and settings. Use the button above to get started.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((org) => (
            <OrgLink key={org.id} org={org} href={`/organizations/${org.slug}`} className="block">
              <Card className="transition-colors hover:bg-muted/40">
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
