"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ChartViewport, ChartPlaceholder } from "./ChartViewport";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { getUserGrowthTimeSeries } from "../actions";
import { jakartaToday, presetRange, validRevenueRange } from "../revenue";
import type {
  UserGrowthInterval,
  UserGrowthPoint,
  UserGrowthRange,
} from "../user-growth";

const UserGrowthPlot = dynamic(
  () => import("./UserGrowthPlot").then((module) => module.UserGrowthPlot),
  { loading: ChartPlaceholder },
);

const dateLabel = (day: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${day}T00:00:00+07:00`));
const numberLabel = (value: number) =>
  new Intl.NumberFormat("id-ID").format(value);

type UserGrowthProps = {
  initialResult: Awaited<ReturnType<typeof getUserGrowthTimeSeries>>;
  initialRange: UserGrowthRange;
};

export function UserGrowthBarChart(props: UserGrowthProps) {
  const admin = useAuth();
  return admin && admin.role !== "finance_admin" ? (
    <UserGrowthChart {...props} />
  ) : null;
}

function UserGrowthChart({ initialResult, initialRange }: UserGrowthProps) {
  const [period, setPeriod] = useState("30");
  const [range, setRange] = useState<UserGrowthRange>(initialRange);
  const [custom, setCustom] =
    useState<Pick<UserGrowthRange, "start" | "end">>(initialRange);
  const [validation, setValidation] = useState<string>();
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: UserGrowthPoint[];
    error?: string;
  }>({
    key: `${initialRange.start}/${initialRange.end}/${initialRange.interval}`,
    ...initialResult,
  });
  const lastRequest = useRef(
    `${initialRange.start}/${initialRange.end}/${initialRange.interval}/0`,
  );
  const key = `${range.start}/${range.end}/${range.interval}`;
  const data = result?.key === key ? result.data : undefined;
  const error = result?.key === key ? result.error : undefined;
  const total = data?.reduce((sum, row) => sum + row.new_users, 0) ?? 0;

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await getUserGrowthTimeSeries({
          start: range.start,
          end: range.end,
          interval: range.interval,
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
  }, [range.start, range.end, range.interval, key, revision]);

  return (
    <Card className="min-w-0" role="region" aria-label="Pertumbuhan pengguna">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle>Pertumbuhan pengguna</CardTitle>
            <CardDescription>
              Pengguna baru berdasarkan tanggal pendaftaran WIB · Hari ini
              sementara
            </CardDescription>
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Periode pertumbuhan pengguna"
          >
            {["7", "30", "90", "custom"].map((value) => (
              <Button
                key={value}
                variant={period === value ? "default" : "secondary"}
                aria-pressed={period === value}
                onClick={() => {
                  setPeriod(value);
                  setValidation(undefined);
                  if (value === "custom")
                    setCustom({ start: range.start, end: range.end });
                  else
                    setRange({
                      ...presetRange(Number(value)),
                      interval: range.interval,
                    });
                }}
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
              setRange({ ...custom, interval: range.interval });
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
            {dateLabel(range.start)} – {dateLabel(range.end)}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              Agregasi pengguna
              <select
                className="min-h-10 rounded-control border border-input bg-card px-3"
                value={range.interval}
                onChange={(event) =>
                  setRange({
                    ...range,
                    interval: event.target.value as UserGrowthInterval,
                  })
                }
              >
                <option value="day">Harian</option>
                <option value="week">Mingguan</option>
                <option value="month">Bulanan</option>
              </select>
            </label>
            <Button
              variant="secondary"
              onClick={() => setRevision((value) => value + 1)}
            >
              Refresh pertumbuhan
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
            <span className="sr-only">Memuat pertumbuhan pengguna…</span>
          </div>
        ) : !data ? (
          <p className="py-16 text-center text-muted-foreground">
            Grafik belum tersedia. Gunakan Refresh pertumbuhan untuk mencoba
            lagi.
          </p>
        ) : (
          <>
            <p className="text-sm" aria-live="polite">
              <strong className="font-mono">{numberLabel(total)}</strong>{" "}
              pengguna baru pada periode ini.
            </p>
            {total === 0 && (
              <p className="text-sm text-muted-foreground">
                Belum ada pengguna baru dalam akses Anda pada periode ini.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Minggu dimulai Senin; bulan mengikuti kalender. Periode tepi hanya
              menghitung tanggal yang dipilih. Arahkan kursor atau gunakan
              tombol panah pada grafik untuk melihat nilai.
            </p>
            <ChartViewport label="Grafik jumlah pengguna baru">
              <UserGrowthPlot
                data={data}
                dateLabel={dateLabel}
                numberLabel={numberLabel}
              />
            </ChartViewport>
          </>
        )}
      </CardContent>
    </Card>
  );
}
