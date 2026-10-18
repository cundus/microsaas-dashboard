"use client";

import { useId, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TableQuery = {
  search: string;
  page: number;
  pageSize: 25 | 50 | 100;
  sort: { id: string; direction: "asc" | "desc" } | null;
};

export type DataTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
};

type DataTableProps<T> = {
  caption: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  rowCount: number;
  rowKey: (row: T) => string;
  query: TableQuery;
  onQueryChange: (query: TableQuery) => void;
  filters?: ReactNode;
  loading?: boolean;
};

// Rows and the filtered total come from the caller; feature modules own server queries.
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowCount,
  rowKey,
  query,
  onQueryChange,
  filters,
  loading = false,
}: DataTableProps<T>) {
  const id = useId();
  const pageCount = Math.max(1, Math.ceil(rowCount / query.pageSize));
  const page = Math.min(Math.max(1, query.page), pageCount);

  return (
    <div className="glass-panel min-w-0 rounded-lg" aria-busy={loading}>
      <div className="flex flex-wrap items-end gap-3 p-5">
        <div className="w-full max-w-sm space-y-2">
          <label htmlFor={`${id}-search`} className="text-sm font-medium">
            Cari {caption.toLowerCase()}
          </label>
          <Input
            id={`${id}-search`}
            type="search"
            placeholder="Cari…"
            value={query.search}
            onChange={(event) =>
              onQueryChange({ ...query, search: event.target.value, page: 1 })
            }
          />
        </div>
        {filters}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-y border-white/8 bg-muted/40 text-muted-foreground">
            <tr>
              {columns.map((column) => {
                const sorted = query.sort?.id === column.id;
                const Icon = sorted
                  ? query.sort?.direction === "asc"
                    ? ArrowUp
                    : ArrowDown
                  : ArrowUpDown;
                return (
                  <th
                    key={column.id}
                    scope="col"
                    className="px-5 py-2 font-medium"
                    aria-sort={
                      column.sortable
                        ? sorted
                          ? query.sort?.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                        : undefined
                    }
                  >
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        className="-ml-3"
                        onClick={() =>
                          onQueryChange({
                            ...query,
                            page: 1,
                            sort: {
                              id: column.id,
                              direction:
                                sorted && query.sort?.direction === "asc"
                                  ? "desc"
                                  : "asc",
                            },
                          })
                        }
                      >
                        {column.header}
                        <Icon aria-hidden="true" />
                      </Button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-8 text-center text-muted-foreground"
                  role="status"
                >
                  Memuat data…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-8 text-center text-muted-foreground"
                >
                  Tidak ada data yang cocok.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b border-white/8 last:border-0 hover:bg-muted/30"
                >
                  {columns.map((column) => (
                    <td key={column.id} className="px-5 py-4">
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/8 p-5">
        <p
          className="text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {rowCount} hasil · Halaman {page} dari {pageCount}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor={`${id}-size`}
            className="text-xs text-muted-foreground"
          >
            Baris per halaman
          </label>
          <Select
            value={String(query.pageSize)}
            onValueChange={(value) =>
              onQueryChange({
                ...query,
                pageSize: Number(value) as TableQuery["pageSize"],
                page: 1,
              })
            }
          >
            <SelectTrigger id={`${id}-size`} className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[25, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="secondary"
            disabled={loading || page <= 1}
            onClick={() => onQueryChange({ ...query, page: page - 1 })}
          >
            Sebelumnya
          </Button>
          <Button
            variant="secondary"
            disabled={loading || page >= pageCount}
            onClick={() => onQueryChange({ ...query, page: page + 1 })}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}
