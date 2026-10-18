"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { createAuthStore } from "@/lib/auth/store";
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
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        store.getState().clear();
        window.location.replace("/login");
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        router.refresh();
      }
    });
    // Revalidate admin deactivation/role changes when returning to the tab.
    const refresh = () => router.refresh();
    window.addEventListener("focus", refresh);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", refresh);
    };
  }, [router, store]);

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
