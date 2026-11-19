"use client";

import type { OrgColumnDef } from "@/components/ui/org-data-table";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";

import { OrgDataTable } from "@/components/ui/org-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { revokePermissionAction } from "@/lib/actions/permissions";
import type { OrgPermissionRow } from "@/lib/permissions/list";

import { GrantPermissionDialog } from "./grant-permission-dialog";

function formatTs(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function OrgPermissionsView({
  orgId,
  orgSlug,
  listPath,
  data,
  totalPages,
  page,
  canMutate,
}: {
  orgId: string;
  orgSlug: string;
  listPath: string;
  data: OrgPermissionRow[];
  totalPages: number;
  page: number;
  canMutate: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const columns = useMemo<OrgColumnDef<OrgPermissionRow>[]>(
    () => [
      {
        id: "subject",
        header: "Subject",
        cell: ({ row }) => (
          <div className="flex flex-col text-sm">
            <span className="font-medium">{row.original.subjectType}</span>
            <span className="text-muted-foreground text-xs">{row.original.subjectId}</span>
          </div>
        ),
      },
      { accessorKey: "resourceType", header: "Resource type" },
      { accessorKey: "resourceId", header: "Resource id" },
      {
        id: "grantedActions",
        header: "Granted",
        cell: ({ row }) => row.original.actions.join(", ") || "—",
      },
      {
        accessorKey: "grantedBy",
        header: "Granted by",
        cell: ({ row }) => row.original.grantedBy ?? "—",
      },
      {
        accessorKey: "expiresAt",
        header: "Expires",
        cell: ({ row }) => formatTs(row.original.expiresAt),
      },
      ...(canMutate
        ? [
            {
              id: "revoke",
              header: "",
              cell: ({ row }: { row: { original: OrgPermissionRow } }) => (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  className="text-destructive"
                  onClick={() => {
                    startTransition(async () => {
                      try {
                        await revokePermissionAction({
                          organizationId: orgId,
                          orgSlug,
                          permissionId: row.original.id,
                        });
                        toast.success("Permission revoked");
                        router.refresh();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Revoke failed");
                      }
                    });
                  }}
                >
                  Revoke
                </Button>
              ),
            } satisfies OrgColumnDef<OrgPermissionRow>,
          ]
        : []),
    ],
    [canMutate, orgId, orgSlug, pending, router],
  );

  function buildQuery(next: Record<string, string | undefined>) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === "") p.delete(k);
      else p.set(k, v);
    }
    return p.toString();
  }

  function applyFilters(formData: FormData) {
    const resourceType = String(formData.get("resourceType") ?? "").trim();
    const resourceId = String(formData.get("resourceId") ?? "").trim();
    const subjectId = String(formData.get("subjectId") ?? "").trim();
    startTransition(() => {
      const qs = buildQuery({
        resourceType: resourceType || undefined,
        resourceId: resourceId || undefined,
        subjectId: subjectId || undefined,
        page: "1",
      });
      router.push(qs ? `${listPath}?${qs}` : listPath);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <form
          action={applyFilters}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Resource type</span>
            <Input
              name="resourceType"
              placeholder="project"
              defaultValue={searchParams.get("resourceType") ?? ""}
              className="h-9 w-36"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Resource id</span>
            <Input
              name="resourceId"
              placeholder="id"
              defaultValue={searchParams.get("resourceId") ?? ""}
              className="h-9 w-40"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Subject contains</span>
            <Input
              name="subjectId"
              placeholder="user id"
              defaultValue={searchParams.get("subjectId") ?? ""}
              className="h-9 w-40"
            />
          </label>
          <Button type="submit" size="sm" variant="secondary" disabled={pending}>
            Filter
          </Button>
        </form>
        {canMutate ? (
          <GrantPermissionDialog
            organizationId={orgId}
            orgSlug={orgSlug}
            onDone={async () => {
              router.refresh();
            }}
          />
        ) : null}
      </div>

      <OrgDataTable columns={columns} data={data} emptyMessage="No permission rows yet." />

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <Link
                  href={`${listPath}?${buildQuery({ page: String(page - 1) })}`}
                  scroll={false}
                >
                  Previous
                </Link>
              </Button>
            ) : null}
            {page < totalPages ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <Link
                  href={`${listPath}?${buildQuery({ page: String(page + 1) })}`}
                  scroll={false}
                >
                  Next
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
