"use client";

import { useEffect, useState, useTransition } from "react";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { getGlobalKPIs } from "../actions";
import { formatKPI, percentageChange, type KPI } from "../kpis";

const metrics = [
  ["users", "Total Users"],
  ["mrr", "Total MRR"],
  ["arr", "Total ARR"],
  ["subscriptions", "Active Subscriptions"],
  ["microsaas", "MicroSaaS Count"],
] as const;

export function KPICardGrid({
  initialResult,
}: {
  initialResult: Awaited<ReturnType<typeof getGlobalKPIs>>;
}) {
  const [data, setData] = useState<KPI[] | undefined>(initialResult.data);
  const [error, setError] = useState<string | undefined>(initialResult.error);
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      try {
        const result = await getGlobalKPIs();
        if (result.error) setError(result.error);
        else {
          setData(result.data);
          setError(undefined);
        }
      } catch {
        setError("Koneksi terputus. Silakan coba lagi.");
      }
    });
  }

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const result = await getGlobalKPIs();
        if (!mounted) return;
        if (result.error) setError(result.error);
        else {
          setData(result.data);
          setError(undefined);
        }
      } catch {
        if (mounted) setError("Koneksi terputus. Silakan coba lagi.");
      }
    }
    const timer = setInterval(() => void load(), 5 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <section aria-label="Ringkasan KPI" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Perbandingan dengan 30 hari lalu · Refresh otomatis setiap 5 menit
        </p>
        <Button variant="secondary" onClick={refresh} disabled={pending}>
          {pending ? "Memperbarui…" : "Refresh KPI"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error} {data && "Menampilkan data terakhir yang berhasil dimuat."}
        </p>
      )}
      <div className="grid grid-cols-1 gap-gutter min-[1280px]:grid-cols-3 min-[1600px]:grid-cols-5">
        {metrics.map(([metric, label]) => {
          const values = data?.filter((row) => row.metric === metric) ?? [];
          const row = values[0];
          const multiple = values.length > 1;
          const delta =
            row?.value != null && row.previous != null
              ? percentageChange(row.value, row.previous)
              : undefined;
          return (
            <StatCard
              key={metric}
              label={label}
              value={
                multiple
                  ? `${values.length} mata uang`
                  : row?.value != null
                    ? formatKPI(row.value, row.currency)
                    : "—"
              }
              delta={multiple ? undefined : delta}
              comparison="vs 30 hari lalu"
              loading={!data && !error}
            >
              {row?.value === null && (
                <p className="text-xs text-muted-foreground">
                  Tidak tersedia untuk role Anda.
                </p>
              )}
              {!multiple && row?.value != null && delta === undefined && (
                <p className="text-xs text-muted-foreground">
                  Baru · nilai 30 hari lalu adalah 0; persentase belum tersedia.
                </p>
              )}
              {multiple &&
                values.map((item) => {
                  const change = percentageChange(item.value!, item.previous!);
                  return (
                    <p key={item.currency} className="text-sm tabular-nums">
                      {formatKPI(item.value!, item.currency)}
                      <span className="block text-xs text-muted-foreground">
                        {change === undefined
                          ? "Baru"
                          : `${change > 0 ? "+" : ""}${change}%`}{" "}
                        vs 30 hari lalu
                      </span>
                    </p>
                  );
                })}
            </StatCard>
          );
        })}
      </div>
    </section>
  );
}
