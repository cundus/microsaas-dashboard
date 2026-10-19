"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { createAuthStore } from "@/lib/auth/store";
import { getCurrentAdmin } from "@/lib/auth/actions";
import type { Admin } from "@/lib/auth/session";

const AuthStoreContext = createContext<ReturnType<
  typeof createAuthStore
> | null>(null);

export function AuthProvider({
  admin,
  children,
}: {
  admin: Admin;
  children: React.ReactNode;
}) {
  // A fresh store for each render tree, never a server-wide singleton.
  const [store] = useState(() => createAuthStore(admin));
  const router = useRouter();

  useEffect(() => {
    let active = true;
    let inFlight = false;
    const refresh = async () => {
      if (!active || inFlight) return;
      inFlight = true;
      try {
        const current = await getCurrentAdmin();
        if (
          active &&
          (current.id !== admin.id ||
            current.role !== admin.role ||
            current.name !== admin.name ||
            current.email !== admin.email)
        )
          router.refresh();
      } catch {
        // Let the server boundary handle failed access checks and redirects.
        if (active) router.refresh();
      } finally {
        inFlight = false;
      }
    };
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        active = false;
        store.getState().clear();
        window.location.replace("/login");
      } else if (event === "SIGNED_IN" && session?.user.id !== admin.id) {
        router.refresh();
      } else if (event === "USER_UPDATED") {
        void refresh();
      }
    });
    // Revalidate admin deactivation/role changes when returning to the tab.
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("focus", refresh);
    };
  }, [admin, router, store]);

  return (
    <AuthStoreContext.Provider value={store}>
      {children}
    </AuthStoreContext.Provider>
  );
}

export function useAuth() {
  const store = useContext(AuthStoreContext);
  if (!store) throw new Error("useAuth harus digunakan di dalam AuthProvider.");
  return useStore(store, (state) => state.admin);
}
