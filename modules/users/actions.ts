"use server";

import { requireAdmin } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import {
  parseUserQuery,
  userQueryParams,
  type UserFilters,
  type UserPagination,
  type UsersResult,
  type UserRow,
} from "./query";

export async function getUsers(
  filters: UserFilters,
  pagination: UserPagination,
): Promise<UsersResult> {
  const admin = await requireAdmin();
  if (admin.role === "finance_admin")
    return { error: "Anda tidak memiliki akses ke data pengguna." };
  try {
    // URL and action callers both pass through the same server-side validation.
    const query = parseUserQuery(
      Object.fromEntries(userQueryParams({ ...filters, ...pagination })),
    );
    const supabase = await createClient();
    const { data, error } = await supabase
      .rpc("get_users", {
        p_search: query.search,
        p_status: query.status,
        ...(query.microsaas ? { p_microsaas: query.microsaas } : {}),
        ...(query.plan ? { p_plan: query.plan } : {}),
        ...(query.joinedFrom ? { p_joined_from: query.joinedFrom } : {}),
        ...(query.joinedTo ? { p_joined_to: query.joinedTo } : {}),
        p_sort: query.sort.id,
        p_direction: query.sort.direction,
        p_page: query.page,
        p_size: query.pageSize,
      })
      .single();
    if (error || !data)
      return { error: "Daftar pengguna gagal dimuat. Silakan coba lagi." };
    return {
      data: {
        rows: data.rows as unknown as UserRow[],
        total: data.total,
        page: data.current_page,
      },
    };
  } catch {
    return {
      error:
        "Filter tidak valid atau daftar pengguna gagal dimuat. Periksa filter lalu coba lagi.",
    };
  }
}
