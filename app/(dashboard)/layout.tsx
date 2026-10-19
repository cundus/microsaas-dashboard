import { Suspense } from "react";
import { connection } from "next/server";
import { AuthProvider } from "@/components/auth/auth-provider";
import { requireAdmin } from "@/lib/auth/server";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";

async function AdminBoundary({ children }: { children: React.ReactNode }) {
  await connection();
  const admin = await requireAdmin();
  return (
    <AuthProvider key={JSON.stringify(admin)} admin={admin}>
      <AppShell>{children}</AppShell>
      <Toaster />
    </AuthProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-8 text-muted-foreground">
          Memeriksa akses admin…
        </p>
      }
    >
      <AdminBoundary>{children}</AdminBoundary>
    </Suspense>
  );
}
