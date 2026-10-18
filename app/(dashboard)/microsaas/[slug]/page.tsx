import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import { Button } from "@/components/ui/button";
import { getMicroSaaSList } from "@/modules/dashboard/actions";
import { MicroSaaSCard } from "@/modules/dashboard/components/MicroSaaSCard";

async function ProductSummary({ params }: PageProps<"/microsaas/[slug]">) {
  await connection();
  const admin = await requireAdmin();
  const { slug } = await params;
  const result = await getMicroSaaSList(slug);
  if (result.error)
    return (
      <p role="alert" className="text-destructive">
        {result.error} Muat ulang halaman untuk mencoba kembali.
      </p>
    );
  const product = result.data?.[0];
  if (!product) notFound();
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="break-words font-display text-headline-lg font-bold">
        {product.name}
      </h1>
      <MicroSaaSCard
        product={product}
        restricted={admin.role === "finance_admin"}
        linked={false}
      />
      <Button asChild variant="secondary">
        <Link href="/">Kembali ke dashboard</Link>
      </Button>
    </div>
  );
}

export default function ProductPage(props: PageProps<"/microsaas/[slug]">) {
  return (
    <Suspense fallback={<p role="status">Memuat ringkasan MicroSaaS…</p>}>
      <ProductSummary {...props} />
    </Suspense>
  );
}
