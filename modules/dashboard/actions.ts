"use server";

import { requireAdmin } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import type { KPI } from "./kpis";
import type { UserGrowthRange, UserGrowthPoint } from "./user-growth";
import { groupMicroSaaS, type MicroSaaSSummary } from "./microsaas";
import {
  validRevenueRange,
  type RevenueRange,
  type RevenuePoint,
} from "./revenue";

export async function getUserGrowthTimeSeries(
  range: UserGrowthRange,
): Promise<
  { data: UserGrowthPoint[]; error?: never } | { data?: never; error: string }
> {
  const admin = await requireAdmin();
  if (admin.role === "finance_admin")
    return { error: "Anda tidak memiliki akses ke data pengguna." };
  if (
    !validRevenueRange(range) ||
    !["day", "week", "month"].includes(range.interval)
  )
    return {
      error:
        "Pilih rentang valid (maksimal 366 hari) dan agregasi yang tersedia.",
    };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_user_growth_time_series", {
      p_start: range.start,
      p_end: range.end,
      p_interval: range.interval,
    });
    if (error) throw error;
    return { data };
  } catch {
    return { error: "Pertumbuhan pengguna gagal dimuat. Silakan coba lagi." };
  }
}

export async function getRevenueTimeSeries(
  range: RevenueRange,
): Promise<
  { data: RevenuePoint[]; error?: never } | { data?: never; error: string }
> {
  await requireAdmin();
  if (!validRevenueRange(range))
    return {
      error: "Pilih rentang tanggal valid, maksimal 366 hari hingga hari ini.",
    };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_revenue_time_series", {
      p_start: range.start,
      p_end: range.end,
    });
    if (error) throw error;
    return { data };
  } catch {
    return { error: "Tren pendapatan gagal dimuat. Silakan coba lagi." };
  }
}

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
