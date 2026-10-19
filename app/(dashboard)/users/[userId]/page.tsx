import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { getUserById } from "@/modules/users/detail-actions";
import { parseDetailQuery } from "@/modules/users/detail-query";
import { UserDetail } from "@/modules/users/components/UserDetail";

async function Content({ params, searchParams }: PageProps<"/users/[userId]">) {
  await connection();
  const { userId } = await params;
  let query;
  try {
    query = parseDetailQuery(await searchParams);
  } catch {
    return (
      <p role="alert">
        Pagination tidak valid.{" "}
        <Link
          className="text-primary"
          href={`/users/${encodeURIComponent(userId)}`}
        >
          Reset halaman
        </Link>
      </p>
    );
  }
  const result = await getUserById(userId, query);
  if (result.forbidden) redirect("/403");
  if (result.notFound) notFound();
  if (!result.data)
    return (
      <div role="alert" className="space-y-4">
        <p>{result.error}</p>
        <Link
          href={`/users/${encodeURIComponent(userId)}`}
          className="text-primary"
        >
          Coba lagi
        </Link>
      </div>
    );
  return <UserDetail data={result.data} />;
}

export default function Page(props: PageProps<"/users/[userId]">) {
  return (
    <div className="space-y-6">
      <Link href="/users" className="text-sm text-primary">
        ← Semua pengguna
      </Link>
      <Suspense fallback={<p role="status">Memuat detail pengguna…</p>}>
        <Content {...props} />
      </Suspense>
    </div>
  );
}
