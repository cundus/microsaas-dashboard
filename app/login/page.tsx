import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Layers3, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getAdminSession } from "@/lib/auth/server";
import { safeNextPath } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Login | MicroSaaS Admin" };

async function Login({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  const session = await getAdminSession();
  if (session.status === "authenticated") redirect(nextPath);
  if (session.status === "forbidden") redirect("/403");

  return <LoginForm nextPath={nextPath} />;
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/4 size-[520px] rounded-full bg-primary/5 blur-3xl"
      />
      <div className="relative w-full max-w-md space-y-8">
        <div className="flex items-center justify-center gap-3">
          <span className="rounded-control border border-primary/20 bg-primary/10 p-3 text-primary">
            <Layers3 aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            MicroSaaS <span className="text-primary">Admin</span>
          </span>
        </div>
        <Card>
          <CardHeader className="gap-3 p-8">
            <p className="text-label-caps uppercase text-primary">
              Admin workspace
            </p>
            <CardTitle className="text-headline-lg">
              Selamat datang kembali.
            </CardTitle>
            <CardDescription>
              Masuk untuk mengelola seluruh produk Anda dalam satu tempat.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Suspense
              fallback={
                <p role="status" className="text-sm text-muted-foreground">
                  Memeriksa sesi…
                </p>
              }
            >
              <Login {...props} />
            </Suspense>
          </CardContent>
        </Card>
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Akses terbatas untuk admin yang terdaftar.
        </p>
      </div>
    </main>
  );
}
