import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { createDatabase, seed } from "./helpers/database.mjs";

const user = (n) => `30000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const admin = (n) => `f0000000-0000-4000-8000-00000000000${n}`;

test("account mutations validate role, scope, state, confirmation and atomic audit", async (t) => {
  const db = await createDatabase();
  t.after(() => db.close());
  await db.exec(await seed());
  await db.exec(`
    insert into auth.users values ('${admin(1)}'),('${admin(2)}'),('${admin(3)}'),('${admin(4)}');
    insert into public.admin_users(id,role_id,name) values
      ('${admin(1)}','super_admin','Super'),('${admin(2)}','operator_admin','Operator'),
      ('${admin(3)}','finance_admin','Finance');
    insert into public.admin_assignments(admin_id,microsaas_id)
      values('${admin(2)}','10000000-0000-4000-8000-000000000001');
    update public.users set status='trial' where id='${user(1)}';
  `);
  const as = async (n) => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      n ? admin(n) : "",
    ]);
    await db.exec("set role authenticated");
  };
  const act = (id, action, reason = null, confirmation = null) =>
    db.query("select public.manage_user($1,$2,$3,$4) result", [
      id,
      action,
      reason,
      confirmation,
    ]);
  const denied = (promise, code) =>
    assert.rejects(promise, (e) => e.code === code);
  await as(2);
  const scoped = (
    await db.query("select id,email from public.users order by id")
  ).rows;
  assert.ok(scoped.some((u) => u.id === user(1)));
  const before = (await db.query("select count(*) n from public.audit_logs"))
    .rows[0].n;
  await denied(act(user(1), "ban", "  "), "22023");
  await denied(act(user(1), "ban", "x".repeat(501)), "22023");
  await denied(act(user(2), "ban", "reason"), "P0002");
  await denied(act(user(1), "delete", null, "wrong@example.test"), "22023");
  await denied(act(user(1), null), "22023");
  assert.equal(
    (await db.query("select count(*) n from public.audit_logs")).rows[0].n,
    before,
  );
  await act(user(1), "ban", "  Pelanggaran ketentuan  ");
  let row = (
    await db.query("select * from public.users where id=$1", [user(1)])
  ).rows[0];
  assert.equal(row.status, "banned");
  assert.equal(row.status_before_ban, "trial");
  assert.equal(row.ban_reason, "Pelanggaran ketentuan");
  const log = (
    await db.query(
      "select * from public.audit_logs where resource_id=$1 and action='update'",
      [user(1)],
    )
  ).rows[0];
  assert.equal(log.admin_id, admin(2));
  assert.equal(log.microsaas_id, row.microsaas_id);
  assert.equal(log.metadata.before.status, "trial");
  assert.equal(log.metadata.after.ban_reason, row.ban_reason);
  await denied(act(user(1), "ban", "repeat"), "22023");
  await act(user(1), "unban");
  row = (await db.query("select * from public.users where id=$1", [user(1)]))
    .rows[0];
  assert.equal(row.status, "trial");
  assert.equal(row.ban_reason, null);
  await denied(act(user(1), "unban"), "22023");

  const reset = (await act(user(1), "reset_password")).rows[0].result;
  assert.equal(reset.email, row.email);
  assert.match(reset.redirectTo, /^https?:\/\//);
  await denied(act(user(1), "reset_password"), "54000");
  await as(1);
  await denied(act(user(1), "reset_password"), "54000");
  await denied(
    db.exec(`delete from public.users where id='${user(1)}'`),
    "42501",
  );
  await act(user(2), "ban", "Super may access all products");
  await act(user(2), "unban");
  assert.equal(
    (await db.query("select status from public.users where id=$1", [user(2)]))
      .rows[0].status,
    "active",
  );
  await as(2);
  const transactions = (
    await db.query(
      "select count(*) n from public.transactions where user_id=$1",
      [user(1)],
    )
  ).rows[0].n;
  await act(user(1), "delete", null, row.email);
  row = (await db.query("select * from public.users where id=$1", [user(1)]))
    .rows[0];
  assert.equal(row.status, "deleted");
  assert.ok(row.deleted_at);
  assert.equal(
    (
      await db.query(
        "select count(*) n from public.transactions where user_id=$1",
        [user(1)],
      )
    ).rows[0].n,
    transactions,
  );
  for (const action of ["ban", "unban", "delete", "reset_password"])
    await denied(act(user(1), action, "reason", row.email), "P0002");
  for (const n of [3, 4, 0]) {
    await as(n);
    for (const action of ["ban", "unban", "delete", "reset_password"])
      await denied(act(user(2), action, "reason"), "42501");
  }
  await db.exec("reset role");
  await db.exec(
    `update public.admin_users set is_active=false where id='${admin(2)}'`,
  );
  await as(2);
  await denied(act(scoped[1].id, "ban", "reason"), "42501");
  await db.exec("reset role; set role anon");
  await denied(act(user(2), "ban", "reason"), "42501");
});

test("server actions reject invalid input, handle database/auth errors and isolate recovery from admin cookies", async () => {
  let role = "operator_admin",
    rpcError = null,
    authError = null,
    thrown = false;
  const calls = [],
    invalidations = [];
  let options;
  const context = {
    exports: {},
    require(name) {
      if (name === "@/lib/auth/server")
        return { requireAdmin: async () => ({ role }) };
      if (name === "./detail-query")
        return {
          validUserId: (v) =>
            typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v),
        };
      if (name === "next/cache")
        return { revalidatePath: (...args) => invalidations.push(args) };
      if (name === "@/lib/supabase/env")
        return {
          getSupabaseEnv: () => ({ url: "https://auth.test", key: "public" }),
        };
      if (name === "@/lib/supabase/server")
        return {
          createClient: async () => ({
            rpc: async (...args) => {
              calls.push(args);
              if (thrown) throw new Error("network");
              return {
                error: rpcError,
                data: {
                  email: "scoped@example.test",
                  redirectTo: "https://product.test",
                },
              };
            },
          }),
        };
      if (name === "@supabase/supabase-js")
        return {
          createClient: (_url, _key, config) => {
            options = config;
            return {
              auth: {
                resetPasswordForEmail: async (...args) => {
                  calls.push(args);
                  return { error: authError };
                },
              },
            };
          },
        };
      throw new Error(name);
    },
  };
  const source = await readFile(
    new URL("../modules/users/account-actions.ts", import.meta.url),
    "utf8",
  );
  runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    context,
  );
  const { banUser, unbanUser, deleteUser, resetUserPassword } = context.exports;
  role = "finance_admin";
  for (const act of [
    () => banUser(user(1), "reason"),
    () => unbanUser(user(1)),
    () => deleteUser(user(1), "a@b.test"),
    () => resetUserPassword(user(1)),
  ])
    assert.ok((await act()).error);
  assert.equal(calls.length, 0);
  role = "operator_admin";
  assert.ok((await banUser("bad", "reason")).error);
  for (const reason of [null, {}, "", "  ", "x".repeat(501)])
    assert.ok((await banUser(user(1), reason)).error);
  assert.ok((await deleteUser(user(1), null)).error);
  assert.equal(calls.length, 0);
  assert.ok((await banUser(user(1), "reason")).success);
  assert.equal(calls[0][1].p_reason, "reason");
  assert.equal(invalidations.length, 1);
  for (const code of ["P0002", "42501", "22023", "54000", "XX000"]) {
    rpcError = { code };
    assert.ok((await resetUserPassword(user(1))).error);
  }
  rpcError = null;
  assert.ok((await resetUserPassword(user(1))).success);
  assert.equal(calls.at(-1)[0], "scoped@example.test");
  assert.equal(calls.at(-1)[1].redirectTo, "https://product.test");
  assert.equal(options.auth.flowType, "implicit");
  assert.equal(options.auth.persistSession, false);
  assert.equal(invalidations.length, 1);
  authError = { message: "rate limited" };
  assert.ok((await resetUserPassword(user(1))).error);
  thrown = true;
  assert.ok((await unbanUser(user(1))).error);
});
