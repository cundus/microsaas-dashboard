import { Suspense } from "react";
import { ProductDetail } from "@/modules/microsaas/components/ProductDetail";

async function Detail({ params }: PageProps<"/microsaas/[slug]">) {
  const { slug } = await params;
  return <ProductDetail slug={slug} />;
}

export default function ProductPage(props: PageProps<"/microsaas/[slug]">) {
  return (
    <Suspense fallback={<p role="status">Memuat MicroSaaS…</p>}>
      <Detail {...props} />
    </Suspense>
  );
}
