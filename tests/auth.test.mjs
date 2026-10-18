import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

// Exercise the actual TypeScript modules without adding a test runner dependency.
async function loadModule(path, imports = {}) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  });
  for (const [name, url] of Object.entries(imports)) {
    outputText = outputText.replaceAll(`"${name}"`, JSON.stringify(url));
  }
  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
}

const { readAdminSession, safeNextPath } = await loadModule(
  "../lib/auth/session.ts",
);
const { createAuthStore } = await loadModule("../lib/auth/store.ts", {
  "zustand/vanilla": import.meta.resolve("zustand/vanilla"),
});

const admin = {
  id: "admin-1",
  email: "admin@example.com",
  name: "Admin",
  role: "operator_admin",
};

function client({
  user = { id: admin.id, email: admin.email },
  authError = null,
  profile = {
    id: admin.id,
    name: admin.name,
    role_id: admin.role,
    is_active: true,
  },
  profileError = null,
} = {}) {
  return {
    auth: { getUser: async () => ({ data: { user }, error: authError }) },
    from(table) {
      assert.equal(table, "admin_users");
      return {
        select: () => ({
          eq(column, id) {
            assert.equal(column, "id");
            assert.equal(id, admin.id);
            return {
              maybeSingle: async () => ({ data: profile, error: profileError }),
            };
          },
        }),
      };
    },
  };
}

test("only a verified Auth user with an active database role becomes admin", async () => {
  assert.deepEqual(await readAdminSession(client()), {
    status: "authenticated",
    admin,
  });
  for (const role of ["super_admin", "operator_admin", "finance_admin"]) {
    const session = await readAdminSession(
      client({ profile: { name: "Admin", role_id: role, is_active: true } }),
    );
    assert.equal(session.admin.role, role);
  }
});

test("missing, expired or revoked Auth sessions cannot reach the profile query", async () => {
  for (const auth of [{ user: null }, { authError: new Error("Revoked") }]) {
    const supabase = client(auth);
    supabase.from = () => assert.fail("must verify identity first");
    assert.deepEqual(await readAdminSession(supabase), {
      status: "unauthenticated",
    });
  }
});

test("missing, inactive and unknown roles are denied, including prototype keys", async () => {
  for (const profile of [
    null,
    { is_active: false, role_id: "super_admin" },
    { is_active: true, role_id: "owner" },
    { is_active: true, role_id: "toString" },
  ]) {
    assert.deepEqual(await readAdminSession(client({ profile })), {
      status: "forbidden",
    });
  }
});

test("database outage fails closed instead of providing a default role", async () => {
  await assert.rejects(
    readAdminSession(client({ profileError: new Error("offline") })),
    /memuat akses admin/,
  );
});

test("return URLs reject external redirects and auth loops", () => {
  for (const value of [
    null,
    ["/"],
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/\nevil",
    "/login",
    "/login?next=/",
    "/401",
    "/403/",
    "/%6cogin",
    "/a/../login",
    "/%invalid",
  ]) {
    assert.equal(safeNextPath(value), "/", String(value));
  }
  assert.equal(
    safeNextPath("/design-system?tab=cards"),
    "/design-system?tab=cards",
  );
});

test("Zustand isolates sessions per provider and clears identity on logout", () => {
  const first = createAuthStore(admin);
  const second = createAuthStore({
    ...admin,
    id: "admin-2",
    role: "finance_admin",
  });
  let changes = 0;
  const unsubscribe = first.subscribe(() => changes++);
  first.getState().clear();
  assert.equal(first.getState().admin, null);
  assert.equal(changes, 1);
  assert.equal(second.getState().admin.id, "admin-2");
  unsubscribe();
});
