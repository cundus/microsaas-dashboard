"use server";

import { requireAdmin } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { parseDetailQuery, validUserId } from "./detail-query";

export async function getUserById(
  userId: string,
  pagination: {
    transactionsPage: number;
    loginsPage: number;
    subscriptionsPage?: number;
    size: number;
  } = { transactionsPage: 1, loginsPage: 1, size: 25 },
) {
  const admin = await requireAdmin();
  if (admin.role === "finance_admin") return { forbidden: true } as const;
  if (!validUserId(userId)) return { notFound: true } as const;
  let query;
  try {
    if (
      Object.values(pagination).some(
        (value) => typeof value !== "number" || !Number.isSafeInteger(value),
      )
    )
      throw new Error("Pagination tidak valid.");
    query = parseDetailQuery(
      Object.fromEntries(
        Object.entries(pagination).map(([k, v]) => [k, String(v)]),
      ),
    );
  } catch {
    return { error: "Pagination tidak valid." } as const;
  }
  try {
    const db = await createClient();
    const { data: user, error } = await db
      .from("users")
      .select(
        "id,name,email,avatar_url,status,external_id,created_at,last_login_at,microsaas_id,microsaas(name,slug)",
      )
      .eq("id", userId)
      .neq("status", "deleted")
      .maybeSingle();
    if (error)
      return {
        error: "Profil pengguna gagal dimuat. Silakan coba lagi.",
      } as const;
    if (!user) return { notFound: true } as const;
    const scoped = { user: user.id, product: user.microsaas_id };
    const [subscriptionCount, transactionCount, loginCount] = await Promise.all(
      [
        db
          .from("subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", scoped.user)
          .eq("microsaas_id", scoped.product)
          .in("status", ["active", "trial", "past_due", "complimentary"]),
        db
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", scoped.user)
          .eq("microsaas_id", scoped.product),
        db
          .from("user_login_history")
          .select("id", { count: "exact", head: true })
          .eq("user_id", scoped.user)
          .eq("microsaas_id", scoped.product),
      ],
    );
    if (subscriptionCount.error || transactionCount.error || loginCount.error)
      return {
        error: "Data pengguna gagal dimuat. Silakan coba lagi.",
      } as const;
    const transactionPage = Math.min(
      query.transactionsPage,
      Math.max(1, Math.ceil((transactionCount.count ?? 0) / query.size)),
    );
    const loginPage = Math.min(
      query.loginsPage,
      Math.max(1, Math.ceil((loginCount.count ?? 0) / query.size)),
    );
    const subscriptionPage = Math.min(
      query.subscriptionsPage,
      Math.max(1, Math.ceil((subscriptionCount.count ?? 0) / query.size)),
    );
    const [subscriptions, transactions, logins] = await Promise.all([
      db
        .from("subscriptions")
        .select(
          "id,status,price,currency,billing_interval,current_period_start,current_period_end,trial_ends_at,plan_microsaas(plans(name))",
        )
        .eq("user_id", scoped.user)
        .eq("microsaas_id", scoped.product)
        .in("status", ["active", "trial", "past_due", "complimentary"])
        .order("created_at", { ascending: false })
        .order("id")
        .range(
          (subscriptionPage - 1) * query.size,
          subscriptionPage * query.size - 1,
        ),
      db
        .from("transactions")
        .select("id,amount,currency,status,payment_method,paid_at,created_at")
        .eq("user_id", scoped.user)
        .eq("microsaas_id", scoped.product)
        .order("created_at", { ascending: false })
        .order("id")
        .range(
          (transactionPage - 1) * query.size,
          transactionPage * query.size - 1,
        ),
      db
        .from("user_login_history")
        .select("id,occurred_at")
        .eq("user_id", scoped.user)
        .eq("microsaas_id", scoped.product)
        .order("occurred_at", { ascending: false })
        .order("id", { ascending: false })
        .range((loginPage - 1) * query.size, loginPage * query.size - 1),
    ]);
    if (subscriptions.error || transactions.error || logins.error)
      return {
        error: "Riwayat pengguna gagal dimuat. Silakan coba lagi.",
      } as const;
    return {
      data: {
        user,
        subscriptions: subscriptions.data,
        transactions: transactions.data,
        logins: logins.data,
        transactionTotal: transactionCount.count ?? 0,
        loginTotal: loginCount.count ?? 0,
        subscriptionTotal: subscriptionCount.count ?? 0,
        query: {
          ...query,
          transactionsPage: transactionPage,
          loginsPage: loginPage,
          subscriptionsPage: subscriptionPage,
        },
      },
    };
  } catch {
    return { error: "Data pengguna gagal dimuat. Silakan coba lagi." } as const;
  }
}
