"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DataTable, type TableQuery } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUsers } from "../actions";
import {
  parseUserQuery,
  userQueryParams,
  type FilterOptions,
  type UserQuery,
  type UsersResult,
} from "../query";

export function UserTable({
  initialQuery,
  initialResult,
  options,
}: {
  initialQuery: UserQuery;
  initialResult: UsersResult;
  options: FilterOptions;
}) {
  const id = useId();
  const searchParams = useSearchParams();
  const query = parseUserQuery(Object.fromEntries(searchParams));
  const key = userQueryParams(query).toString();
  const initialKey = userQueryParams(initialQuery).toString();
  const previousSearch = useRef(query.search);
  const [retry, setRetry] = useState(0);
  const [filterError, setFilterError] = useState("");
  const [resolved, setResolved] = useState<{
    key: string;
    result: UsersResult;
  } | null>(null);
  const requestKey = `${key}:${retry}`;
  const useInitial = key === initialKey && retry === 0;
  const result = useInitial
    ? initialResult
    : (resolved?.result ?? initialResult);
  const loading = !useInitial && resolved?.key !== requestKey;

  useEffect(() => {
    const current = parseUserQuery(
      Object.fromEntries(new URLSearchParams(key)),
    );
    const delay = current.search === previousSearch.current ? 0 : 300;
    previousSearch.current = current.search;
    if (key === initialKey && retry === 0) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      getUsers(current, current)
        .then((result) => {
          if (!cancelled) setResolved({ key: requestKey, result });
        })
        .catch(() => {
          if (!cancelled)
            setResolved({
              key: requestKey,
              result: {
                error: "Daftar pengguna gagal dimuat. Silakan coba lagi.",
              },
            });
        });
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, initialKey, retry, requestKey]);

  function navigate(next: UserQuery, replace = false) {
    let url;
    try {
      const params = userQueryParams(next);
      parseUserQuery(Object.fromEntries(params));
      url = `/users?${params}`;
      setFilterError("");
    } catch {
      setFilterError(
        "Filter tidak valid. Periksa rentang tanggal dan panjang pencarian (maksimal 200 karakter).",
      );
      return;
    }
    // Native history keeps URL/back/forward in sync; the effect owns the scoped server read.
    window.history[replace ? "replaceState" : "pushState"](null, "", url);
  }
  function filter(patch: Partial<UserQuery>) {
    navigate({ ...query, ...patch, page: 1 });
  }
  function tableChange(next: TableQuery) {
    navigate(
      { ...query, ...next, sort: next.sort as UserQuery["sort"] },
      next.search !== query.search,
    );
  }
  const data = result.data;
  return (
    <div className="space-y-4">
      {filterError && (
        <p role="alert" className="text-sm text-kinetic-error">
          {filterError}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Cari nama, email, atau ID pengguna. Tanggal bergabung menggunakan WIB;
        plan mengikuti subscription berjalan terbaru.
      </p>
      {!loading && result.error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-md border border-kinetic-error/30 p-4"
        >
          <p>{result.error}</p>
          <Button
            variant="secondary"
            onClick={() => setRetry((value) => value + 1)}
          >
            Coba lagi
          </Button>
        </div>
      )}
      <DataTable
        caption="Pengguna"
        rows={!loading && !result.error ? (data?.rows ?? []) : []}
        rowCount={data?.total ?? 0}
        rowKey={(row) => row.id}
        query={{
          search: query.search,
          page: !loading && data ? data.page : query.page,
          pageSize: query.pageSize,
          sort: query.sort,
        }}
        onQueryChange={tableChange}
        loading={loading}
        columns={[
          {
            id: "avatar",
            header: "Avatar",
            cell: (row) => <Avatar name={row.name} url={row.avatar_url} />,
          },
          {
            id: "name",
            header: "Nama",
            sortable: true,
            cell: (row) => (
              <div className="min-w-32">
                <span className="font-medium">{row.name}</span>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {row.id}
                </p>
              </div>
            ),
          },
          {
            id: "email",
            header: "Email",
            sortable: true,
            cell: (row) => row.email,
          },
          {
            id: "microsaas_name",
            header: "MicroSaaS",
            sortable: true,
            cell: (row) => (
              <Link
                href={`/microsaas/${row.microsaas_slug}`}
                className="text-primary"
              >
                {row.microsaas_name}
              </Link>
            ),
          },
          {
            id: "plan_name",
            header: "Plan",
            sortable: true,
            cell: (row) => row.plan_name ?? "Tanpa plan",
          },
          {
            id: "status",
            header: "Status",
            sortable: true,
            cell: (row) => (
              <Badge
                variant={
                  row.status === "active"
                    ? "success"
                    : row.status === "banned"
                      ? "destructive"
                      : "secondary"
                }
              >
                {row.status === "active"
                  ? "Aktif"
                  : row.status === "banned"
                    ? "Banned"
                    : "Trial"}
              </Badge>
            ),
          },
          {
            id: "created_at",
            header: "Bergabung",
            sortable: true,
            cell: (row) =>
              new Intl.DateTimeFormat("id-ID", {
                dateStyle: "medium",
                timeZone: "Asia/Jakarta",
              }).format(new Date(row.created_at)),
          },
        ]}
        filters={
          <>
            <label htmlFor={`${id}-product`} className="space-y-2 text-sm">
              <span className="block">MicroSaaS</span>
              <select
                id={`${id}-product`}
                className="h-10 max-w-48 rounded-md border border-input bg-background px-3"
                value={query.microsaas}
                onChange={(e) =>
                  filter({ microsaas: e.target.value, plan: "" })
                }
              >
                <option value="">Semua produk</option>
                {options.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor={`${id}-plan`} className="space-y-2 text-sm">
              <span className="block">Plan</span>
              <select
                id={`${id}-plan`}
                className="h-10 max-w-48 rounded-md border border-input bg-background px-3"
                value={query.plan}
                onChange={(e) => filter({ plan: e.target.value })}
              >
                <option value="">Semua plan</option>
                {options.plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor={`${id}-status`} className="space-y-2 text-sm">
              <span className="block">Status</span>
              <select
                id={`${id}-status`}
                className="h-10 rounded-md border border-input bg-background px-3"
                value={query.status}
                onChange={(e) => filter({ status: e.target.value })}
              >
                <option value="">Semua status</option>
                <option value="active">Aktif</option>
                <option value="banned">Banned</option>
                <option value="trial">Trial</option>
              </select>
            </label>
            <label htmlFor={`${id}-from`} className="space-y-2 text-sm">
              <span className="block">Bergabung dari</span>
              <Input
                id={`${id}-from`}
                type="date"
                value={query.joinedFrom}
                max={query.joinedTo || undefined}
                onChange={(e) => filter({ joinedFrom: e.target.value })}
                className="w-40"
              />
            </label>
            <label htmlFor={`${id}-to`} className="space-y-2 text-sm">
              <span className="block">Bergabung sampai</span>
              <Input
                id={`${id}-to`}
                type="date"
                value={query.joinedTo}
                min={query.joinedFrom || undefined}
                onChange={(e) => filter({ joinedTo: e.target.value })}
                className="w-40"
              />
            </label>
            <Button
              variant="ghost"
              onClick={() => navigate(parseUserQuery({}))}
            >
              Reset filter
            </Button>
          </>
        }
      />
    </div>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  const [failed, setFailed] = useState(false);
  if (!failed && url && /^https?:\/\//i.test(url))
    return (
      <img
        src={url}
        alt={`Avatar ${name}`}
        width={36}
        height={36}
        className="h-9 w-9 rounded-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  return (
    <span
      aria-label={`Avatar ${name}`}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
    >
      {name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "?"}
    </span>
  );
}
