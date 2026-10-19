export const userSortColumns = [
  "name",
  "email",
  "microsaas_name",
  "plan_name",
  "status",
  "created_at",
] as const;
export type UserFilters = {
  search: string;
  microsaas: string;
  plan: string;
  status: string;
  joinedFrom: string;
  joinedTo: string;
};
export type UserPagination = {
  page: number;
  pageSize: 25 | 50 | 100;
  sort: { id: (typeof userSortColumns)[number]; direction: "asc" | "desc" };
};
export type UserQuery = UserFilters & UserPagination;
export type UserRow = {
  id: string;
  avatar_url: string | null;
  name: string;
  email: string;
  microsaas_id: string;
  microsaas_name: string;
  microsaas_slug: string;
  plan_id: string | null;
  plan_name: string | null;
  status: string;
  created_at: string;
};
export type UsersPage = { rows: UserRow[]; total: number; page: number };
export type UsersResult =
  { data: UsersPage; error?: never } | { data?: never; error: string };
export type FilterOptions = {
  products: { id: string; name: string }[];
  plans: { id: string; name: string }[];
};

type Params = Record<string, string | string[] | undefined>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseUserQuery(params: Params): UserQuery {
  const read = (key: string, fallback = "") => {
    const value = params[key];
    if (Array.isArray(value))
      throw new Error("Parameter filter tidak boleh berulang.");
    return value ?? fallback;
  };
  const search = read("search");
  const microsaas = read("microsaas");
  const plan = read("plan");
  const status = read("status");
  const joinedFrom = read("from");
  const joinedTo = read("to");
  const sort = read("sort", "created_at");
  const direction = read("direction", "desc");
  const page = read("page", "1");
  const pageSize = read("size", "25");
  if (search.length > 200) throw new Error("Pencarian maksimal 200 karakter.");
  if ((microsaas && !uuid.test(microsaas)) || (plan && !uuid.test(plan)))
    throw new Error("Filter produk atau plan tidak valid.");
  if (!["", "active", "banned", "trial"].includes(status))
    throw new Error("Filter status tidak valid.");
  for (const date of [joinedFrom, joinedTo]) {
    if (
      date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        date < "0001-01-01" ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date)
    )
      throw new Error("Tanggal bergabung tidak valid.");
  }
  if (joinedFrom && joinedTo && joinedFrom > joinedTo)
    throw new Error(
      "Tanggal awal harus sebelum atau sama dengan tanggal akhir.",
    );
  if (
    !userSortColumns.includes(sort as UserPagination["sort"]["id"]) ||
    !["asc", "desc"].includes(direction)
  )
    throw new Error("Urutan tabel tidak valid.");
  if (
    !/^\d+$/.test(page) ||
    Number(page) < 1 ||
    Number(page) > 40000 ||
    !["25", "50", "100"].includes(pageSize)
  )
    throw new Error("Pagination tidak valid.");
  return {
    search,
    microsaas,
    plan,
    status,
    joinedFrom,
    joinedTo,
    page: Number(page),
    pageSize: Number(pageSize) as UserPagination["pageSize"],
    sort: {
      id: sort as UserPagination["sort"]["id"],
      direction: direction as "asc" | "desc",
    },
  };
}

export function userQueryParams(query: UserQuery) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({
    search: query.search,
    microsaas: query.microsaas,
    plan: query.plan,
    status: query.status,
    from: query.joinedFrom,
    to: query.joinedTo,
  }))
    if (value) params.set(key, value);
  params.set("page", String(query.page));
  params.set("size", String(query.pageSize));
  params.set("sort", query.sort.id);
  params.set("direction", query.sort.direction);
  return params;
}
