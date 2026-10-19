import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { createDatabase, seed } from "./helpers/database.mjs";

const source = await readFile(
  new URL("../modules/users/query.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const queryModule = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const { parseUserQuery, userQueryParams } = queryModule;

test("URL filters round-trip safely, preserve literal search, and reject invalid boundary input", () => {
  const defaults = parseUserQuery({});
  assert.equal(defaults.pageSize, 25);
  assert.deepEqual(defaults.sort, { id: "created_at", direction: "desc" });
  const params = {
    search: "Demo User & + %,name.ilike.*",
    status: "trial",
    from: "2026-09-01",
    to: "2026-09-02",
    page: "2",
    size: "50",
    sort: "email",
    direction: "asc",
  };
  const query = parseUserQuery(params);
  assert.deepEqual(
    parseUserQuery(Object.fromEntries(userQueryParams(query))),
    query,
  );
  assert.equal(parseUserQuery({ search: "Demo " }).search, "Demo ");
  for (const invalid of [
    { status: "deleted" },
    { microsaas: "other" },
    { plan: "not-a-uuid" },
    { sort: "id;drop table users" },
    { direction: "invalid" },
    { page: "0" },
    { page: "40001" },
    { page: "1.5" },
    { size: "1000" },
    { from: "2026-02-30" },
    { from: "2026-10-02", to: "2026-10-01" },
    { search: "x".repeat(201) },
    { status: ["active", "banned"] },
  ])
    assert.throws(() => parseUserQuery(invalid));
});

test("user list searches, filters, sorts and paginates within RLS scope", async (t) => {
  const db = await createDatabase();
  t.after(() => db.close());
  await db.exec(await seed());
  const admin = (n) => `f0000000-0000-4000-8000-00000000000${n}`;
  const product = (n) => `10000000-0000-4000-8000-00000000000${n}`;
  const user = (n) => `30000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const plan = (n) => `20000000-0000-4000-8000-00000000000${n}`;
  await db.exec(`insert into auth.users values ('${admin(1)}'),('${admin(2)}'),('${admin(3)}'),('${admin(4)}');
    insert into public.admin_users(id,role_id,name) values ('${admin(1)}','super_admin','Owner'),('${admin(2)}','operator_admin','Operator'),('${admin(3)}','finance_admin','Finance');
    insert into public.admin_assignments(admin_id,microsaas_id) values ('${admin(2)}','${product(1)}');
    update public.users set status='deleted',deleted_at=now() where id='${user(50)}';
    update public.users set name='Literal % _ User' where id='${user(1)}';
    update public.users set created_at='2026-08-31 17:00:00+00' where id='${user(2)}';
    update public.users set created_at='2026-09-01 16:59:59.999+00' where id='${user(3)}';
    update public.users set created_at='2026-09-01 17:00:00+00' where id='${user(4)}';`);
  async function asAdmin(n) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      admin(n),
    ]);
    await db.exec("set role authenticated");
  }
  async function list(params = {}) {
    const q = {
      search: "",
      microsaas: null,
      plan: null,
      status: "",
      from: null,
      to: null,
      sort: "created_at",
      direction: "desc",
      page: 1,
      size: 25,
      ...params,
    };
    return (
      await db.query(
        "select * from public.get_users($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
        Object.values(q),
      )
    ).rows[0];
  }
  await asAdmin(1);
  await t.test(
    "exact filtered counts and stable server pages with no deleted users",
    async () => {
      const first = await list();
      const second = await list({ page: 2 });
      assert.equal(Number(first.total), 49);
      assert.equal(first.rows.length, 25);
      assert.equal(second.rows.length, 24);
      assert.equal(
        new Set([...first.rows, ...second.rows].map((r) => r.id)).size,
        49,
      );
      assert.ok(
        [...first.rows, ...second.rows].every((r) => r.status !== "deleted"),
      );
      assert.equal((await list({ size: 50 })).rows.length, 49);
      assert.equal((await list({ size: 100 })).rows.length, 49);
      assert.equal((await list({ page: 40000 })).current_page, 2);
      const empty = await list({ search: "no-such-user", page: 100 });
      assert.equal(Number(empty.total), 0);
      assert.equal(empty.current_page, 1);
      assert.deepEqual(empty.rows, []);
    },
  );
  await t.test(
    "case-insensitive names, email, full/partial UUID and literal wildcard characters",
    async () => {
      assert.equal(
        (await list({ search: "USER1@EXAMPLE.COM" })).rows[0].id,
        user(1),
      );
      assert.equal((await list({ search: "literal % _" })).rows[0].id, user(1));
      assert.equal(Number((await list({ search: "%" })).total), 1);
      assert.equal((await list({ search: user(22) })).rows[0].id, user(22));
      assert.equal(
        (await list({ search: "000000000022" })).rows[0].id,
        user(22),
      );
      assert.equal(Number((await list({ search: "%,name.ilike.*" })).total), 0);
    },
  );
  await t.test(
    "combined product, displayed plan, status and inclusive WIB join date filters",
    async () => {
      const rows = (
        await list({
          microsaas: product(1),
          plan: plan(1),
          status: "active",
          size: 100,
        })
      ).rows;
      assert.ok(rows.length);
      assert.ok(
        rows.every(
          (r) =>
            r.microsaas_id === product(1) &&
            r.plan_id === plan(1) &&
            r.status === "active",
        ),
      );
      const range = (
        await list({ from: "2026-09-01", to: "2026-09-01", size: 100 })
      ).rows;
      assert.ok(range.some((r) => r.id === user(2)));
      assert.ok(range.some((r) => r.id === user(3)));
      assert.ok(!range.some((r) => r.id === user(4)));
      assert.ok(
        (await list({ status: "banned", size: 100 })).rows.every(
          (r) => r.plan_id === null,
        ),
      );
    },
  );
  await t.test(
    "sort every supported column in both directions and deduplicate multiple subscriptions",
    async () => {
      for (const sort of [
        "name",
        "email",
        "microsaas_name",
        "plan_name",
        "status",
        "created_at",
      ]) {
        for (const direction of ["asc", "desc"]) {
          const result = await list({ sort, direction, size: 100 });
          const values = result.rows
            .map((r) => r[sort]?.toLowerCase())
            .filter((v) => v != null);
          const sorted = [...values].sort();
          if (direction === "desc") sorted.reverse();
          assert.deepEqual(values, sorted, `${sort} ${direction}`);
        }
      }
      await db.exec(`insert into public.subscriptions (microsaas_id,user_id,plan_id,status,billing_interval,price,current_period_start,current_period_end,created_at)
      values ('${product(1)}','${user(1)}','${plan(2)}','active','monthly',249000,now(),now()+interval '1 month',now()+interval '1 second');`);
      const result = await list({ search: user(1) });
      assert.equal(Number(result.total), 1);
      assert.equal(result.rows[0].plan_name, "Pro");
      assert.equal(
        Number((await list({ search: user(1), plan: plan(1) })).total),
        0,
      );
    },
  );
  await t.test(
    "operator filters cannot escape assignment, including totals and plan joins",
    async () => {
      await asAdmin(2);
      const result = await list({ size: 100 });
      assert.equal(Number(result.total), 17);
      assert.ok(result.rows.every((r) => r.microsaas_id === product(1)));
      assert.equal(Number((await list({ microsaas: product(2) })).total), 0);
      assert.equal(Number((await list({ search: user(2) })).total), 0);
      await db.exec("reset role");
      await db.exec(
        `delete from public.admin_assignments where admin_id='${admin(2)}'`,
      );
      await asAdmin(2);
      assert.equal(Number((await list()).total), 0);
    },
  );
  await t.test(
    "Finance, inactive admin, non-admin, and anonymous calls are denied; invalid SQL inputs are rejected",
    async () => {
      for (const n of [3, 4]) {
        await asAdmin(n);
        await assert.rejects(list(), /access required/);
      }
      await asAdmin(1);
      for (const params of [
        { size: 1000 },
        { page: 0 },
        { status: "deleted" },
        { sort: "injected" },
        { direction: "wrong" },
        { search: "x".repeat(201) },
        { from: "2026-10-02", to: "2026-10-01" },
      ])
        await assert.rejects(list(params), /Invalid user filters/);
      await db.exec(
        `update public.admin_users set is_active=false where id='${admin(2)}'`,
      );
      await asAdmin(2);
      await assert.rejects(list(), /access required/);
      await db.exec("reset role; set role anon");
      await assert.rejects(list(), /permission denied/);
    },
  );
});

test("search reads debounce by 300ms, discard stale responses, and use URL state for back/forward", async () => {
  const { outputText } = ts.transpileModule(
    await readFile(
      new URL("../modules/users/components/UserTable.tsx", import.meta.url),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    },
  );
  let params = new URLSearchParams();
  let effect;
  let previous = { current: "" };
  let resolved = null;
  const timers = new Map();
  const calls = [];
  let timerId = 0;
  const exports = {};
  runInNewContext(outputText, {
    exports,
    URLSearchParams,
    setTimeout: (callback, delay) => {
      const id = ++timerId;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    require(name) {
      if (name === "react") {
        let stateIndex = 0;
        return {
          useId: () => "test",
          useRef: () => previous,
          useEffect: (callback) => {
            effect = callback;
          },
          useState: (initial) => {
            const index = stateIndex++;
            return [
              index % 3 === 2 ? resolved : initial,
              (value) => {
                if (index % 3 === 2) resolved = value;
              },
            ];
          },
        };
      }
      if (name === "next/navigation") return { useSearchParams: () => params };
      if (name === "../query") return queryModule;
      if (name === "../actions")
        return {
          getUsers: (filters) =>
            new Promise((resolve) => calls.push({ filters, resolve })),
        };
      if (name === "react/jsx-runtime")
        return {
          jsx: (type, props) => ({ type, props }),
          jsxs: (type, props) => ({ type, props }),
        };
      return {};
    },
  });
  const initialQuery = parseUserQuery({});
  const initialResult = { data: { rows: [], total: 0, page: 1 } };
  const render = () =>
    exports.UserTable({
      initialQuery,
      initialResult,
      options: { products: [], plans: [] },
    });
  render();
  effect();
  assert.equal(timers.size, 0);
  params = new URLSearchParams("search=Demo");
  render();
  const cleanup = effect();
  assert.equal([...timers.values()][0].delay, 300);
  cleanup();
  assert.equal(timers.size, 0);
  params = new URLSearchParams("search=Demo+User");
  render();
  const cancel = effect();
  [...timers.values()][0].callback();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].filters.search, "Demo User");
  cancel();
  calls[0].resolve({ data: { rows: [{ id: "stale" }], total: 1, page: 1 } });
  await new Promise(setImmediate);
  assert.equal(resolved, null);
  params = new URLSearchParams();
  render();
  effect();
  assert.equal(timers.size, 0);
  previous = { current: "" };
});
