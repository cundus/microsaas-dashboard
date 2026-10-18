"use server";

import { requireAdmin } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import type { KPI } from "./kpis";
import { groupMicroSaaS, type MicroSaaSSummary } from "./microsaas";

export async function getMicroSaaSList(
  slug?: string,
): Promise<
  { data: MicroSaaSSummary[]; error?: never } | { data?: never; error: string }
> {
  await requireAdmin();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_microsaas_list", {
      p_slug: slug,
    });
    if (error) throw error;
    return { data: groupMicroSaaS(data) };
  } catch {
    return { error: "Data MicroSaaS gagal dimuat. Silakan coba lagi." };
  }
}

export async function getGlobalKPIs(): Promise<
  { data: KPI[]; error?: never } | { data?: never; error: string }
> {
  await requireAdmin();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_global_kpis");
    if (error) throw error;
    return { data };
  } catch {
    return { error: "KPI gagal dimuat. Silakan coba lagi." };
  }
}
