import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";
import { createDatabase, seed } from "./helpers/database.mjs";

const { outputText } = ts.transpileModule(
  await readFile(
    new URL("../modules/dashboard/activity.ts", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
);
const { activityLink } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("activity links use existing routes and encode resource filters", () => {
  const item = {
    microsaas_id: "product",
    resource_id: "a&b",
    product_slug: "demo/path",
  };
  assert.equal(
    activityLink({ ...item, kind: "signup" }),
    "/users?microsaas=product&user=a%26b",
  );
  for (const kind of ["upgrade", "churn"])
    assert.equal(
      activityLink({ ...item, kind }),
      "/subscriptions?microsaas=product&subscription=a%26b",
    );
  assert.equal(
    activityLink({ ...item, kind: "error_spike" }),
    "/performance?microsaas=product&metric=a%26b",
  );
  assert.equal(
    activityLink({ ...item, kind: "admin" }),
    "/microsaas/demo%2Fpath",
  );
});

test("activity projection, historical backfill, permissions and publication", async (t) => {
  const admin = (n) => `f0000000-0000-4000-8000-00000000000${n}`;
  const product = (n) => `10000000-0000-4000-8000-00000000000${n}`;
  const subscription = (n) => `50000000-0000-4000-8000-00000000000${n}`;
  const db = await createDatabase({
    beforeMigration: async (db, name) => {
      if (name !== "20261019000400_activity_feed.sql") return;
      await db.exec(await seed());
      await db.exec(`insert into auth.users values ('${admin(1)}'), ('${admin(2)}'), ('${admin(3)}'), ('${admin(4)}'), ('${admin(5)}');
      insert into public.admin_users (id, role_id, name) values
      ('${admin(1)}', 'super_admin', 'Super'), ('${admin(2)}', 'operator_admin', 'Operator'),
      ('${admin(3)}', 'finance_admin', 'Finance'), ('${admin(5)}', 'operator_admin', 'Inactive');
      update public.admin_users set is_active = false where id = '${admin(5)}';
      insert into public.admin_assignments (admin_id, microsaas_id) values ('${admin(2)}', '${product(1)}');
      select set_config('request.jwt.claim.sub', '${admin(1)}', false);
      update public.subscriptions set price = price * 2 where id = '${subscription(1)}';
      select set_config('request.jwt.claim.sub', '', false);
    `);
    },
  });
  t.after(() => db.close());
  const asAdmin = async (n) => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
      n ? admin(n) : "",
    ]);
    await db.exec("set role authenticated");
  };
  const activity = async (limit = 100) =>
    (
      await db.query("select * from public.get_recent_activity($1::int)", [
        limit,
      ])
    ).rows;
  const count = async (kind, resource) =>
    Number(
      (
        await db.query(
          "select count(*) as n from public.dashboard_activity where kind = $1 and resource_id = $2",
          [kind, resource],
        )
      ).rows[0].n,
    );
  await asAdmin(1);
  await t.test(
    "backfills signups, churn and historical upgrades once, newest first",
    async () => {
      const rows = await activity();
      assert.equal(rows.filter((r) => r.kind === "signup").length, 50);
      assert.equal(rows.filter((r) => r.kind === "churn").length, 5);
      assert.equal(rows.filter((r) => r.kind === "upgrade").length, 1);
      assert.equal((await activity(1)).length, 1);
      for (let i = 1; i < rows.length; i++)
        assert.ok(rows[i - 1].occurred_at >= rows[i].occurred_at);
      assert.deepEqual(
        Object.keys(rows[0]).sort(),
        [
          "id",
          "microsaas_id",
          "product_name",
          "product_slug",
          "kind",
          "resource_id",
          "description",
          "occurred_at",
        ].sort(),
      );
      assert.ok(!JSON.stringify(rows).includes("@example.com"));
    },
  );
  await t.test(
    "new signup is projected once despite its admin audit record",
    async () => {
      await db.exec(
        `insert into public.users (microsaas_id, external_id, email, name) values ('${product(1)}', 'activity-new', 'private@example.com', 'Private name')`,
      );
      const id = (
        await db.query(
          "select id from public.users where external_id = 'activity-new'",
        )
      ).rows[0].id;
      assert.equal(await count("signup", id), 1);
      assert.ok(
        !(await activity()).some((r) => r.description.includes("Private name")),
      );
    },
  );
  await t.test(
    "upgrade normalizes annual price, ignores downgrade/currency changes, churn only on transition",
    async () => {
      const id = subscription(1);
      await db.exec(
        `update public.subscriptions set billing_interval = 'yearly', price = price * 12 where id = '${id}'`,
      );
      assert.equal(await count("upgrade", id), 1);
      await db.exec(
        `update public.subscriptions set price = price / 2 where id = '${id}'`,
      );
      assert.equal(await count("upgrade", id), 1);
      await db.exec(
        `update public.subscriptions set currency = 'USD', price = price * 2 where id = '${id}'`,
      );
      assert.equal(await count("upgrade", id), 1);
      await db.exec(
        `update public.subscriptions set status = 'canceled', canceled_at = now() where id = '${id}'; update public.subscriptions set status = status where id = '${id}'`,
      );
      assert.equal(await count("churn", id), 1);
    },
  );
  await t.test(
    "integration changes without an admin JWT still produce business events",
    async () => {
      await db.exec(
        "reset role; select set_config('request.jwt.claim.sub', '', false)",
      );
      await db.exec(
        `update public.subscriptions set price = price + 1000 where id = '${subscription(2)}'`,
      );
      await asAdmin(1);
      assert.equal(await count("upgrade", subscription(2)), 1);
    },
  );
  await t.test(
    "error spikes require >=20 requests, crossing 5%, and recovery before another spike",
    async () => {
      await db.exec(
        "reset role; select set_config('request.jwt.claim.sub', '', false)",
      );
      for (const [i, [requests, errors]] of [
        [10, 1],
        [100, 4],
        [100, 5],
        [100, 20],
        [100, 0],
        [100, 6],
      ].entries()) {
        await db.query(
          `insert into public.performance_metrics (microsaas_id, endpoint, recorded_at, uptime_percent, request_count, error_count)
        values ($1, '/private?token=secret', now() - interval '10 minutes' + $2::int * interval '1 minute', 99, $3, $4)`,
          [product(1), i, requests, errors],
        );
      }
      await asAdmin(1);
      const spikes = (await activity()).filter((r) => r.kind === "error_spike");
      assert.equal(spikes.length, 2);
      assert.ok(spikes.every((r) => !r.description.includes("secret")));
    },
  );
  await t.test(
    "audit allowlist excludes raw metadata and duplicate user/subscription business events",
    async () => {
      await db.exec(
        `update public.payment_gateways set name = 'Secret gateway name' where microsaas_id = '${product(1)}'`,
      );
      const rows = (await activity()).filter((r) => r.kind === "admin");
      assert.equal(rows.length, 1);
      assert.equal(rows[0].description, "Admin: update payment_gateways");
      assert.ok(!JSON.stringify(rows).includes("Secret gateway name"));
    },
  );
  await t.test(
    "Operator assignment and Finance financial-only access protect both RPC and direct Realtime reads",
    async () => {
      await asAdmin(2);
      assert.ok((await activity()).every((r) => r.microsaas_id === product(1)));
      assert.ok(
        (await db.query("select * from public.dashboard_activity")).rows.every(
          (r) => r.microsaas_id === product(1),
        ),
      );
      await asAdmin(3);
      const rows = await activity();
      assert.ok(rows.length > 0);
      assert.ok(rows.every((r) => ["upgrade", "churn"].includes(r.kind)));
      assert.ok(
        (await db.query("select * from public.dashboard_activity")).rows.every(
          (r) => ["upgrade", "churn"].includes(r.kind),
        ),
      );
      await db.exec(
        "reset role; select set_config('request.jwt.claim.sub', '', false)",
      );
      await db.exec(
        `delete from public.admin_assignments where admin_id = '${admin(2)}'`,
      );
      await asAdmin(2);
      assert.deepEqual(await activity(), []);
    },
  );
  await t.test(
    "invalid limits, anonymous, non-admin and inactive admins rejected; events cannot be forged",
    async () => {
      await asAdmin(1);
      for (const limit of [null, 0, 101, -1])
        await assert.rejects(activity(limit), (e) => e.code === "22023");
      await assert.rejects(
        db.exec("update public.dashboard_activity set description = 'forged'"),
        (e) => e.code === "42501",
      );
      await assert.rejects(
        db.exec("delete from public.dashboard_activity"),
        (e) => e.code === "42501",
      );
      await assert.rejects(
        db.exec(
          `insert into public.dashboard_activity (source_key, microsaas_id, kind, resource_id, description, occurred_at) values ('fake', '${product(1)}', 'signup', 'fake', 'fake', now())`,
        ),
        (e) => e.code === "42501",
      );
      for (const n of [null, 4, 5]) {
        await asAdmin(n);
        await assert.rejects(activity(), (e) => e.code === "42501");
        assert.deepEqual(
          (await db.query("select * from public.dashboard_activity")).rows,
          [],
        );
      }
      await db.exec("reset role; set role anon");
      await assert.rejects(activity(), (e) => e.code === "42501");
      await assert.rejects(
        db.exec("select * from public.dashboard_activity"),
        (e) => e.code === "42501",
      );
    },
  );
  await t.test(
    "sanitized table is published for Postgres Changes",
    async () => {
      await db.exec("reset role");
      const rows = (
        await db.query(
          "select tablename from pg_publication_tables where pubname = 'supabase_realtime'",
        )
      ).rows;
      assert.ok(rows.some((r) => r.tablename === "dashboard_activity"));
    },
  );
});
