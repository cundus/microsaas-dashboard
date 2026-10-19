import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";
import { createDatabase, seed } from "./helpers/database.mjs";

const source = await readFile(
  new URL("../modules/dashboard/kpis.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
});
const { percentageChange, formatKPI } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("percentage delta handles growth, decline, rounding and zero baselines", () => {
  assert.equal(percentageChange(150, 100), 50);
  assert.equal(percentageChange(0, 100), -100);
  assert.equal(percentageChange(1, 3), -66.7);
  assert.equal(percentageChange(0, 0), 0);
  assert.equal(percentageChange(10, 0), undefined);
  assert.match(formatKPI(1200, "IDR"), /1\.200/);
  assert.equal(formatKPI(1200, null), "1.200");
});

test("currency precision is explicit so Node and browser ICU defaults cannot change markup", () => {
  assert.equal(formatKPI(0, "IDR"), "Rp\u00a00,00");
  assert.equal(formatKPI(1200.5, "IDR"), "Rp\u00a01.200,50");
  assert.equal(formatKPI(1, "USD"), "US$1,00");
  assert.equal(formatKPI(1200, null), "1.200");
});

test("KPI aggregation, historical changes, currencies and authorization", async (t) => {
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
  const kpis = async () =>
    (await db.query("select * from public.get_global_kpis()")).rows;
  const row = (rows, metric, currency = null) =>
    rows.find((r) => r.metric === metric && r.currency === currency);

  await db.exec(`
    insert into auth.users values ('${admin(1)}'), ('${admin(2)}'), ('${admin(3)}'), ('${admin(4)}');
    insert into public.admin_users (id, role_id, name) values
      ('${admin(1)}', 'super_admin', 'Super'), ('${admin(2)}', 'operator_admin', 'Operator'),
      ('${admin(3)}', 'finance_admin', 'Finance');
    insert into public.admin_assignments (admin_id, microsaas_id) values ('${admin(2)}', '${product(1)}');
    update public.microsaas set created_at = now() - interval '60 days';
    update public.users set created_at = now() - interval '60 days';
    update public.subscriptions set created_at = now() - interval '60 days';
  `);

  await t.test(
    "monthly/yearly MRR and ARR use active subscriptions only",
    async () => {
      await asAdmin(1);
      const result = await kpis();
      assert.equal(Number(row(result, "users").value), 50);
      assert.equal(Number(row(result, "microsaas").previous), 3);
      const expected = (
        await db.query(
          "select sum(price / case when billing_interval = 'yearly' then 12 else 1 end) as mrr, count(*) as active from public.subscriptions where status = 'active'",
        )
      ).rows[0];
      assert.equal(
        Number(row(result, "mrr", "IDR").value),
        Number(expected.mrr),
      );
      assert.equal(
        Number(row(result, "arr", "IDR").value),
        Number(expected.mrr) * 12,
      );
      assert.equal(
        Number(row(result, "subscriptions").value),
        Number(expected.active),
      );
    },
  );

  await t.test(
    "before-images preserve canceled subscriptions, price changes, soft deletes and deleted products",
    async () => {
      const before = await kpis();
      await db.exec(
        "update public.subscriptions set status = 'canceled', canceled_at = now() where id = '50000000-0000-4000-8000-000000000001'",
      );
      await db.exec(
        "begin; update public.subscriptions set price = price + 120000 where id = '50000000-0000-4000-8000-000000000002'; update public.subscriptions set price = price + 1 where id = '50000000-0000-4000-8000-000000000002'; commit;",
      );
      await db.exec(
        "update public.users set status = 'deleted', deleted_at = now() where id = '30000000-0000-4000-8000-000000000001'",
      );
      const after = await kpis();
      assert.equal(Number(row(after, "users").value), 49);
      assert.equal(Number(row(after, "users").previous), 50);
      assert.equal(
        Number(row(after, "subscriptions").previous),
        Number(row(before, "subscriptions").value),
      );
      assert.equal(
        Number(row(after, "mrr", "IDR").previous),
        Number(row(before, "mrr", "IDR").value),
      );
      await db.exec(
        `insert into public.microsaas (name, slug, url, created_at) values ('Removed', 'removed', 'https://example.com', now() - interval '60 days')`,
      );
      // Imported historical entities have no insertion event in dashboard history.
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
      await db.exec(
        "insert into public.microsaas (name, slug, url, created_at) values ('Historical', 'historical', 'https://example.com', now() - interval '60 days')",
      );
      await asAdmin(1);
      await db.exec(
        "select public.delete_microsaas(id, name) from public.microsaas where slug = 'historical'",
      );
      assert.equal(Number(row(await kpis(), "microsaas").previous), 4);
    },
  );

  await t.test(
    "currencies stay separate and new entities do not inflate the past",
    async () => {
      await db.exec(
        "update public.subscriptions set currency = 'USD', price = 120 where id = '50000000-0000-4000-8000-000000000003'",
      );
      const result = await kpis();
      assert.equal(Number(row(result, "mrr", "USD").value), 10);
      assert.equal(Number(row(result, "mrr", "USD").previous), 0);
      assert.equal(Number(row(result, "arr", "USD").value), 120);
      assert.equal(Number(row(result, "microsaas").value), 4);
    },
  );

  await t.test(
    "operator scope and Finance user-count restriction hold at RPC boundary",
    async () => {
      await asAdmin(2);
      let result = await kpis();
      assert.equal(Number(row(result, "microsaas").value), 1);
      assert.equal(Number(row(result, "users").value), 16);
      assert.equal(row(result, "mrr", "USD"), undefined);
      await asAdmin(3);
      result = await kpis();
      assert.equal(row(result, "users").value, null);
      assert.equal(row(result, "users").previous, null);
      assert.ok(row(result, "mrr", "USD"));
    },
  );

  await t.test(
    "anonymous, non-admin and revoked admins are denied",
    async () => {
      await db.exec("reset role; set role anon");
      await assert.rejects(kpis(), (e) => e.code === "42501");
      await asAdmin(4);
      await assert.rejects(kpis(), (e) => e.code === "42501");
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
      await db.exec(
        `update public.admin_users set is_active = false where id = '${admin(2)}'`,
      );
      await asAdmin(2);
      await assert.rejects(kpis(), (e) => e.code === "42501");
    },
  );

  await t.test("empty accessible scope yields five zero metrics", async () => {
    await db.exec("reset role");
    await db.exec(
      `update public.admin_users set is_active = true where id = '${admin(2)}'; delete from public.admin_assignments where admin_id = '${admin(2)}'`,
    );
    await asAdmin(2);
    const result = await kpis();
    assert.equal(result.length, 5);
    assert.ok(
      result.every((r) => Number(r.value) === 0 && Number(r.previous) === 0),
    );
  });
});
