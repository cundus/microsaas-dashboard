"use server";

import { createClient as createAuthClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { validUserId } from "./detail-query";

export type AccountResult = { error?: string; success?: string };

async function act(
  userId: string,
  action: "ban" | "unban" | "delete" | "reset_password",
  reason?: string,
  confirmation?: string,
): Promise<AccountResult> {
  const admin = await requireAdmin();
  if (!["super_admin", "operator_admin"].includes(admin.role))
    return { error: "Anda tidak memiliki izin mengubah pengguna." };
  if (!validUserId(userId)) return { error: "ID pengguna tidak valid." };
  if (
    action === "ban" &&
    (typeof reason !== "string" ||
      !reason.trim() ||
      [...reason.trim()].length > 500)
  )
    return { error: "Alasan ban wajib diisi, maksimal 500 karakter." };
  if (
    action === "delete" &&
    (typeof confirmation !== "string" ||
      !confirmation ||
      confirmation.length > 320)
  )
    return { error: "Ketik email pengguna untuk mengonfirmasi penghapusan." };
  try {
    const db = await createClient();
    const { data, error } = await db.rpc("manage_user", {
      p_user_id: userId,
      p_action: action,
      p_reason: reason?.trim(),
      p_confirmation: confirmation,
    });
    if (error) {
      if (error.code === "P0002" || error.code === "42501")
        return { error: "Pengguna tidak ditemukan atau tidak dapat diakses." };
      if (error.code === "22023")
        return {
          error:
            "Status atau konfirmasi tidak sesuai. Muat ulang dan coba lagi.",
        };
      if (error.code === "54000")
        return { error: "Tunggu 60 detik sebelum meminta reset lagi." };
      return { error: "Perubahan gagal disimpan. Silakan coba lagi." };
    }
    if (action === "reset_password") {
      if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data) ||
        typeof data.email !== "string" ||
        typeof data.redirectTo !== "string"
      )
        return { error: "Konfigurasi reset password tidak tersedia." };
      const { url, key } = getSupabaseEnv();
      // Recovery is opened on the product, often on another device. Do not use
      // the admin's SSR PKCE verifier or write recovery state to admin cookies.
      const auth = createAuthClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          flowType: "implicit",
        },
      });
      const reset = await auth.auth.resetPasswordForEmail(data.email, {
        redirectTo: data.redirectTo,
      });
      if (reset.error)
        return { error: "Permintaan reset gagal. Coba lagi setelah 60 detik." };
      return {
        success:
          "Permintaan reset diterima. Jika email terdaftar, tautan reset akan dikirim.",
      };
    }
    revalidatePath("/", "layout");
    return {
      success:
        action === "ban"
          ? "Pengguna berhasil diban."
          : action === "unban"
            ? "Ban pengguna berhasil dicabut."
            : "Akun pengguna berhasil dihapus.",
    };
  } catch {
    return { error: "Layanan tidak dapat dihubungi. Silakan coba lagi." };
  }
}

export async function banUser(userId: string, reason: string) {
  return act(userId, "ban", reason);
}
export async function unbanUser(userId: string) {
  return act(userId, "unban");
}
export async function resetUserPassword(userId: string) {
  return act(userId, "reset_password");
}
export async function deleteUser(userId: string, confirmation: string) {
  return act(userId, "delete", undefined, confirmation);
}
