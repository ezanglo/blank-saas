"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";

import type { AuditLogRow } from "@/lib/audit/list";
import { AUDIT_ACTION_OPTIONS } from "@/lib/audit/action-options";
import { OrgDataTable } from "@/components/ui/org-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function formatTs(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AuditLogsView({
  orgId,
  listPath,
  data,
  totalPages,
  page,
}: {
  orgId: string;
  /** Base path for filters and pagination (e.g. `/organizations/[slug]/settings/audit-logs`). */
  listPath: string;
  data: AuditLogRow[];
  totalPages: number;
  page: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const columns = useMemo<ColumnDef<AuditLogRow>[]>(
    () => [
      {
        accessorKey: "actorEmail",
        header: "Actor",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.actorEmail ?? "—"}</span>
            {row.original.actorName ? (
              <span className="text-muted-foreground text-xs">{row.original.actorName}</span>
            ) : null}
          </div>
        ),
      },
      { accessorKey: "action", header: "Action" },
      {
        id: "resource",
        header: "Resource",
        cell: ({ row }) => {
          const t = row.original.resourceType;
          const id = row.original.resourceId;
          if (!t && !id) return "—";
          return (
            <span className="text-muted-foreground text-sm">
              {t ?? ""}
              {t && id ? " · " : ""}
              {id ?? ""}
            </span>
          );
        },
      },
      { accessorKey: "ipAddress", header: "IP" },
      {
        accessorKey: "createdAt",
        header: "When",
        cell: ({ row }) => formatTs(row.original.createdAt),
      },
    ],
    [],
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
    const action = String(formData.get("action") ?? "").trim();
    const actor = String(formData.get("actor") ?? "").trim();
    const from = String(formData.get("from") ?? "").trim();
    const to = String(formData.get("to") ?? "").trim();
    startTransition(() => {
      const qs = buildQuery({
        action: action || undefined,
        actor: actor || undefined,
        from: from || undefined,
        to: to || undefined,
        page: "1",
      });
      router.push(`${listPath}${qs ? `?${qs}` : ""}`);
    });
  }

  const exportHref = `/api/orgs/${orgId}/audit-logs/export?${searchParams.toString()}`;

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters(new FormData(e.currentTarget));
        }}
      >
        <div className="grid gap-1">
          <label className="text-muted-foreground text-xs" htmlFor="audit-action">
            Action
          </label>
          <select
            id="audit-action"
            name="action"
            defaultValue={searchParams.get("action") ?? ""}
            className={cn(
              "border-input bg-background h-9 w-[220px] rounded-md border px-3 text-sm shadow-xs outline-none",
            )}
          >
            <option value="">All actions</option>
            {AUDIT_ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-muted-foreground text-xs" htmlFor="audit-actor">
            Actor search
          </label>
          <Input
            id="audit-actor"
            name="actor"
            placeholder="Email or name"
            defaultValue={searchParams.get("actor") ?? ""}
            className="w-[200px]"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-muted-foreground text-xs" htmlFor="audit-from">
            From
          </label>
          <Input
            id="audit-from"
            name="from"
            type="date"
            defaultValue={searchParams.get("from") ?? ""}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-muted-foreground text-xs" htmlFor="audit-to">
            To
          </label>
          <Input id="audit-to" name="to" type="date" defaultValue={searchParams.get("to") ?? ""} />
        </div>
        <Button type="submit" disabled={pending}>
          Apply
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href={exportHref}>Export CSV</a>
        </Button>
      </form>

      <OrgDataTable columns={columns} data={data} emptyMessage="No audit entries yet." />

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          {page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`${listPath}?${buildQuery({ page: String(page - 1) })}`}
              >
                Previous
              </Link>
            </Button>
          ) : null}
          <span className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`${listPath}?${buildQuery({ page: String(page + 1) })}`}
              >
                Next
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
