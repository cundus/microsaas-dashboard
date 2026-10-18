export type MicroSaaSRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  status: string;
  user_count: number | null;
  currency: string;
  mrr: number;
  uptime_percent: number | null;
  latest_uptime_percent: number | null;
  checked_at: string | null;
};

export type MicroSaaSSummary = Omit<MicroSaaSRow, "currency" | "mrr"> & {
  revenue: { currency: string; mrr: number }[];
};

export function groupMicroSaaS(rows: MicroSaaSRow[]): MicroSaaSSummary[] {
  const products = new Map<string, MicroSaaSSummary>();
  for (const { currency, mrr, ...row } of rows) {
    let product = products.get(row.id);
    if (!product) {
      product = { ...row, revenue: [] };
      products.set(row.id, product);
    }
    product.revenue.push({ currency, mrr });
  }
  return [...products.values()];
}

export function getHealth(
  uptime: number | null,
  checkedAt: string | null,
  now = Date.now(),
): "Healthy" | "Degraded" | "Down" | "Unknown" {
  const time = checkedAt ? Date.parse(checkedAt) : NaN;
  if (
    uptime === null ||
    !Number.isFinite(time) ||
    time > now ||
    now - time > 15 * 60 * 1000
  )
    return "Unknown";
  if (uptime === 0) return "Down";
  return uptime >= 99.5 ? "Healthy" : "Degraded";
}

export function safeLogoUrl(url: string | null) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol)
      ? parsed.href
      : undefined;
  } catch {
    return undefined;
  }
}
