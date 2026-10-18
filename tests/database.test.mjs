import assert from "node:assert/strict";
import { test } from "node:test";
import { createDatabase, seed } from "./helpers/database.mjs";

test("foundation migration, seed, constraints, and RLS", async (t) => {
  const db = await createDatabase();
  t.after(() => db.close());
  const product = (n) => `10000000-0000-4000-8000-00000000000${n}`;
  const admin = (n) => `f0000000-0000-4000-8000-00000000000${n}`;
  const count = async (table) =>
    Number(
      (await db.query(`select count(*) as count from public.${table}`)).rows[0]
        .count,
    );
  const asAdmin = async (n) => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
      n ? admin(n) : "",
    ]);
    await db.exec("set role authenticated");
  };
  const denied = async (sql, code = "42501") =>
    assert.rejects(db.exec(sql), (error) => error.code === code);

  await t.test(
    "seed is repeatable and all public tables have RLS",
    async () => {
      await db.exec(await seed());
      await db.exec(await seed());
      assert.equal(await count("microsaas"), 3);
      assert.equal(await count("users"), 50);
      assert.equal(await count("subscriptions"), 50);
      assert.equal(await count("transactions"), 50);
      assert.equal(await count("invoices"), 50);
      assert.equal(await count("performance_metrics"), 90);
      assert.equal(await count("admin_users"), 0);
      const result =
        await db.query(`select relname from pg_class join pg_namespace n on n.oid = relnamespace
      where n.nspname = 'public' and relkind = 'r' and not relrowsecurity`);
      assert.deepEqual(result.rows, []);
      await db.exec(`
      insert into auth.users values ('${admin(1)}'), ('${admin(2)}'), ('${admin(3)}'), ('${admin(4)}');
      insert into public.admin_users (id, role_id, name) values
        ('${admin(1)}', 'super_admin', 'Super'), ('${admin(2)}', 'operator_admin', 'Operator'),
        ('${admin(3)}', 'finance_admin', 'Finance');
      insert into public.admin_assignments (admin_id, microsaas_id) values ('${admin(2)}', '${product(1)}');
      insert into private.payment_gateway_secrets (gateway_id, credentials_encrypted)
      values ('40000000-0000-4000-8000-000000000001', 'synthetic-ciphertext');
    `);
    },
  );

  await t.test(
    "anonymous and authenticated non-admin cannot read data",
    async () => {
      await db.exec("set role anon");
      await denied("select * from public.users");
      await asAdmin(4);
      assert.equal(await count("users"), 0);
      assert.equal(await count("microsaas"), 0);
      await denied(
        `insert into public.admin_users (id, role_id, name) values ('${admin(4)}', 'super_admin', 'Impostor')`,
      );
    },
  );

  await t.test(
    "operator reads assigned scope and cannot escalate or move records",
    async () => {
      await asAdmin(2);
      assert.equal(await count("microsaas"), 1);
      assert.equal(await count("users"), 17);
      assert.equal(await count("subscriptions"), 17);
      assert.equal(await count("transactions"), 17);
      assert.equal(await count("invoices"), 17);
      assert.equal(await count("performance_metrics"), 30);
      assert.equal(await count("plans"), 3);
      assert.equal(await count("payment_gateways"), 0);
      assert.equal(await count("admin_users"), 1);
      assert.equal(
        (
          await db.query(
            "update public.admin_users set role_id = 'super_admin' returning id",
          )
        ).rows.length,
        0,
      );
      await denied(
        `insert into public.admin_assignments (admin_id, microsaas_id) values ('${admin(2)}', '${product(2)}')`,
      );
      await denied("select * from private.payment_gateway_secrets");
      assert.equal(
        (
          await db.query(
            `update public.users set name = 'Forbidden' where microsaas_id = '${product(2)}' returning id`,
          )
        ).rows.length,
        0,
      );
      assert.equal(
        (
          await db.query(
            `delete from public.users where microsaas_id = '${product(1)}' returning id`,
          )
        ).rows.length,
        0,
      );
      await denied(
        `update public.users set microsaas_id = '${product(2)}' where microsaas_id = '${product(1)}'`,
      );
      await db.exec(
        "update public.users set status = 'banned' where id = '30000000-0000-4000-8000-000000000001'",
      );
      await db.exec(
        "update public.subscriptions set status = 'canceled' where id = '50000000-0000-4000-8000-000000000001'",
      );
      assert.equal(await count("audit_logs"), 2);
      await denied(
        "insert into public.audit_logs (action, resource_type, resource_id) values ('fake', 'users', 'fake')",
      );
      await db.exec("reset role");
      await db.exec(
        `insert into public.admin_assignments (admin_id, microsaas_id) values ('${admin(2)}', '${product(2)}')`,
      );
      await asAdmin(2);
      await denied(
        `update public.users set microsaas_id = '${product(2)}' where id = '30000000-0000-4000-8000-000000000001'`,
      );
    },
  );

  await t.test(
    "finance can read revenue and metadata, but cannot mutate or read secrets/PII",
    async () => {
      await asAdmin(3);
      for (const table of [
        "subscriptions",
        "transactions",
        "invoices",
        "plans",
        "plan_microsaas",
        "payment_gateways",
        "microsaas",
      ]) {
        assert.ok(await count(table), table);
        const result = await db.query(
          `delete from public.${table} returning *`,
        );
        assert.equal(result.rows.length, 0, table);
      }
      for (const table of ["subscriptions", "transactions", "invoices"]) {
        assert.equal(
          (
            await db.query(
              `update public.${table} set status = status returning id`,
            )
          ).rows.length,
          0,
          table,
        );
      }
      assert.equal(
        (await db.query("update public.plans set price = 0 returning id")).rows
          .length,
        0,
      );
      assert.equal(
        (
          await db.query(
            "update public.payment_gateways set is_active = true returning id",
          )
        ).rows.length,
        0,
      );
      await denied(
        "insert into public.plans (name, price, interval) values ('Forbidden', 0, 'monthly')",
      );
      assert.equal(await count("users"), 0);
      assert.equal(await count("audit_logs"), 0);
      assert.equal(await count("performance_metrics"), 0);
      await denied("select * from private.payment_gateway_secrets");
    },
  );

  await t.test(
    "super admin mutations are audited; audit is immutable even to DB owner",
    async () => {
      await asAdmin(1);
      assert.equal(await count("users"), 50);
      const before = await count("audit_logs");
      await db.exec(
        "update public.microsaas set name = 'InvoiceFlow Updated' where slug = 'invoiceflow'",
      );
      assert.equal(await count("audit_logs"), before + 1);
      const log = (
        await db.query(
          "select * from public.audit_logs where resource_type = 'microsaas' and action = 'update'",
        )
      ).rows[0];
      assert.equal(log.admin_id, admin(1));
      assert.equal(log.metadata.after.name, "InvoiceFlow Updated");
      await denied("update public.audit_logs set action = 'forged'");
      await denied("delete from public.audit_logs");
      await denied("truncate public.audit_logs");
      await db.exec("reset role");
      await denied("update public.audit_logs set action = 'forged'");
      await denied("delete from public.audit_logs");
      await denied("truncate public.audit_logs");
      await db.exec("set role service_role");
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
      await db.exec(
        "update public.users set name = 'Ingested User' where id = '30000000-0000-4000-8000-000000000001'",
      );
      await denied("update public.audit_logs set action = 'forged'");
      await denied("delete from public.audit_logs");
      await db.exec("reset role");
    },
  );

  await t.test(
    "composite FKs reject cross-product records and invalid billing values",
    async () => {
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
      await denied(
        `update public.subscriptions set user_id = '30000000-0000-4000-8000-000000000002'
      where id = '50000000-0000-4000-8000-000000000001'`,
        "23503",
      );
      await denied(
        `update public.transactions set subscription_id = '50000000-0000-4000-8000-000000000002'
      where id = '60000000-0000-4000-8000-000000000001'`,
        "23503",
      );
      await denied("update public.plans set price = -1", "23514");
      await denied(
        "update public.promo_codes set discount_value = 101",
        "23514",
      );
      await denied(
        "update public.subscriptions set current_period_end = current_period_start",
        "23514",
      );
      await denied("update public.users set status = 'deleted'", "23514");
    },
  );

  await t.test(
    "revoked admin loses access immediately, independent of JWT role claims",
    async () => {
      await db.exec(
        `update public.admin_users set is_active = false where id = '${admin(2)}'`,
      );
      await asAdmin(2);
      assert.equal(await count("users"), 0);
      assert.equal(await count("microsaas"), 0);
      assert.equal(await count("plans"), 0);
      assert.equal(await count("admin_assignments"), 0);
    },
  );
});
