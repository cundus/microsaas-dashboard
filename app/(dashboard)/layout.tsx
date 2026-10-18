import { Suspense } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { requireAdmin } from "@/lib/auth/server";

async function AdminBoundary({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <AuthProvider key={JSON.stringify(admin)} admin={admin}>
      {children}
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
