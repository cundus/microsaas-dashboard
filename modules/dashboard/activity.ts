import type { Database } from "@/types/database";

export type Activity =
  Database["public"]["Functions"]["get_recent_activity"]["Returns"][number];

export function activityLink(item: Activity) {
  // Detail modules are introduced by later stories; keep links on existing routes.
  const query = new URLSearchParams({ microsaas: item.microsaas_id });
  if (item.kind === "signup") {
    query.set("user", item.resource_id);
    return `/users?${query}`;
  }
  if (item.kind === "upgrade" || item.kind === "churn") {
    query.set("subscription", item.resource_id);
    return `/subscriptions?${query}`;
  }
  if (item.kind === "error_spike") {
    query.set("metric", item.resource_id);
    return `/performance?${query}`;
  }
  return `/microsaas/${encodeURIComponent(item.product_slug)}`;
}
