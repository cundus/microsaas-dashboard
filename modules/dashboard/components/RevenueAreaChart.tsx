"use client";

import { useEffect, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ChartViewport, ChartPlaceholder } from "./ChartViewport";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { getRevenueTimeSeries } from "../actions";
import {
  jakartaToday,
  presetRange,
  revenueChartData,
  validRevenueRange,
  type RevenuePoint,
  type RevenueRange,
} from "../revenue";

const RevenuePlot = dynamic(
  () => import("./RevenuePlot").then((module) => module.RevenuePlot),
  { loading: ChartPlaceholder },
);

const colors = [
  "#00F2FE",
  "#67F4B7",
  "#A5A5FF",
  "#FFBA76",
  "#F48BC4",
  "#82B7FF",
];
const dateLabel = (day: string, full = false) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: full ? "long" : "short",
    ...(full ? { year: "numeric" } : {}),
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${day}T00:00:00+07:00`));

export function RevenueAreaChart({
  initialResult,
  initialRange,
}: {
  initialResult: Awaited<ReturnType<typeof getRevenueTimeSeries>>;
  initialRange: RevenueRange;
}) {
  const id = useId().replace(/:/g, "");
  const [period, setPeriod] = useState("30");
  const [range, setRange] = useState<RevenueRange>(initialRange);
  const [custom, setCustom] = useState(range);
  const [validation, setValidation] = useState<string>();
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: RevenuePoint[];
    error?: string;
  }>({ key: `${initialRange.start}/${initialRange.end}`, ...initialResult });
  const lastRequest = useRef(`${initialRange.start}/${initialRange.end}/0`);
  const [selectedCurrency, setSelectedCurrency] = useState("IDR");
  const key = `${range.start}/${range.end}`;
  const data = result?.key === key ? result.data : undefined;
  const error = result?.key === key ? result.error : undefined;
  const currencies = [...new Set(data?.map((row) => row.currency))].sort();
  const currency = currencies.includes(selectedCurrency)
    ? selectedCurrency
    : (currencies[0] ?? "IDR");
  const chart = revenueChartData(data ?? [], currency);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await getRevenueTimeSeries({
          start: range.start,
          end: range.end,
        });
        if (!active) return;
        setResult((previous) =>
          response.error
            ? {
                key,
                data: previous?.key === key ? previous.data : undefined,
                error: response.error,
              }
            : { key, data: response.data },
        );
      } catch {
        if (active)
          setResult((previous) => ({
            key,
            data: previous?.key === key ? previous.data : undefined,
            error: "Koneksi terputus. Silakan coba lagi.",
          }));
      }
    }
    const request = `${key}/${revision}`;
    if (lastRequest.current !== request) {
      lastRequest.current = request;
      void load();
    }
    const timer = setInterval(() => void load(), 300000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [range.start, range.end, key, revision]);

  function selectPeriod(value: string) {
    setPeriod(value);
    setValidation(undefined);
    if (value !== "custom") setRange(presetRange(Number(value)));
    else setCustom(range);
  }

  return (
    <Card className="min-w-0" role="region" aria-label="Tren pendapatan">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle>Tren pendapatan</CardTitle>
            <CardDescription>
              MRR harian per MicroSaaS · Akhir hari WIB, hari ini sementara
            </CardDescription>
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Periode pendapatan"
          >
            {["7", "30", "90", "custom"].map((value) => (
              <Button
                key={value}
                variant={period === value ? "default" : "secondary"}
                aria-pressed={period === value}
                onClick={() => selectPeriod(value)}
              >
                {value === "custom" ? "Custom" : `${value} hari`}
              </Button>
            ))}
          </div>
        </div>
        {period === "custom" && (
          <form
            className="flex flex-wrap items-end gap-3 pt-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!validRevenueRange(custom)) {
                setValidation(
                  "Pilih rentang valid, maksimal 366 hari hingga hari ini.",
                );
                return;
              }
              setValidation(undefined);
              setRange({ ...custom });
            }}
          >
            <label className="space-y-1 text-sm">
              Dari tanggal
              <Input
                type="date"
                required
                max={jakartaToday()}
                value={custom.start}
                onChange={(event) =>
                  setCustom({ ...custom, start: event.target.value })
                }
              />
            </label>
            <label className="space-y-1 text-sm">
              Sampai tanggal
              <Input
                type="date"
                required
                min={custom.start}
                max={jakartaToday()}
                value={custom.end}
                onChange={(event) =>
                  setCustom({ ...custom, end: event.target.value })
                }
              />
            </label>
            <Button type="submit" variant="secondary">
              Terapkan
            </Button>
          </form>
        )}
        {validation && (
          <p role="alert" className="text-sm text-destructive">
            {validation}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            {dateLabel(range.start)} – {dateLabel(range.end, true)}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {currencies.length > 1 && (
              <label className="flex items-center gap-2">
                Mata uang
                <select
                  className="min-h-10 rounded-control border border-input bg-card px-3"
                  value={currency}
                  onChange={(event) => setSelectedCurrency(event.target.value)}
                >
                  {currencies.map((code) => (
                    <option key={code}>{code}</option>
                  ))}
                </select>
              </label>
            )}
            <Button
              variant="secondary"
              onClick={() => setRevision((value) => value + 1)}
            >
              Refresh grafik
            </Button>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error} {data && "Menampilkan data terakhir yang berhasil dimuat."}
          </p>
        )}
        {!data && !error ? (
          <div
            role="status"
            className="h-80 animate-pulse rounded-lg bg-muted/30 motion-reduce:animate-none"
          >
            <span className="sr-only">Memuat tren pendapatan…</span>
          </div>
        ) : !data ? (
          <p className="py-16 text-center text-muted-foreground">
            Grafik belum tersedia. Gunakan Refresh grafik untuk mencoba lagi.
          </p>
        ) : data.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            Belum ada MicroSaaS dalam akses Anda pada periode ini.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              MRR ({currency}) · Arahkan kursor atau gunakan tombol panah pada
              grafik untuk melihat nilai.
            </p>
            {data.every((row) => row.mrr === 0) && (
              <p className="text-sm text-muted-foreground">
                Belum ada MRR dari subscription aktif pada periode ini.
              </p>
            )}
            <ChartViewport label={`Grafik MRR dalam ${currency}`}>
              <RevenuePlot
                chart={chart}
                id={id}
                currency={currency}
                colors={colors}
                dateLabel={dateLabel}
              />
            </ChartViewport>
            <ul
              aria-label="Legenda MicroSaaS"
              className="flex flex-wrap gap-x-5 gap-y-2 text-sm"
            >
              {chart.products.map((product, index) => (
                <li
                  key={product.id}
                  className="flex min-w-0 items-center gap-2"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="break-all">{product.name}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
