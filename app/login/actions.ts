"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { readAdminSession, safeNextPath } from "@/lib/auth/session";

export type AuthFormState = { error?: string };

export async function signIn(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = formData.get("email");
  const password = formData.get("password");
  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    email.length > 254 ||
    typeof password !== "string" ||
    !password ||
    password.length > 4096
  ) {
    return { error: "Masukkan email dan password yang valid." };
  }

  let status: "authenticated" | "forbidden";
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error)
      return {
        error: "Login gagal. Periksa email dan password, lalu coba lagi.",
      };
    const session = await readAdminSession(supabase);
    if (session.status === "unauthenticated")
      return { error: "Sesi tidak dapat diverifikasi. Coba login kembali." };
    status = session.status;
  } catch {
    return { error: "Layanan login belum tersedia. Silakan coba lagi." };
  }
  revalidatePath("/", "layout");
  redirect(
    status === "forbidden" ? "/403" : safeNextPath(formData.get("next")),
  );
}

export async function signOut(): Promise<AuthFormState> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) return { error: "Logout gagal. Silakan coba lagi." };
  } catch {
    return { error: "Logout gagal. Silakan coba lagi." };
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
