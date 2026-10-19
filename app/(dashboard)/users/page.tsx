import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { getUsers } from "@/modules/users/actions";
import { parseUserQuery } from "@/modules/users/query";
import { UserTable } from "@/modules/users/components/UserTable";

async function UsersContent({ searchParams }: PageProps<"/users">) {
  await connection();
  const admin = await requireAdmin();
  if (admin.role === "finance_admin") redirect("/403");
  let query;
  try {
    query = parseUserQuery(await searchParams);
  } catch {
    return (
      <div role="alert" className="space-y-4">
        <p>
          Filter pengguna tidak valid. Periksa tanggal, status, dan pagination.
        </p>
        <Link href="/users" className="text-primary">
          Reset filter
        </Link>
      </div>
    );
  }
  const supabase = await createClient();
  const [result, products, plans] = await Promise.all([
    getUsers(query, query),
    supabase.from("microsaas").select("id,name").order("name"),
    supabase.from("plans").select("id,name").order("name"),
  ]);
  if (products.error || plans.error)
    return (
      <p role="alert">
        Pilihan filter gagal dimuat. Muat ulang halaman untuk mencoba lagi.
      </p>
    );
  return (
    <UserTable
      initialQuery={query}
      initialResult={result}
      options={{ products: products.data ?? [], plans: plans.data ?? [] }}
    />
  );
}

export default function UsersPage(props: PageProps<"/users">) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-headline-lg font-bold">Pengguna</h1>
        <p className="mt-2 text-muted-foreground">
          Temukan pengguna di seluruh produk yang dapat Anda akses.
        </p>
      </div>
      <Suspense fallback={<p role="status">Memuat daftar pengguna…</p>}>
        <UsersContent {...props} />
      </Suspense>
    </div>
  );
}
