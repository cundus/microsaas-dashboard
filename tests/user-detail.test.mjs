import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";
import { runInNewContext } from "node:vm";
import { createDatabase, seed } from "./helpers/database.mjs";

const transpile = async (path) =>
  ts.transpileModule(await readFile(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
const query = { exports: {} };
runInNewContext(await transpile("../modules/users/detail-query.ts"), query);
const { parseDetailQuery, validUserId } = query.exports;
test("detail rejects malformed identity and pagination at the boundary", () => {
  assert.equal(validUserId("bad"), false);
  assert.equal(validUserId(null), false);
  assert.equal(validUserId("30000000-0000-4000-8000-000000000001"), true);
  assert.equal(parseDetailQuery({}).size, 25);
  for (const params of [
    { size: "10" },
    { transactionsPage: "0" },
    { subscriptionsPage: "0" },
    { loginsPage: "40001" },
    { size: ["25"] },
    { loginsPage: "1.5" },
    { size: "Infinity" },
  ])
    assert.throws(() => parseDetailQuery(params));
});

test("detail action authorizes before reading and handles scoped queries, errors and missing users", async () => {
  let role = "finance_admin";
  let calls = [];
  const user = {
    id: "30000000-0000-4000-8000-000000000001",
    microsaas_id: "10000000-0000-4000-8000-000000000001",
  };
  let missing = false,
    failure = false,
    throwFailure = false;
  const db = {
    from(table) {
      const call = { table, filters: [] };
      calls.push(call);
      const chain = new Proxy(
        {},
        {
          get(_, method) {
            if (method === "then")
              return (resolve, reject) => {
                if (throwFailure)
                  return Promise.reject(new Error("network")).then(
                    resolve,
                    reject,
                  );
                return Promise.resolve({
                  data: table === "users" ? (missing ? null : user) : [],
                  count: 26,
                  error: failure ? new Error("database") : null,
                }).then(resolve, reject);
              };
            return (...args) => {
              call.filters.push([method, ...args]);
              return chain;
            };
          },
        },
      );
      return chain;
    },
  };
  const context = {
    exports: {},
    require(name) {
      if (name.includes("auth/server"))
        return { requireAdmin: async () => ({ role }) };
      if (name.includes("supabase/server"))
        return { createClient: async () => db };
      if (name === "./detail-query") return query.exports;
      throw new Error(name);
    },
  };
  runInNewContext(
    await transpile("../modules/users/detail-actions.ts"),
    context,
  );
  const get = context.exports.getUserById;
  assert.equal((await get(user.id)).forbidden, true);
  assert.equal(calls.length, 0);
  role = "operator_admin";
  assert.equal((await get("invalid")).notFound, true);
  assert.equal(calls.length, 0);
  assert.ok(
    (await get(user.id, { size: 500, transactionsPage: 1, loginsPage: 1 }))
      .error,
  );
  assert.equal(calls.length, 0);
  assert.ok(
    (await get(user.id, { size: [25], transactionsPage: 1, loginsPage: 1 }))
      .error,
  );
  missing = true;
  assert.equal((await get(user.id)).notFound, true);
  assert.equal(calls.length, 1);
  missing = false;
  calls = [];
  const result = await get(user.id, {
    size: 25,
    transactionsPage: 99,
    loginsPage: 99,
  });
  assert.equal(result.data.query.transactionsPage, 2);
  assert.equal(result.data.query.loginsPage, 2);
  assert.equal(result.data.query.subscriptionsPage, 1);
  for (const call of calls.filter((c) => c.table !== "users")) {
    assert.ok(
      call.filters.some(
        (f) => f[0] === "eq" && f[1] === "user_id" && f[2] === user.id,
      ),
    );
    assert.ok(
      call.filters.some(
        (f) =>
          f[0] === "eq" &&
          f[1] === "microsaas_id" &&
          f[2] === user.microsaas_id,
      ),
    );
  }
  assert.ok(
    calls[0].filters.some(
      (f) => f[0] === "neq" && f[1] === "status" && f[2] === "deleted",
    ),
  );
  failure = true;
  assert.ok((await get(user.id)).error);
  failure = false;
  throwFailure = true;
  assert.ok((await get(user.id)).error);
});

test("avatar falls back when an SSR image failed before hydration and retries a new URL", async () => {
  let failedUrl = null;
  const context = {
    exports: {},
    require(name) {
      if (name === "react")
        return {
          useState: () => [
            failedUrl,
            (value) => {
              failedUrl = value;
            },
          ],
        };
      if (name === "react/jsx-runtime")
        return { jsx: (type, props) => ({ type, props }) };
      throw new Error(name);
    },
  };
  runInNewContext(
    await transpile("../modules/users/components/Avatar.tsx"),
    context,
  );
  const Avatar = context.exports.Avatar;
  const props = { name: "Nadia Putri", url: "https://example.test/broken.png" };
  const first = Avatar(props);
  assert.equal(first.type, "img");
  first.props.ref({ complete: true, naturalWidth: 0 });
  const fallback = Avatar(props);
  assert.equal(fallback.type, "span");
  assert.equal(fallback.props.children, "NP");
  assert.equal(
    Avatar({ ...props, url: "https://example.test/new.png" }).type,
    "img",
  );
  assert.equal(Avatar({ ...props, url: "javascript:alert(1)" }).type, "span");
});

test("login history captures integration timestamps without duplicates and enforces role/product scope", async (t) => {
  const db = await createDatabase({
    beforeMigration: async (db, file) => {
      if (file === "20261019000800_user_login_history.sql") {
        await db.exec(await seed());
        await db.exec(
          "update public.users set last_login_at='2026-10-01T00:00:00Z' where id='30000000-0000-4000-8000-000000000001'",
        );
      }
    },
  });
  t.after(() => db.close());
  const admin = (n) => `f0000000-0000-4000-8000-00000000000${n}`;
  const product = (n) => `10000000-0000-4000-8000-00000000000${n}`;
  const user = (n) => `30000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  await db.exec(`insert into auth.users values ('${admin(1)}'),('${admin(2)}'),('${admin(3)}'),('${admin(4)}');
    insert into public.admin_users(id,role_id,name) values ('${admin(1)}','super_admin','Owner'),('${admin(2)}','operator_admin','Operator'),('${admin(3)}','finance_admin','Finance');
    insert into public.admin_assignments(admin_id,microsaas_id) values ('${admin(2)}','${product(1)}');`);
  const count = async (id) =>
    Number(
      (
        await db.query(
          "select count(*) n from public.user_login_history where user_id=$1",
          [id],
        )
      ).rows[0].n,
    );
  assert.equal(await count(user(1)), 1);
  await db.exec(`update public.users set last_login_at='2026-10-02T00:00:00Z' where id='${user(1)}';
    update public.users set last_login_at=last_login_at where id='${user(1)}';
    update public.users set last_login_at='2026-10-01T00:00:00Z' where id='${user(1)}';`);
  assert.equal(await count(user(1)), 2);
  async function asAdmin(n) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      admin(n),
    ]);
    await db.exec("set role authenticated");
  }
  await asAdmin(2);
  const visible = await db.query(
    "select distinct microsaas_id from public.user_login_history",
  );
  assert.ok(visible.rows.length);
  assert.ok(visible.rows.every((r) => r.microsaas_id === product(1)));
  await assert.rejects(
    db.exec(
      `insert into public.user_login_history(user_id,microsaas_id,occurred_at) values ('${user(1)}','${product(1)}',now())`,
    ),
  );
  await assert.rejects(db.exec("delete from public.user_login_history"));
  for (const n of [3, 4]) {
    await asAdmin(n);
    assert.equal(
      (await db.query("select * from public.user_login_history")).rows.length,
      0,
    );
  }
  await asAdmin(1);
  assert.equal(await count(user(1)), 2);
  await db.exec(
    `update public.users set status='deleted',deleted_at=now() where id='${user(1)}'`,
  );
  assert.equal(await count(user(1)), 0);
  await db.exec("reset role");
  await db.exec(
    `update public.admin_users set is_active=false where id='${admin(2)}'`,
  );
  await asAdmin(2);
  assert.equal(
    (await db.query("select * from public.user_login_history")).rows.length,
    0,
  );
  await db.exec("reset role; set role anon");
  await assert.rejects(db.exec("select * from public.user_login_history"));
});
