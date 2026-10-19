export function parseDetailQuery(
  params: Record<string, string | string[] | undefined>,
) {
  const read = (key: string, fallback: string) => {
    const value = params[key] ?? fallback;
    if (typeof value !== "string" || !/^\d+$/.test(value))
      throw new Error("Pagination tidak valid.");
    return Number(value);
  };
  const transactionsPage = read("transactionsPage", "1");
  const loginsPage = read("loginsPage", "1");
  const subscriptionsPage = read("subscriptionsPage", "1");
  const size = read("size", "25");
  if (
    ![25, 50, 100].includes(size) ||
    [transactionsPage, loginsPage, subscriptionsPage].some(
      (p) => p < 1 || p > 40000,
    )
  )
    throw new Error("Pagination tidak valid.");
  return { transactionsPage, loginsPage, subscriptionsPage, size };
}

export const validUserId = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
