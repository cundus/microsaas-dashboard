export type RevenueRange = { start: string; end: string };
export type RevenuePoint = {
  day: string;
  microsaas_id: string;
  name: string;
  currency: string;
  mrr: number;
};

export function jakartaToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function presetRange(
  days: number,
  today = jakartaToday(),
): RevenueRange {
  const start = new Date(`${today}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { start: start.toISOString().slice(0, 10), end: today };
}

export function validRevenueRange(range: RevenueRange, today = jakartaToday()) {
  if (
    !range ||
    typeof range.start !== "string" ||
    typeof range.end !== "string"
  )
    return false;
  const validDate = (s: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    Number.isFinite(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s;
  return (
    validDate(range.start) &&
    validDate(range.end) &&
    range.start <= range.end &&
    range.end <= today &&
    Date.parse(range.end) - Date.parse(range.start) <= 365 * 86400000
  );
}

export function revenueChartData(rows: RevenuePoint[], currency: string) {
  const points = new Map<
    string,
    { day: string; [key: string]: string | number }
  >();
  const products = new Map<string, string>();
  for (const row of rows) {
    if (row.currency !== currency) continue;
    products.set(row.microsaas_id, row.name);
    const point = points.get(row.day) ?? { day: row.day };
    point[row.microsaas_id] = row.mrr;
    points.set(row.day, point);
  }
  return {
    points: [...points.values()].sort((a, b) => a.day.localeCompare(b.day)),
    products: [...products].map(([id, name]) => ({ id, name })),
  };
}
