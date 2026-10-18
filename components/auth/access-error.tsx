import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { LogoutButton } from "./logout-button";

export function AccessError({ code }: { code: 401 | 403 }) {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="gap-4">
          <ShieldAlert className="size-8 text-primary" aria-hidden="true" />
          <p className="font-mono text-sm text-primary">
            {code} / {code === 401 ? "Unauthorized" : "Forbidden"}
          </p>
          <CardTitle>
            {code === 401
              ? "Silakan login terlebih dahulu."
              : "Akses admin tidak tersedia."}
          </CardTitle>
          <CardDescription>
            {code === 401
              ? "Sesi Anda belum tersedia atau sudah berakhir. Masuk kembali untuk melanjutkan."
              : "Akun Anda belum terdaftar sebagai admin aktif. Hubungi Super Admin untuk mendapatkan akses."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-start gap-3">
          <Button asChild>
            <Link href={code === 401 ? "/login" : "/"}>
              {code === 401 ? "Ke halaman login" : "Periksa akses kembali"}
            </Link>
          </Button>
          {code === 403 && <LogoutButton />}
        </CardContent>
      </Card>
    </main>
  );
}
