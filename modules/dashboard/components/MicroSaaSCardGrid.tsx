"use client";

import { useEffect, useState, useTransition } from "react";
import { Layers3 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMicroSaaSList } from "../actions";
import type { MicroSaaSSummary } from "../microsaas";
import { MicroSaaSCard } from "./MicroSaaSCard";

export function MicroSaaSCardGrid({
  initialResult,
}: {
  initialResult: Awaited<ReturnType<typeof getMicroSaaSList>>;
}) {
  const admin = useAuth();
  const [data, setData] = useState<MicroSaaSSummary[] | undefined>(
    initialResult.data,
  );
  const [error, setError] = useState<string | undefined>(initialResult.error);
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      try {
        const result = await getMicroSaaSList();
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
        const result = await getMicroSaaSList();
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
    <section aria-labelledby="microsaas-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="microsaas-heading"
            className="font-display text-xl font-semibold"
          >
            Status MicroSaaS
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Kondisi produk dalam akses Anda.
          </p>
        </div>
        <Button variant="secondary" onClick={refresh} disabled={pending}>
          {pending ? "Memperbarui…" : "Refresh MicroSaaS"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error} {data && "Menampilkan data terakhir yang berhasil dimuat."}
        </p>
      )}
      {!data && !error && (
        <div
          role="status"
          aria-label="Memuat MicroSaaS"
          className="grid grid-cols-1 gap-gutter min-[768px]:grid-cols-2 min-[1600px]:grid-cols-3"
        >
          {[0, 1, 2].map((key) => (
            <Card
              key={key}
              aria-hidden="true"
              className="h-72 animate-pulse bg-muted/40"
            />
          ))}
        </div>
      )}
      {data?.length === 0 && (
        <Card>
          <CardHeader>
            <Layers3
              aria-hidden="true"
              className="size-8 text-muted-foreground"
            />
            <CardTitle>Belum ada MicroSaaS</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Produk yang terdaftar dan dapat Anda akses akan tampil di sini.
          </CardContent>
        </Card>
      )}
      {data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-gutter min-[768px]:grid-cols-2 min-[1600px]:grid-cols-3">
          {data.map((product) => (
            <MicroSaaSCard
              key={product.id}
              product={product}
              restricted={admin?.role === "finance_admin"}
            />
          ))}
        </div>
      )}
    </section>
  );
}
