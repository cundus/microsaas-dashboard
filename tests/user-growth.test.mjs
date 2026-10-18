import assert from "node:assert/strict";
import { test } from "node:test";
import { createDatabase, seed } from "./helpers/database.mjs";

test("user acquisition aggregates, calendar boundaries and access control", async (t) => {
  const db = await createDatabase();
  t.after(() => db.close());
  await db.exec(await seed());
  const admin = (n) => `f0000000-0000-4000-8000-00000000000${n}`;
  const product = (n) => `10000000-0000-4000-8000-00000000000${n}`;
  const asAdmin = async (n) => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
      n ? admin(n) : "",
    ]);
    await db.exec("set role authenticated");
  };
  await db.exec(`
    insert into auth.users values ('${admin(1)}'), ('${admin(2)}'), ('${admin(3)}'), ('${admin(4)}'), ('${admin(5)}');
    insert into public.admin_users (id, role_id, name) values
      ('${admin(1)}', 'super_admin', 'Super'), ('${admin(2)}', 'operator_admin', 'Operator'),
      ('${admin(3)}', 'finance_admin', 'Finance'), ('${admin(5)}', 'operator_admin', 'Inactive');
    update public.admin_users set is_active = false where id = '${admin(5)}';
    insert into public.admin_assignments (admin_id, microsaas_id) values ('${admin(2)}', '${product(1)}');
    update public.users set created_at = '2025-01-01T00:00:00Z';
  `);
  for (const [index, timestamp] of [
    "2026-02-27T16:59:59Z",
    "2026-02-27T17:00:00Z",
    "2026-02-28T16:59:59Z",
    "2026-02-28T17:00:00Z",
    "2026-03-01T17:00:00Z",
    "2026-03-03T16:59:59Z",
    "2026-03-03T17:00:00Z",
  ].entries()) {
    await db.query(
      `insert into public.users (microsaas_id, external_id, email, name, created_at, status, deleted_at)
      values ($1, $2, $3, 'Fixture', $4, $5, $6)`,
      [
        product(index === 5 ? 2 : 1),
        `growth-${index}`,
        `growth-${index}@example.com`,
        timestamp,
        index === 2 ? "deleted" : index === 3 ? "banned" : "trial",
        index === 2 ? "2026-03-01T00:00:00Z" : null,
      ],
    );
  }
  const query = async (
    interval = "day",
    start = "2026-02-28",
    end = "2026-03-03",
  ) =>
    (
      await db.query(
        "select * from public.get_user_growth_time_series($1::date, $2::date, $3::text)",
        [start, end, interval],
      )
    ).rows.map((row) => ({
      ...row,
      period_start: row.period_start.toISOString().slice(0, 10),
      period_end: row.period_end.toISOString().slice(0, 10),
    }));
  const counts = (rows) => rows.map((row) => Number(row.new_users));
  await asAdmin(1);

  await t.test(
    "inclusive WIB boundaries and acquisition independent of current status",
    async () => {
      const rows = await query();
      assert.deepEqual(counts(rows), [2, 1, 1, 1]);
      assert.equal(rows[0].period_start, "2026-02-28");
      assert.equal(rows.at(-1).period_end, "2026-03-03");
      assert.deepEqual(
        counts(await query("day", "2026-03-02", "2026-03-02")),
        [1],
      );
    },
  );
  await t.test(
    "Monday weeks and calendar months clip partial periods without double counts",
    async () => {
      assert.deepEqual(await query("week"), [
        { period_start: "2026-02-28", period_end: "2026-03-01", new_users: 3 },
        { period_start: "2026-03-02", period_end: "2026-03-03", new_users: 2 },
      ]);
      assert.deepEqual(await query("month"), [
        { period_start: "2026-02-28", period_end: "2026-02-28", new_users: 2 },
        { period_start: "2026-03-01", period_end: "2026-03-03", new_users: 3 },
      ]);
      assert.deepEqual(
        counts(await query("month", "2025-12-31", "2026-01-01")),
        [0, 0],
      );
      assert.equal(
        (await query("day", "2025-03-04", "2026-03-04")).length,
        366,
      );
    },
  );
  await t.test(
    "empty days are zero; future timestamps within today are excluded",
    async () => {
      assert.deepEqual(
        counts(await query("day", "2026-02-24", "2026-02-26")),
        [0, 0, 0],
      );
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
      await db.exec("begin");
      await db.exec(`insert into public.users (microsaas_id, external_id, email, name, created_at)
      values ('${product(1)}', 'future', 'future@example.com', 'Future', now() + interval '1 second')`);
      await asAdmin(1);
      const today = (
        await db.query("select (now() at time zone 'Asia/Jakarta')::date as d")
      ).rows[0].d
        .toISOString()
        .slice(0, 10);
      assert.deepEqual(counts(await query("day", today, today)), [0]);
      await db.exec("commit");
    },
  );
  await t.test(
    "Operator counts only assignments, including no assignments",
    async () => {
      await asAdmin(2);
      assert.deepEqual(counts(await query()), [2, 1, 1, 0]);
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
      await db.exec(
        `delete from public.admin_assignments where admin_id = '${admin(2)}'`,
      );
      await asAdmin(2);
      assert.deepEqual(counts(await query()), [0, 0, 0, 0]);
    },
  );
  await t.test(
    "Finance, non-admin, inactive and anonymous cannot invoke RPC",
    async () => {
      for (const n of [3, 4, 5, null]) {
        await asAdmin(n);
        await assert.rejects(query(), (e) => e.code === "42501");
      }
      await db.exec("reset role; set role anon");
      await assert.rejects(query(), (e) => e.code === "42501");
    },
  );
  await t.test(
    "RPC rejects null, reversed, oversized, future ranges and invalid intervals",
    async () => {
      await asAdmin(1);
      for (const args of [
        ["day", null, null],
        ["day", "2026-03-03", "2026-03-02"],
        ["day", "2025-01-01", "2026-03-03"],
        ["day", "2999-01-01", "2999-01-01"],
        [null],
        ["year"],
        ["week'); drop table users; --"],
      ])
        await assert.rejects(query(...args), (e) => e.code === "22023");
    },
  );
});
