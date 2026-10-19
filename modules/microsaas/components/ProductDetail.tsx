import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MicroSaaSForm } from "./MicroSaaSForm";
import { ConfigurationForm, ProductConfirmation } from "./ProductControls";

const tabs = [
  "overview",
  "users",
  "subscriptions",
  "revenue",
  "performance",
] as const;
const labels = {
  overview: "Overview",
  users: "Users",
  subscriptions: "Subscriptions",
  revenue: "Revenue",
  performance: "Performance",
};
const money = (value: number, currency: string) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency }).format(value);
const date = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
    : "—";

export async function ProductDetail({
  slug,
  tab = "overview",
  page = "1",
  size = "25",
}: {
  slug: string;
  tab?: string;
  page?: string;
  size?: string;
}) {
  await connection();
  const admin = await requireAdmin();
  if (!tabs.includes(tab as (typeof tabs)[number])) notFound();
  if (admin.role === "finance_admin" && ["users", "performance"].includes(tab))
    redirect("/403");
  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("microsaas")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error)
    return (
      <p role="alert">Produk gagal dimuat. Muat ulang untuk mencoba lagi.</p>
    );
  if (!product) notFound();
  const { data: summary, error: summaryError } = await supabase.rpc(
    "get_microsaas_list",
    { p_slug: slug },
  );
  if (summaryError)
    return (
      <p role="alert">
        Ringkasan produk gagal dimuat. Muat ulang untuk mencoba lagi.
      </p>
    );
  const first = summary?.[0];
  const owner = admin.role === "super_admin";
  const operational = admin.role !== "finance_admin";
  const currentPage = /^\d{1,6}$/.test(page) ? Math.max(1, Number(page)) : 1;
  const pageSize = [25, 50, 100].includes(Number(size)) ? Number(size) : 25;
  const offset = (currentPage - 1) * pageSize;
  const base = `/microsaas/${product.slug}`;
  let content;
  if (tab === "overview") {
    const { data: activity, error: activityError } = await supabase
      .from("dashboard_activity")
      .select("id,description,occurred_at")
      .eq("microsaas_id", product.id)
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(10);
    const { data: config, error: configError } = owner
      ? await supabase
          .from("microsaas_config")
          .select("*")
          .eq("microsaas_id", product.id)
          .maybeSingle()
      : { data: null, error: null };
    content = (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {activityError ? (
              <p role="alert">Aktivitas gagal dimuat.</p>
            ) : !activity?.length ? (
              <p className="text-muted-foreground">Belum ada aktivitas.</p>
            ) : (
              <ul className="divide-y divide-border/40">
                {activity.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 py-3">
                    <span>{item.description}</span>
                    <time className="shrink-0 text-sm text-muted-foreground">
                      {date(item.occurred_at)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        {owner && (
          <Card>
            <CardHeader>
              <CardTitle>Konfigurasi produk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {configError ? (
                <p role="alert">
                  Konfigurasi gagal dimuat. Muat ulang halaman untuk mencoba
                  lagi.
                </p>
              ) : (
                <>
                  <ConfigurationForm id={product.id} config={config} />
                  <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                    <span>
                      Maintenance:{" "}
                      <strong>
                        {config?.maintenance_mode ? "Aktif" : "Nonaktif"}
                      </strong>
                    </span>
                    <ProductConfirmation
                      id={product.id}
                      name={product.name}
                      maintenance={config?.maintenance_mode ?? false}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  } else if (tab === "users") {
    const { data, count, error } = await supabase
      .from("users")
      .select("id,name,email,status,created_at", { count: "exact" })
      .eq("microsaas_id", product.id)
      .neq("status", "deleted")
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + pageSize - 1);
    content = (
      <ProductTable
        title="Pengguna"
        headers={["Nama", "Email", "Status", "Bergabung (WIB)"]}
        rows={(data ?? []).map((r) => [
          r.name,
          r.email,
          r.status,
          date(r.created_at),
        ])}
        error={Boolean(error)}
        total={count ?? 0}
        page={currentPage}
        size={pageSize}
        href={`${base}/users`}
      />
    );
  } else if (tab === "subscriptions") {
    const { data, count, error } = await supabase
      .from("subscriptions")
      .select(
        "id,status,price,currency,billing_interval,current_period_end,plan_microsaas(plans(name))",
        { count: "exact" },
      )
      .eq("microsaas_id", product.id)
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + pageSize - 1);
    content = (
      <ProductTable
        title="Subscription"
        headers={["Plan", "Status", "Harga", "Siklus", "Akhir periode (WIB)"]}
        rows={(data ?? []).map((r) => [
          r.plan_microsaas?.plans?.name ?? "—",
          r.status,
          money(r.price, r.currency),
          r.billing_interval,
          date(r.current_period_end),
        ])}
        error={Boolean(error)}
        total={count ?? 0}
        page={currentPage}
        size={pageSize}
        href={`${base}/subscriptions`}
      />
    );
  } else if (tab === "revenue") {
    const { data, count, error } = await supabase
      .from("transactions")
      .select("id,amount,currency,status,payment_method,paid_at,created_at", {
        count: "exact",
      })
      .eq("microsaas_id", product.id)
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + pageSize - 1);
    content = (
      <ProductTable
        title="Transaksi"
        headers={["ID", "Nominal", "Status", "Metode", "Tanggal (WIB)"]}
        rows={(data ?? []).map((r) => [
          r.id,
          money(r.amount, r.currency),
          r.status,
          r.payment_method ?? "—",
          date(r.paid_at ?? r.created_at),
        ])}
        error={Boolean(error)}
        total={count ?? 0}
        page={currentPage}
        size={pageSize}
        href={`${base}/revenue`}
      />
    );
  } else {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 86400000);
    const { data, count, error } = await supabase
      .from("performance_metrics")
      .select("id,endpoint,uptime_percent,recorded_at", { count: "exact" })
      .eq("microsaas_id", product.id)
      .gte("recorded_at", start.toISOString())
      .lte("recorded_at", end.toISOString())
      .order("recorded_at", { ascending: false })
      .order("id")
      .range(offset, offset + pageSize - 1);
    content = (
      <ProductTable
        title="Sampel uptime 30 hari"
        headers={["Endpoint", "Uptime", "Waktu (WIB)"]}
        rows={(data ?? []).map((r) => [
          r.endpoint,
          `${r.uptime_percent}%`,
          date(r.recorded_at),
        ])}
        error={Boolean(error)}
        total={count ?? 0}
        page={currentPage}
        size={pageSize}
        href={`${base}/performance`}
      />
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link href="/microsaas" className="text-sm text-primary">
            ← Semua MicroSaaS
          </Link>
          <h1 className="font-display text-headline-lg font-bold">
            {product.name}
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            {product.description}
          </p>
          <div className="flex items-center gap-3">
            <Badge>{product.status === "active" ? "Aktif" : "Nonaktif"}</Badge>
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary"
            >
              Buka produk ↗
            </a>
          </div>
        </div>
        {owner && (
          <div className="flex gap-2">
            <MicroSaaSForm product={product} />
            <ProductConfirmation id={product.id} name={product.name} />
          </div>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {operational && (
          <Metric
            title="Total pengguna"
            value={String(first?.user_count ?? 0)}
          />
        )}
        <Metric
          title="MRR / ARR"
          value={(summary ?? [])
            .map(
              (r) =>
                `${money(r.mrr, r.currency)} / ${money(r.mrr * 12, r.currency)}`,
            )
            .join(" · ")}
        />
        {operational && (
          <Metric
            title="Uptime 30 hari (endpoint /)"
            value={
              first?.uptime_percent == null
                ? "Belum ada data"
                : `${Number(first.uptime_percent).toFixed(2)}%`
            }
          />
        )}
      </div>
      <nav
        aria-label="Tab MicroSaaS"
        className="flex flex-wrap gap-2 border-b border-border pb-3"
      >
        {tabs
          .filter((t) => operational || !["users", "performance"].includes(t))
          .map((t) => (
            <Button key={t} asChild variant={tab === t ? "default" : "ghost"}>
              <Link
                href={t === "overview" ? base : `${base}/${t}`}
                aria-current={tab === t ? "page" : undefined}
              >
                {labels[t]}
              </Link>
            </Button>
          ))}
      </nav>
      {content}
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="font-mono text-xl">{value || "—"}</CardContent>
    </Card>
  );
}

function ProductTable({
  title,
  headers,
  rows,
  error,
  total,
  page,
  size,
  href,
}: {
  title: string;
  headers: string[];
  rows: string[][];
  error: boolean;
  total: number;
  page: number;
  size: number;
  href: string;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p role="alert">
            Data gagal dimuat. Muat ulang halaman untuk mencoba lagi.
          </p>
        ) : (
          <>
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
                  {rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className="border-b border-border/30 px-3 py-3"
                        >
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
                        {total
                          ? "Halaman di luar jangkauan. Kembali ke halaman pertama."
                          : "Belum ada data untuk produk ini."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
              <span>
                {total} data · Halaman {page} dari {pages}
              </span>
              <div className="flex items-center gap-2">
                <span>Per halaman:</span>
                {[25, 50, 100].map((n) => (
                  <Link
                    key={n}
                    href={`${href}?page=1&size=${n}`}
                    aria-current={size === n ? "page" : undefined}
                    className={
                      size === n
                        ? "text-primary underline"
                        : "text-muted-foreground"
                    }
                  >
                    {n}
                  </Link>
                ))}
              </div>
              <div className="flex gap-3">
                {page > 1 && (
                  <Link
                    href={`${href}?page=${Math.min(page - 1, pages)}&size=${size}`}
                    className="text-primary"
                  >
                    Sebelumnya
                  </Link>
                )}
                {page < pages && (
                  <Link
                    href={`${href}?page=${page + 1}&size=${size}`}
                    className="text-primary"
                  >
                    Berikutnya
                  </Link>
                )}
                {page > pages && (
                  <Link href={`${href}?size=${size}`} className="text-primary">
                    Halaman pertama
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
