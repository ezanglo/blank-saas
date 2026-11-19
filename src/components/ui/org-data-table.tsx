"use client";

import {
  flexRender,
  metaHelper,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const orgTableFeatures = tableFeatures({
  columnMeta: metaHelper<{ className?: string }>(),
});

export type OrgColumnDef<TData extends RowData> = ColumnDef<typeof orgTableFeatures, TData>;

export function OrgDataTable<TData extends RowData>({
  columns,
  data,
  emptyMessage,
  isLoading,
}: {
  columns: OrgColumnDef<TData>[];
  data: TData[];
  emptyMessage: string;
  isLoading?: boolean;
}) {
  const table = useTable({
    features: orgTableFeatures,
    data,
    columns,
    getRowId: (row, index) => {
      if (typeof row === "object" && row !== null && "id" in row) {
        const id = (row as { id: unknown }).id;
        if (typeof id === "string") return id;
      }
      return String(index);
    },
  });

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(header.column.columnDef.meta?.className)}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                Loading…
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(cell.column.columnDef.meta?.className)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
