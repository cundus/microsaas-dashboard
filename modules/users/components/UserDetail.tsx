import Link from "next/link";
import type { ReactNode } from "react";
import type { getUserById } from "../detail-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "./Avatar";
import { UserActionsMenu } from "./UserActionsMenu";

type Detail = NonNullable<Awaited<ReturnType<typeof getUserById>>["data"]>;
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }).format(new Date(value))
    : "Belum tercatat";
const money = (value: number, currency: string) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency }).format(value);

export function UserDetail({ data }: { data: Detail }) {
  const { user, subscriptions, transactions, logins, query } = data;
  function pagination(
    key: "transactionsPage" | "loginsPage" | "subscriptionsPage",
    total: number,
  ) {
    const page = query[key];
    const pages = Math.max(1, Math.ceil(total / query.size));
    const href = (patch: Partial<typeof query>) =>
      `/users/${user.id}?${new URLSearchParams(Object.entries({ ...query, ...patch }).map(([k, v]) => [k, String(v)]))}`;
    return (
      <nav
        aria-label={
          key === "transactionsPage"
            ? "Halaman transaksi"
            : key === "loginsPage"
              ? "Halaman login"
              : "Halaman subscription"
        }
        className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm"
      >
        <span>
          {total} data · Halaman {page} dari {pages}
        </span>
        <div className="flex gap-3">
          <span>Per halaman:</span>
          {[25, 50, 100].map((size) => (
            <Link
              key={size}
              href={href({
                size,
                transactionsPage: 1,
                loginsPage: 1,
                subscriptionsPage: 1,
              })}
              aria-current={size === query.size ? "page" : undefined}
              className="text-primary"
            >
              {size}
            </Link>
          ))}
        </div>
        <div className="flex gap-4">
          {page > 1 && (
            <Link href={href({ [key]: page - 1 })} className="text-primary">
              Sebelumnya
            </Link>
          )}
          {page < pages && (
            <Link href={href({ [key]: page + 1 })} className="text-primary">
              Berikutnya
            </Link>
          )}
        </div>
      </nav>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar name={user.name} url={user.avatar_url} />
        <div>
          <h1 className="font-display text-headline-lg font-bold">
            {user.name}
          </h1>
          <p className="text-muted-foreground">Detail pengguna</p>
        </div>
        <Badge
          variant={
            user.status === "banned"
              ? "destructive"
              : user.status === "active"
                ? "success"
                : "secondary"
          }
        >
          {user.status === "active"
            ? "Aktif"
            : user.status === "banned"
              ? "Banned"
              : "Trial"}
        </Badge>
      </div>
      <UserActionsMenu user={user} />
      {user.status === "banned" && user.ban_reason && (
        <p className="rounded-lg border border-border bg-muted p-4 text-sm">
          <span className="font-semibold">Alasan ban:</span> {user.ban_reason}
        </p>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Profil pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-6 lg:grid-cols-2">
            {[
              ["Email", user.email],
              ["ID pengguna", user.id],
              ["ID di produk", user.external_id],
              ["Bergabung (WIB)", date(user.created_at)],
              ["Login terakhir (WIB)", date(user.last_login_at)],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="mt-1 break-words">{value}</dd>
              </div>
            ))}
            <div>
              <dt className="text-sm text-muted-foreground">MicroSaaS</dt>
              <dd className="mt-1">
                {user.microsaas ? (
                  <Link
                    href={`/microsaas/${user.microsaas.slug}`}
                    className="text-primary"
                  >
                    {user.microsaas.name}
                  </Link>
                ) : (
                  "Produk tidak tersedia"
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <DetailTable
        title="Subscription berjalan"
        headers={[
          "Plan",
          "Status",
          "Harga / siklus",
          "Periode (WIB)",
          "Akhir trial (WIB)",
        ]}
        empty="Tidak ada subscription berjalan."
        rows={subscriptions.map((s) => ({
          id: s.id,
          cells: [
            s.plan_microsaas?.plans?.name ?? "Plan tidak tersedia",
            <Badge key="status">{s.status}</Badge>,
            `${money(s.price, s.currency)} / ${s.billing_interval === "yearly" ? "tahun" : "bulan"}`,
            `${date(s.current_period_start)} – ${date(s.current_period_end)}`,
            s.trial_ends_at ? date(s.trial_ends_at) : "—",
          ],
        }))}
      >
        <p className="mt-4 text-sm text-muted-foreground">
          Mencakup active, trial, past_due, dan complimentary. Canceled dan
          expired tidak termasuk.
        </p>
        {pagination("subscriptionsPage", data.subscriptionTotal)}
      </DetailTable>
      <DetailTable
        title="Riwayat transaksi"
        headers={[
          "ID transaksi",
          "Nominal",
          "Status",
          "Metode pembayaran",
          "Dibuat (WIB)",
          "Dibayar (WIB)",
        ]}
        empty="Belum ada transaksi."
        rows={transactions.map((t) => ({
          id: t.id,
          cells: [
            t.id,
            money(t.amount, t.currency),
            <Badge key="status">{t.status}</Badge>,
            t.payment_method ?? "—",
            date(t.created_at),
            t.paid_at ? date(t.paid_at) : "—",
          ],
        }))}
      >
        {pagination("transactionsPage", data.transactionTotal)}
      </DetailTable>
      <DetailTable
        title="Aktivitas login"
        headers={["Aktivitas", "Waktu (WIB)"]}
        empty="Belum ada login yang tercatat."
        rows={logins.map((l) => ({
          id: String(l.id),
          cells: ["Login tercatat", date(l.occurred_at)],
        }))}
      >
        <p className="mt-4 text-sm text-muted-foreground">
          Riwayat tersedia sejak pencatatan diaktifkan. Data sebelumnya hanya
          mencakup login terakhir yang tercatat.
        </p>
        {pagination("loginsPage", data.loginTotal)}
      </DetailTable>
    </div>
  );
}

function DetailTable({
  title,
  headers,
  rows,
  empty,
  children,
}: {
  title: string;
  headers: string[];
  rows: { id: string; cells: ReactNode[] }[];
  empty: string;
  children?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="border-b border-border px-3 py-3 text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {row.cells.map((cell, i) => (
                    <td key={i} className="border-b border-border/30 px-3 py-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="p-6 text-center text-muted-foreground"
                  >
                    {empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
