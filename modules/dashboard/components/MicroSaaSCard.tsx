"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Layers3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatKPI } from "../kpis";
import { getHealth, safeLogoUrl, type MicroSaaSSummary } from "../microsaas";

export function MicroSaaSCard({
  product,
  restricted = false,
  linked = true,
}: {
  product: MicroSaaSSummary;
  restricted?: boolean;
  linked?: boolean;
}) {
  const [failedLogo, setFailedLogo] = useState<string>();
  const logo = safeLogoUrl(product.logo_url);
  const health = getHealth(product.latest_uptime_percent, product.checked_at);
  const content = (
    <Card className="h-full transition-colors group-hover:bg-accent/40">
      <CardHeader className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
            {logo && failedLogo !== logo ? (
              // Product logos load directly, without proxying arbitrary URLs through the server.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                width={48}
                height={48}
                referrerPolicy="no-referrer"
                onError={() => setFailedLogo(logo)}
                className="size-full object-contain"
              />
            ) : (
              <Layers3 aria-hidden="true" className="size-6" />
            )}
          </div>
          <Badge
            variant={
              health === "Healthy"
                ? "success"
                : health === "Down"
                  ? "destructive"
                  : health === "Degraded"
                    ? "secondary"
                    : "outline"
            }
          >
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-current"
            />
            {restricted ? "Health dibatasi" : health}
          </Badge>
        </div>
        <div className="space-y-1">
          <h3 className="flex items-center justify-between gap-2 font-display text-lg font-semibold">
            <span className="min-w-0 break-words">{product.name}</span>
            {linked && (
              <ArrowUpRight
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
            )}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {product.description || "Ringkasan produk MicroSaaS."}
          </p>
          {product.status === "inactive" && (
            <Badge variant="outline">Produk nonaktif</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="mt-auto space-y-4">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Pengguna</dt>
            <dd className="mt-1 font-mono tabular-nums">
              {product.user_count === null
                ? "Dibatasi"
                : formatKPI(product.user_count, null)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Uptime · 30 hari</dt>
            <dd className="mt-1 font-mono tabular-nums">
              {restricted
                ? "Dibatasi"
                : product.uptime_percent === null
                  ? "Belum ada data"
                  : `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(product.uptime_percent)}%`}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground">MRR</dt>
            <dd className="mt-1 space-y-1 font-mono tabular-nums">
              {product.revenue.map(({ currency, mrr }) => (
                <div key={currency}>{formatKPI(mrr, currency)}</div>
              ))}
            </dd>
          </div>
        </dl>
        {!restricted && (
          <p className="text-xs text-muted-foreground">
            {health === "Unknown"
              ? "Health belum tersedia · sampel tidak ada atau lebih dari 15 menit."
              : "Health berdasarkan sampel terbaru."}
          </p>
        )}
      </CardContent>
    </Card>
  );
  return linked ? (
    <Link
      href={`/microsaas/${product.slug}`}
      aria-label={`Lihat detail ${product.name}`}
      className="group block min-w-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      {content}
    </Link>
  ) : (
    content
  );
}
