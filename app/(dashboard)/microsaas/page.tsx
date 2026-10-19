/* eslint-disable @next/next/no-img-element */
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MicroSaaSForm } from "@/modules/microsaas/components/MicroSaaSForm";

async function Registry() {
  await connection();
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("microsaas")
    .select("*")
    .order("name");
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-headline-lg font-bold">MicroSaaS</h1>
          <p className="mt-2 text-muted-foreground">
            Registry produk dalam portofolio Anda.
          </p>
        </div>
        {admin.role === "super_admin" && <MicroSaaSForm />}
      </div>
      {error ? (
        <p role="alert">
          Registry gagal dimuat. Muat ulang halaman untuk mencoba lagi.
        </p>
      ) : !data?.length ? (
        <Card>
          <CardContent className="py-8 text-muted-foreground">
            Belum ada MicroSaaS yang dapat Anda akses.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-3">
          {data.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {p.logo_url && /^https?:\/\//.test(p.logo_url) && (
                    <img
                      src={p.logo_url}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-md object-contain"
                    />
                  )}
                  <CardTitle>
                    <Link
                      href={`/microsaas/${p.slug}`}
                      className="hover:text-primary"
                    >
                      {p.name}
                    </Link>
                  </CardTitle>
                </div>
                <Badge
                  className="self-start"
                  variant={p.status === "active" ? "success" : "secondary"}
                >
                  {p.status === "active" ? "Aktif" : "Nonaktif"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {p.description || "Belum ada deskripsi."}
                </p>
                <Link
                  href={`/microsaas/${p.slug}`}
                  className="text-sm text-primary"
                >
                  Lihat detail →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MicroSaaSPage() {
  return (
    <Suspense fallback={<p role="status">Memuat registry MicroSaaS…</p>}>
      <Registry />
    </Suspense>
  );
}
