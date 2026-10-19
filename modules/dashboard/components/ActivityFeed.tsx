"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  CircleAlert,
  LogOut,
  Settings,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { getRecentActivity } from "../actions";
import { activityLink, type Activity } from "../activity";

const kinds = {
  signup: { label: "Signup", icon: UserPlus, color: "text-primary" },
  upgrade: { label: "Upgrade", icon: ArrowUpRight, color: "text-success" },
  churn: { label: "Churn", icon: LogOut, color: "text-kinetic-secondary" },
  error_spike: {
    label: "Error spike",
    icon: CircleAlert,
    color: "text-kinetic-error",
  },
  admin: { label: "Admin", icon: Settings, color: "text-muted-foreground" },
};
const timestamp = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));

type ActivityFeedProps = {
  initialResult: Awaited<ReturnType<typeof getRecentActivity>>;
};

export function ActivityFeed({ initialResult }: ActivityFeedProps) {
  const admin = useAuth();
  return admin ? (
    <RecentActivity
      key={`${admin.id}:${admin.role}`}
      initialResult={initialResult}
    />
  ) : null;
}

function RecentActivity({ initialResult }: ActivityFeedProps) {
  const [data, setData] = useState<Activity[] | undefined>(initialResult.data);
  const [error, setError] = useState<string | undefined>(initialResult.error);
  const [pending, setPending] = useState(false);
  const [connection, setConnection] = useState("Menghubungkan…");
  const refresh = useRef<() => void>(() => {});

  useEffect(() => {
    let active = true;
    let connected = false;
    let inFlight = false;
    let queued = false;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      if (!active) return;
      if (inFlight) {
        queued = true;
        return;
      }
      inFlight = true;
      setPending(true);
      try {
        const result = await getRecentActivity(20);
        if (!active) return;
        if (result.error) setError(result.error);
        else {
          setData(result.data);
          setError(undefined);
        }
      } catch {
        if (active) setError("Koneksi terputus. Silakan coba lagi.");
      } finally {
        inFlight = false;
        if (active) {
          setPending(false);
          if (queued) {
            queued = false;
            void load();
          }
        }
      }
    }
    refresh.current = () => void load();
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-activity")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dashboard_activity" },
        () => {
          if (debounce) return;
          debounce = setTimeout(() => {
            debounce = undefined;
            void load();
          }, 200);
        },
      )
      .subscribe((status) => {
        if (!active) return;
        connected = status === "SUBSCRIBED";
        setConnection(
          connected ? "Live" : "Menghubungkan ulang · refresh tiap 1 menit",
        );
        if (connected) void load(); // Catch changes between initial fetch and subscription/reconnect.
      });
    const timer = setInterval(() => {
      if (!connected) void load();
    }, 60000);
    const onFocus = () => void load();
    const onOffline = () => {
      connected = false;
      setConnection("Offline · menunggu koneksi");
    };
    const onOnline = () => {
      connected = channel.state === "joined";
      setConnection(
        connected ? "Live" : "Menghubungkan ulang · refresh tiap 1 menit",
      );
      void load();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      active = false;
      refresh.current = () => {};
      clearTimeout(debounce);
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card role="region" aria-label="Aktivitas terbaru">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle>Aktivitas terbaru</CardTitle>
            <CardDescription>
              20 aktivitas terakhir dari MicroSaaS dalam akses Anda
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span role="status" className="text-xs text-muted-foreground">
              {connection}
            </span>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => refresh.current()}
            >
              {pending ? "Memperbarui aktivitas…" : "Refresh aktivitas"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <p role="alert" className="mb-4 text-sm text-kinetic-error">
            {error} {data && "Menampilkan data terakhir yang berhasil dimuat."}
          </p>
        )}
        {!data && pending ? (
          <div role="status" className="space-y-4">
            <span className="sr-only">Memuat aktivitas…</span>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-muted/30 motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : !data ? (
          <p className="py-8 text-center text-muted-foreground">
            Aktivitas belum tersedia. Gunakan Refresh aktivitas untuk mencoba
            lagi.
          </p>
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            Belum ada aktivitas dalam akses Anda.
          </p>
        ) : (
          <ol
            aria-label="Daftar aktivitas"
            className="divide-y divide-border/50"
          >
            {data.map((item) => {
              const meta =
                kinds[item.kind as keyof typeof kinds] ?? kinds.admin;
              const Icon = meta.icon;
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-muted/30 ${meta.color}`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{meta.label}</Badge>
                      <span className="break-all text-xs text-muted-foreground">
                        {item.product_name}
                      </span>
                    </div>
                    <Link
                      href={activityLink(item)}
                      className="block break-words text-sm font-medium underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      {item.description}
                    </Link>
                    <time
                      dateTime={item.occurred_at}
                      className="block text-xs text-muted-foreground"
                    >
                      {timestamp(item.occurred_at)} WIB
                    </time>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
