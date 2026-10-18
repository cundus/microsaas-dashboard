import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/server";
import { canAccess, modulePages } from "@/lib/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Suspense } from "react";

export default async function ModulePage({
  params,
}: PageProps<"/[...module]">) {
  await connection();
  const admin = await requireAdmin();
  const { module } = await params;
  const pathname = `/${module.join("/")}`;
  const page = modulePages.find(({ href }) => href === pathname);
  if (!page) notFound();
  if (!canAccess(page, admin.role)) redirect("/403");
  const children = modulePages.filter(
    (item) =>
      item.href.startsWith(`${pathname}/`) && canAccess(item, admin.role),
  );
  return (
    <Suspense>
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-label-caps text-muted-foreground uppercase">
            Workspace admin
          </p>
          <h1 className="font-display text-headline-lg">{page.label}</h1>
        </div>
        <Card>
          <CardHeader className="gap-3">
            <Badge className="self-start" variant="secondary">
              Belum tersedia
            </Badge>
            <CardTitle>Modul {page.label}</CardTitle>
            <CardDescription>
              Fitur modul ini akan tersedia pada story berikutnya. Gunakan
              navigasi untuk berpindah ke modul lain.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {children.map((item) => (
              <Button key={item.href} asChild variant="secondary">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
            <Button asChild variant="ghost">
              <Link href="/">Kembali ke dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Suspense>
  );
}
