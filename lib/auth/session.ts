import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const adminRoles = {
  super_admin: "Super Admin",
  operator_admin: "Operator Admin",
  finance_admin: "Finance Admin",
} as const;

export type Admin = {
  id: string;
  email: string;
  name: string;
  role: keyof typeof adminRoles;
};

export type AdminSession =
  | { status: "authenticated"; admin: Admin }
  | { status: "unauthenticated" }
  | { status: "forbidden" };

// Never authorize from client state or user-editable Auth metadata.
export async function readAdminSession(
  supabase: SupabaseClient<Database>,
): Promise<AdminSession> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { status: "unauthenticated" };

  const { data: profile, error: profileError } = await supabase
    .from("admin_users")
    .select("id, name, role_id, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError)
    throw new Error("Tidak dapat memuat akses admin. Coba lagi.");
  if (!profile?.is_active || !Object.hasOwn(adminRoles, profile.role_id)) {
    return { status: "forbidden" };
  }

  return {
    status: "authenticated",
    admin: {
      id: user.id,
      email: user.email ?? "",
      name: profile.name,
      role: profile.role_id as Admin["role"],
    },
  };
}

// Only return to a local dashboard URL, never a supplied origin or auth page.
export function safeNextPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\s\u0000-\u001f\u007f]/.test(value)
  )
    return "/";
  try {
    const url = new URL(value, "https://dashboard.invalid");
    if (
      url.origin !== "https://dashboard.invalid" ||
      ["/login", "/401", "/403"].includes(
        decodeURIComponent(url.pathname).replace(/\/+$/, ""),
      )
    )
      return "/";
    return url.pathname + url.search;
  } catch {
    return "/";
  }
}
