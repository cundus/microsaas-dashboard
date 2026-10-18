import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { readAdminSession } from "./session";

export const getAdminSession = cache(async () =>
  readAdminSession(await createClient()),
);

// Call this in every future data action as well as relying on database RLS.
export async function requireAdmin() {
  const session = await getAdminSession();
  if (session.status === "unauthenticated") redirect("/login");
  if (session.status === "forbidden") redirect("/403");
  return session.admin;
}
