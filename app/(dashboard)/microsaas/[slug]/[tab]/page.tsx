import { Suspense } from "react";
import { ProductDetail } from "@/modules/microsaas/components/ProductDetail";

async function Detail({
  params,
  searchParams,
}: PageProps<"/microsaas/[slug]/[tab]">) {
  const { slug, tab } = await params;
  const query = await searchParams;
  return (
    <ProductDetail
      slug={slug}
      tab={tab}
      page={typeof query.page === "string" ? query.page : "1"}
      size={typeof query.size === "string" ? query.size : "25"}
    />
  );
}

export default function ProductTabPage(
  props: PageProps<"/microsaas/[slug]/[tab]">,
) {
  return (
    <Suspense fallback={<p role="status">Memuat data produk…</p>}>
      <Detail {...props} />
    </Suspense>
  );
}
