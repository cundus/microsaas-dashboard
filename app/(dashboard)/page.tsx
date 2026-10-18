"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { LogoutButton } from "@/components/auth/logout-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { adminRoles } from "@/lib/auth/session";

export default function Home() {
  const admin = useAuth();
  if (!admin) return null;
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-xl">
        <CardHeader className="gap-4">
          <ShieldCheck className="size-8 text-primary" aria-hidden="true" />
          <Badge className="self-start">{adminRoles[admin.role]}</Badge>
          <CardTitle>Selamat datang, {admin.name}.</CardTitle>
          <CardDescription>
            Anda masuk sebagai {admin.email}. Workspace admin Anda siap
            digunakan.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-start gap-3">
          <Button asChild>
            <Link href="/design-system">Lihat design system</Link>
          </Button>
          <LogoutButton />
        </CardContent>
      </Card>
    </main>
  );
}
