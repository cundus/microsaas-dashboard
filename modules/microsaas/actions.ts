"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { encryptSecret } from "@/lib/secrets";
import { logoExtension, parseProduct, validUrl } from "./validation";

export type MutationResult = {
  error?: string;
  success?: string;
  slug?: string;
};

async function ownerClient() {
  const admin = await requireAdmin();
  if (admin.role !== "super_admin")
    throw new Error("Hanya Super Admin yang dapat mengubah produk.");
  return createClient();
}

async function removeLogo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  url: string | null,
) {
  const bucket = supabase.storage.from("microsaas-logos");
  const prefix = bucket.getPublicUrl("").data.publicUrl;
  const path = url?.startsWith(prefix) ? url.slice(prefix.length) : "";
  if (/^[a-f0-9-]+\.(png|jpg|webp)$/.test(path))
    await bucket.remove([path]).catch(() => undefined);
}

function message(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === "23505") return "Slug sudah digunakan. Pilih slug lain.";
  if (code === "23503")
    return "Produk masih memiliki data terkait. Nonaktifkan produk untuk mempertahankan riwayatnya.";
  if (code === "22023")
    return "Konfirmasi nama produk tidak sesuai. Muat ulang dan coba lagi.";
  if (error instanceof Error) return error.message;
  return "Perubahan gagal disimpan. Silakan coba lagi.";
}

function refresh() {
  revalidatePath("/", "layout");
}

async function saveProduct(
  id: string | null,
  form: FormData,
): Promise<MutationResult> {
  const supabase = await ownerClient();
  let uploaded: string | undefined;
  try {
    const product = parseProduct(form);
    const previous = id
      ? await supabase
          .from("microsaas")
          .select("logo_url")
          .eq("id", id)
          .single()
      : null;
    if (previous?.error) throw previous.error;
    let logo_url: string | undefined;
    const file = form.get("logo");
    if (file instanceof File && file.size > 0) {
      if (file.size > 1048576) throw new Error("Logo maksimal 1 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const ext = logoExtension(bytes, file.type);
      uploaded = `${randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("microsaas-logos")
        .upload(uploaded, bytes, { contentType: file.type, upsert: false });
      if (error)
        throw new Error(
          "Upload logo gagal. Gunakan PNG/JPEG/WebP maksimal 1 MB dan coba lagi.",
        );
      logo_url = supabase.storage.from("microsaas-logos").getPublicUrl(uploaded)
        .data.publicUrl;
    }
    const values = { ...product, ...(logo_url ? { logo_url } : {}) };
    const query = id
      ? supabase.from("microsaas").update(values).eq("id", id)
      : supabase.from("microsaas").insert(values);
    const { data, error } = await query.select("slug").single();
    if (error) throw error;
    if (uploaded && previous?.data)
      await removeLogo(supabase, previous.data.logo_url);
    refresh();
    return { success: "Produk berhasil disimpan.", slug: data.slug };
  } catch (error) {
    if (uploaded)
      await supabase.storage.from("microsaas-logos").remove([uploaded]);
    return { error: message(error) };
  }
}

export async function createMicroSaaS(form: FormData) {
  return saveProduct(null, form);
}
export async function updateMicroSaaS(id: string, form: FormData) {
  return saveProduct(id, form);
}

export async function deleteMicroSaaS(
  id: string,
  confirmation: string,
): Promise<MutationResult> {
  const supabase = await ownerClient();
  const { data: previous, error: readError } = await supabase
    .from("microsaas")
    .select("logo_url")
    .eq("id", id)
    .single();
  if (readError)
    return { error: "Produk tidak ditemukan. Muat ulang halaman." };
  const { error } = await supabase.rpc("delete_microsaas", {
    p_id: id,
    p_confirmation: confirmation,
  });
  if (error) return { error: message(error) };
  await removeLogo(supabase, previous.logo_url);
  refresh();
  return { success: "Produk berhasil dihapus." };
}

export async function saveConfiguration(
  id: string,
  form: FormData,
): Promise<MutationResult> {
  const supabase = await ownerClient();
  try {
    const webhook = String(form.get("webhook_url") ?? "").trim();
    const environment = String(form.get("environment") ?? "");
    const key = String(form.get("api_key") ?? "").trim();
    if ((webhook && !validUrl(webhook, true)) || webhook.length > 2048)
      throw new Error(
        "Webhook harus berupa URL HTTPS tanpa kredensial, maksimal 2048 karakter.",
      );
    if (!["sandbox", "production"].includes(environment))
      throw new Error("Environment tidak valid.");
    if (key.length > 4096) throw new Error("API key maksimal 4096 karakter.");
    const ciphertext = key ? encryptSecret(key, id) : undefined;
    const { error } = await supabase.rpc("save_microsaas_config", {
      p_id: id,
      p_webhook: webhook,
      p_environment: environment,
      ...(ciphertext ? { p_ciphertext: ciphertext, p_mask: "••••••••" } : {}),
    });
    if (error) throw error;
    refresh();
    return { success: "Konfigurasi berhasil disimpan." };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function setMaintenance(
  id: string,
  enabled: boolean,
  confirmation: string,
): Promise<MutationResult> {
  const supabase = await ownerClient();
  const { error } = await supabase.rpc("set_microsaas_maintenance", {
    p_id: id,
    p_enabled: enabled,
    p_confirmation: confirmation,
  });
  if (error) return { error: message(error) };
  refresh();
  return {
    success: enabled ? "Maintenance diaktifkan." : "Maintenance dinonaktifkan.",
  };
}
