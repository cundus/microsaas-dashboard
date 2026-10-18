export type KPI = {
  metric: string;
  currency: string | null;
  value: number | null;
  previous: number | null;
};

export function percentageChange(value: number, previous: number) {
  if (previous === 0) return value === 0 ? 0 : undefined;
  return Math.round(((value - previous) / previous) * 1000) / 10;
}

export function formatKPI(value: number, currency: string | null) {
  return new Intl.NumberFormat("id-ID", {
    ...(currency ? { style: "currency", currency } : {}),
    maximumFractionDigits: currency ? 2 : 0,
  }).format(value);
}
