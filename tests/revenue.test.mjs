import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";
import { createDatabase, seed } from "./helpers/database.mjs";

const source = await readFile(
  new URL("../modules/dashboard/revenue.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { jakartaToday, presetRange, validRevenueRange, revenueChartData } =
  await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );

test("Jakarta dates, inclusive presets and server range validation", () => {
  assert.equal(jakartaToday(new Date("2026-10-18T18:00:00Z")), "2026-10-19");
  assert.deepEqual(presetRange(7, "2026-03-03"), {
    start: "2026-02-25",
    end: "2026-03-03",
  });
  assert.equal(
    validRevenueRange({ start: "2026-02-30", end: "2026-03-03" }, "2026-10-19"),
    false,
  );
  assert.equal(
    validRevenueRange({ start: "2026-03-04", end: "2026-03-03" }),
    false,
  );
  assert.equal(validRevenueRange(null), false);
  assert.equal(
    validRevenueRange({ start: "2026-01-01", end: "2027-01-02" }, "2027-02-01"),
    false,
  );
  assert.equal(
    validRevenueRange({ start: "2026-10-20", end: "2026-10-20" }, "2026-10-19"),
    false,
  );
  assert.equal(
    validRevenueRange(presetRange(366, "2026-10-19"), "2026-10-19"),
    true,
  );
});

test("chart groups by stable product ID, sorts days and separates currencies", () => {
  const result = revenueChartData(
    [
      {
        day: "2026-10-19",
        microsaas_id: "a",
        name: "Same",
        currency: "IDR",
        mrr: 0,
      },
      {
        day: "2026-10-18",
        microsaas_id: "a",
        name: "Same",
        currency: "IDR",
        mrr: 120,
      },
      {
        day: "2026-10-18",
        microsaas_id: "b",
        name: "Same",
        currency: "IDR",
        mrr: 240,
      },
      {
        day: "2026-10-18",
        microsaas_id: "a",
        name: "Same",
        currency: "USD",
        mrr: 10,
      },
    ],
    "IDR",
  );
  assert.equal(result.products.length, 2);
  assert.deepEqual(result.points, [
    { day: "2026-10-18", a: 120, b: 240 },
    { day: "2026-10-19", a: 0 },
  ]);
});

test("daily MRR, historical reconstruction and RPC authorization", async (t) => {
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
    insert into auth.users values ('${admin(1)}'), ('${admin(2)}'), ('${admin(3)}'), ('${admin(4)}');
    insert into public.admin_users (id, role_id, name) values
      ('${admin(1)}', 'super_admin', 'Super'), ('${admin(2)}', 'operator_admin', 'Operator'), ('${admin(3)}', 'finance_admin', 'Finance');
    insert into public.admin_assignments (admin_id, microsaas_id) values ('${admin(2)}', '${product(1)}');
    update public.microsaas set created_at = now() - interval '400 days';
    update public.subscriptions set created_at = now() - interval '400 days';
  `);
  const query = async (days = 7) =>
    (
      await db.query(
        `select * from public.get_revenue_time_series((now() at time zone 'Asia/Jakarta')::date - $1::int + 1, (now() at time zone 'Asia/Jakarta')::date)`,
        [days],
      )
    ).rows;
  const total = (rows, day, currency = "IDR") =>
    rows
      .filter((r) => String(r.day) === String(day) && r.currency === currency)
      .reduce((sum, r) => sum + Number(r.mrr), 0);
  let baseline;
  await t.test(
    "dense 7/30/90 day series, annual normalization and inactive exclusion",
    async () => {
      await asAdmin(1);
      baseline = await query();
      assert.equal(baseline.length, 21);
      const expected = Number(
        (
          await db.query(
            "select sum(price / case when billing_interval = 'yearly' then 12 else 1 end) as mrr from public.subscriptions where status = 'active'",
          )
        ).rows[0].mrr,
      );
      assert.equal(total(baseline, baseline[0].day), expected);
      assert.equal((await query(30)).length, 90);
      assert.equal((await query(90)).length, 270);
    },
  );
  await t.test(
    "cancellation, ordered price changes and currency changes preserve previous days",
    async () => {
      await db.exec(
        "begin; update public.subscriptions set price = price + 120000 where id = '50000000-0000-4000-8000-000000000002'; update public.subscriptions set price = price + 1 where id = '50000000-0000-4000-8000-000000000002'; commit;",
      );
      await db.exec(
        "update public.subscriptions set status = 'canceled' where id = '50000000-0000-4000-8000-000000000001'; update public.subscriptions set currency = 'USD', price = 120 where id = '50000000-0000-4000-8000-000000000003'",
      );
      const rows = await query();
      assert.equal(total(rows, rows[0].day), total(baseline, baseline[0].day));
      assert.equal(total(rows, rows[0].day, "USD"), 0);
      assert.equal(total(rows, rows.at(-1).day, "USD"), 10);
    },
  );
  await t.test(
    "new products have zeros in the past and no-revenue products get dense zero series",
    async () => {
      await db.exec(
        "insert into public.microsaas (name, slug, url) values ('New', 'new', 'https://example.com')",
      );
      const rows = (await query()).filter((r) => r.name === "New");
      assert.equal(rows.length, 7);
      assert.ok(rows.every((r) => Number(r.mrr) === 0));
    },
  );
  await t.test(
    "deleted subscription before-image remains in previous days",
    async () => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
      await db.exec(`insert into public.subscriptions (id, microsaas_id, user_id, plan_id, external_id, status, billing_interval, price, currency, current_period_start, current_period_end, created_at)
      select '50000000-0000-4000-8000-000000000099', microsaas_id, user_id, plan_id, 'deletable', 'active', billing_interval, price, currency, current_period_start, current_period_end, created_at
      from public.subscriptions where id = '50000000-0000-4000-8000-000000000002'`);
      await asAdmin(1);
      const before = await query();
      await db.exec(
        "delete from public.subscriptions where id = '50000000-0000-4000-8000-000000000099'",
      );
      const after = await query();
      assert.equal(total(after, after[0].day), total(before, before[0].day));
      assert.ok(
        total(after, after.at(-1).day) < total(before, before.at(-1).day),
      );
    },
  );
  await t.test(
    "Operator scope, Finance access and empty assignments",
    async () => {
      await asAdmin(2);
      assert.ok((await query()).every((r) => r.microsaas_id === product(1)));
      await asAdmin(3);
      assert.ok((await query()).some((r) => r.currency === "USD"));
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
      await db.exec(
        `delete from public.admin_assignments where admin_id = '${admin(2)}'`,
      );
      await asAdmin(2);
      assert.deepEqual(await query(), []);
    },
  );
  await t.test(
    "day boundary follows WIB and deleted products remain in history",
    async () => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
      await db.exec(`
      insert into public.subscriptions (id, microsaas_id, user_id, plan_id, external_id, status, billing_interval, price, currency, current_period_start, current_period_end, created_at)
      select '50000000-0000-4000-8000-000000000098', microsaas_id, user_id, plan_id, 'boundary', 'active', 'monthly', 1000, 'JPY', current_period_start, current_period_end, created_at
      from public.subscriptions where id = '50000000-0000-4000-8000-000000000002';
      insert into public.audit_logs (admin_id, microsaas_id, action, resource_type, resource_id, metadata, created_at)
      select '${admin(1)}', microsaas_id, 'update', 'subscriptions', id::text, jsonb_build_object('before', to_jsonb(s)),
        (((now() at time zone 'Asia/Jakarta')::date - 2)::timestamp at time zone 'Asia/Jakarta') + interval '30 minutes'
      from public.subscriptions s where external_id = 'boundary';
      update public.subscriptions set price = 0 where external_id = 'boundary';
      insert into public.microsaas (name, slug, url, created_at) values ('Deleted', 'deleted', 'https://example.com', now() - interval '400 days');
    `);
      await asAdmin(1);
      await db.exec(
        "select public.delete_microsaas(id, name) from public.microsaas where slug = 'deleted'",
      );
      const rows = await query();
      const dates = [...new Set(rows.map((r) => String(r.day)))];
      assert.equal(total(rows, dates.at(-4), "JPY"), 1000);
      assert.equal(total(rows, dates.at(-3), "JPY"), 0);
      assert.equal(rows.filter((r) => r.name === "Deleted").length, 7);
    },
  );
  await t.test(
    "SQL rejects invalid ranges, anonymous, non-admin and inactive accounts",
    async () => {
      await asAdmin(1);
      await assert.rejects(query(367), (e) => e.code === "22023");
      await assert.rejects(query(0), (e) => e.code === "22023");
      await assert.rejects(
        db.query("select * from public.get_revenue_time_series(null, null)"),
        (e) => e.code === "22023",
      );
      await assert.rejects(
        db.query(
          "select * from public.get_revenue_time_series(current_date, current_date + 2)",
        ),
        (e) => e.code === "22023",
      );
      await asAdmin(4);
      await assert.rejects(query(), (e) => e.code === "42501");
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
      await db.exec(
        `update public.admin_users set is_active = false where id = '${admin(2)}'`,
      );
      await asAdmin(2);
      await assert.rejects(query(), (e) => e.code === "42501");
      await db.exec("reset role; set role anon");
      await assert.rejects(query(), (e) => e.code === "42501");
    },
  );
});
