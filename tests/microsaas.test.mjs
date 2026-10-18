import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";
import { createDatabase, seed } from "./helpers/database.mjs";

const source = await readFile(
  new URL("../modules/dashboard/microsaas.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { getHealth, groupMicroSaaS, safeLogoUrl } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("health boundaries, stale/missing samples and safe logo URLs", () => {
  const now = Date.now();
  const at = (minutes = 0) => new Date(now - minutes * 60000).toISOString();
  assert.equal(getHealth(99.5, at(), now), "Healthy");
  assert.equal(getHealth(99.49, at(), now), "Degraded");
  assert.equal(getHealth(0, at(), now), "Down");
  assert.equal(getHealth(100, at(15), now), "Healthy");
  assert.equal(getHealth(100, at(16), now), "Unknown");
  assert.equal(getHealth(100, at(-1), now), "Unknown");
  assert.equal(getHealth(null, null, now), "Unknown");
  assert.equal(getHealth(100, "invalid", now), "Unknown");
  assert.equal(safeLogoUrl("javascript:alert(1)"), undefined);
  assert.equal(safeLogoUrl("data:image/svg+xml,test"), undefined);
  assert.equal(safeLogoUrl(null), undefined);
  assert.equal(
    safeLogoUrl("https://example.com/logo.png"),
    "https://example.com/logo.png",
  );
  const products = groupMicroSaaS([
    { id: "one", currency: "IDR", mrr: 100 },
    { id: "one", currency: "USD", mrr: 5 },
    { id: "two", currency: "IDR", mrr: 0 },
  ]);
  assert.equal(products.length, 2);
  assert.deepEqual(products[0].revenue, [
    { currency: "IDR", mrr: 100 },
    { currency: "USD", mrr: 5 },
  ]);
});

test("product aggregation and RLS authorization", async (t) => {
  const db = await createDatabase();
  t.after(() => db.close());
  await db.exec(await seed());
  const admin = (n) => `f0000000-0000-4000-8000-00000000000${n}`;
  const product = (n) => `10000000-0000-4000-8000-00000000000${n}`;
  async function asAdmin(n) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
      n ? admin(n) : "",
    ]);
    await db.exec("set role authenticated");
  }
  const list = async (slug = null) =>
    (await db.query("select * from public.get_microsaas_list($1)", [slug]))
      .rows;
  await db.exec(`
    insert into auth.users values ('${admin(1)}'), ('${admin(2)}'), ('${admin(3)}'), ('${admin(4)}');
    insert into public.admin_users (id, role_id, name) values
      ('${admin(1)}', 'super_admin', 'Super'), ('${admin(2)}', 'operator_admin', 'Operator'), ('${admin(3)}', 'finance_admin', 'Finance');
    insert into public.admin_assignments (admin_id, microsaas_id) values ('${admin(2)}', '${product(1)}');
    delete from public.performance_metrics;
    insert into public.performance_metrics (microsaas_id, uptime_percent, recorded_at, endpoint) values
      ('${product(1)}', 100, now() - interval '1 day', '/'),
      ('${product(1)}', 0, now() - interval '1 minute', '/'),
      ('${product(1)}', 0, now() - interval '31 days', '/'),
      ('${product(1)}', 0, now(), '/other'),
      ('${product(1)}', 100, now() + interval '1 day', '/');
    update public.users set status = 'deleted', deleted_at = now() where id = '30000000-0000-4000-8000-000000000001';
    update public.subscriptions set currency = 'USD', price = 120, billing_interval = 'yearly', status = 'active' where id = '50000000-0000-4000-8000-000000000003';
    insert into public.microsaas (name, slug, url, status) values ('Empty', 'empty-product', 'https://example.com', 'inactive');
  `);
  await t.test(
    "counts, currency separation, yearly MRR, uptime window and no-data product",
    async () => {
      await asAdmin(1);
      const rows = await list();
      assert.equal(new Set(rows.map((r) => r.id)).size, 4);
      for (const row of rows) {
        const expectedUsers = (
          await db.query(
            "select count(*) as n from public.users where microsaas_id = $1 and status <> 'deleted'",
            [row.id],
          )
        ).rows[0];
        assert.equal(Number(row.user_count), Number(expectedUsers.n));
        const expectedMRR = (
          await db.query(
            "select coalesce(sum(price / case when billing_interval = 'yearly' then 12 else 1 end), 0) as n from public.subscriptions where microsaas_id = $1 and currency = $2 and status = 'active'",
            [row.id, row.currency],
          )
        ).rows[0];
        assert.equal(Number(row.mrr), Number(expectedMRR.n));
      }
      assert.equal(Number(rows.find((r) => r.currency === "USD").mrr), 10);
      const first = rows.find((r) => r.id === product(1));
      assert.equal(Number(first.uptime_percent), 50);
      assert.equal(Number(first.latest_uptime_percent), 0);
      const empty = (await list("empty-product"))[0];
      assert.equal(Number(empty.user_count), 0);
      assert.equal(Number(empty.mrr), 0);
      assert.equal(empty.uptime_percent, null);
      assert.equal(empty.checked_at, null);
      assert.equal(empty.status, "inactive");
      assert.deepEqual(await list("unknown-product"), []);
    },
  );
  await t.test(
    "operator only receives assigned products, including direct slug requests",
    async () => {
      await asAdmin(2);
      const rows = await list();
      assert.ok(rows.length > 0);
      assert.ok(rows.every((r) => r.id === product(1)));
      assert.deepEqual(await list("empty-product"), []);
      await db.exec("reset role");
      await db.exec(
        `delete from public.admin_assignments where admin_id = '${admin(2)}'`,
      );
      await asAdmin(2);
      assert.deepEqual(await list(), []);
    },
  );
  await t.test(
    "Finance sees revenue but receives no user or performance data",
    async () => {
      await asAdmin(3);
      const rows = await list();
      assert.equal(new Set(rows.map((r) => r.id)).size, 4);
      assert.ok(
        rows.every(
          (r) =>
            r.user_count === null &&
            r.uptime_percent === null &&
            r.latest_uptime_percent === null &&
            r.checked_at === null,
        ),
      );
      assert.equal(Number(rows.find((r) => r.currency === "USD").mrr), 10);
    },
  );
  await t.test(
    "non-admin, inactive admin and anonymous callers are rejected",
    async () => {
      await asAdmin(4);
      await assert.rejects(list(), /Active admin required/);
      await asAdmin(1);
      await db.exec(
        `update public.admin_users set is_active = false where id = '${admin(2)}'`,
      );
      await asAdmin(2);
      await assert.rejects(list(), /Active admin required/);
      await db.exec("reset role; set role anon");
      await assert.rejects(list(), /permission denied/);
    },
  );
  await t.test("empty database returns an empty list", async () => {
    const empty = await createDatabase();
    try {
      await empty.exec(
        `insert into auth.users values ('${admin(1)}'); insert into public.admin_users (id, role_id, name) values ('${admin(1)}', 'super_admin', 'Super');`,
      );
      await empty.query(
        "select set_config('request.jwt.claim.sub', $1, false)",
        [admin(1)],
      );
      await empty.exec("set role authenticated");
      assert.deepEqual(
        (await empty.query("select * from public.get_microsaas_list()")).rows,
        [],
      );
    } finally {
      await empty.close();
    }
  });
});
