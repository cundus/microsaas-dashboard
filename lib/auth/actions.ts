"use server";

import { requireAdmin } from "./server";

export async function getCurrentAdmin() {
  return requireAdmin();
}
