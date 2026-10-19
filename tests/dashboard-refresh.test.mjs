import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const admin = {
  id: "admin-1",
  role: "super_admin",
  name: "Admin",
  email: "admin@example.com",
};
const settle = () => new Promise(setImmediate);

async function load(path, imports, globals = {}) {
  const { outputText } = ts.transpileModule(
    await readFile(new URL(path, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    },
  );
  const exports = {};
  runInNewContext(outputText, {
    exports,
    ...globals,
    require(name) {
      if (name === "react/jsx-runtime")
        return {
          jsx: (type, props) => ({ type, props }),
          jsxs: (type, props) => ({ type, props }),
        };
      return imports[name] ?? {};
    },
  });
  return exports;
}

async function authHarness() {
  let effect, authEvent, finish;
  const counts = {
    checks: 0,
    refreshes: 0,
    cleared: 0,
    unsubscribed: 0,
    redirect: null,
  };
  const window = new EventTarget();
  window.location = {
    replace: (url) => {
      counts.redirect = url;
    },
  };
  const { AuthProvider } = await load(
    "../components/auth/auth-provider.tsx",
    {
      react: {
        createContext: () => ({ Provider: "Provider" }),
        useState: (init) => [init()],
        useEffect: (callback) => {
          effect = callback;
        },
      },
      "next/navigation": {
        useRouter: () => ({
          refresh: () => {
            counts.refreshes++;
          },
        }),
      },
      "@/lib/auth/store": {
        createAuthStore: () => ({
          getState: () => ({
            clear: () => {
              counts.cleared++;
            },
          }),
        }),
      },
      "@/lib/auth/actions": {
        getCurrentAdmin: () => {
          counts.checks++;
          return new Promise((resolve, reject) => {
            finish = { resolve, reject };
          });
        },
      },
      "@/lib/supabase/client": {
        createClient: () => ({
          auth: {
            onAuthStateChange: (callback) => {
              authEvent = callback;
              return {
                data: {
                  subscription: {
                    unsubscribe: () => {
                      counts.unsubscribed++;
                    },
                  },
                },
              };
            },
          },
        }),
      },
    },
    { window },
  );
  AuthProvider({ admin, children: null });
  const cleanup = effect();
  return {
    counts,
    cleanup,
    focus: () => window.dispatchEvent(new Event("focus")),
    event: (...args) => authEvent(...args),
    result: () => finish,
  };
}

test("focus checks coalesce, while repeated same-user SIGNED_IN never refreshes the dashboard", async () => {
  const h = await authHarness();
  h.event("SIGNED_IN", { user: { id: admin.id } });
  assert.equal(h.counts.checks, 0);
  h.focus();
  h.focus();
  h.event("SIGNED_IN", { user: { id: admin.id } });
  assert.equal(h.counts.checks, 1);
  h.result().resolve({ ...admin });
  await settle();
  assert.equal(h.counts.refreshes, 0);
  h.focus();
  assert.equal(h.counts.checks, 2);
  h.result().resolve({ ...admin, role: "finance_admin" });
  await settle();
  assert.equal(h.counts.refreshes, 1);
  h.cleanup();
});

test("changed accounts, failed authorization, sign-out and cleanup retain access invalidation", async () => {
  const h = await authHarness();
  h.event("SIGNED_IN", { user: { id: "different-admin" } });
  assert.equal(h.counts.refreshes, 1);
  h.event("USER_UPDATED");
  h.result().reject(new Error("Access revoked"));
  await settle();
  assert.equal(h.counts.refreshes, 2);
  h.focus();
  h.event("SIGNED_OUT");
  assert.equal(h.counts.cleared, 1);
  assert.equal(h.counts.redirect, "/login");
  h.result().resolve({ ...admin, role: "finance_admin" });
  await settle();
  assert.equal(h.counts.refreshes, 2);
  h.cleanup();
  assert.equal(h.counts.unsubscribed, 1);
  h.focus();
  assert.equal(h.counts.checks, 2);
});

test("activity focus relies on healthy realtime but fetches immediately when disconnected", async () => {
  let effect, subscription;
  let reads = 0;
  const window = new EventTarget();
  const channel = {
    on() {
      return this;
    },
    subscribe(callback) {
      subscription = callback;
      return this;
    },
  };
  const { ActivityFeed } = await load(
    "../modules/dashboard/components/ActivityFeed.tsx",
    {
      react: {
        useState: (value) => [value, () => {}],
        useRef: (value) => ({ current: value }),
        useEffect: (callback) => {
          effect = callback;
        },
      },
      "@/components/auth/auth-provider": { useAuth: () => admin },
      "@/lib/supabase/client": {
        createClient: () => ({
          channel: () => channel,
          removeChannel: () => {},
        }),
      },
      "../actions": {
        getRecentActivity: async () => {
          reads++;
          return { data: [] };
        },
      },
    },
    {
      window,
      setInterval: () => 1,
      clearInterval() {},
      clearTimeout() {},
      setTimeout,
    },
  );
  const component = ActivityFeed({ initialResult: { data: [] } });
  component.type(component.props);
  const cleanup = effect();
  subscription("SUBSCRIBED");
  await settle();
  assert.equal(reads, 1);
  window.dispatchEvent(new Event("focus"));
  await settle();
  assert.equal(reads, 1);
  subscription("CHANNEL_ERROR");
  window.dispatchEvent(new Event("focus"));
  await settle();
  assert.equal(reads, 2);
  cleanup();
  window.dispatchEvent(new Event("focus"));
  assert.equal(reads, 2);
});

test("the lightweight admin action still uses the server authorization boundary", async () => {
  let calls = 0;
  const { getCurrentAdmin } = await load("../lib/auth/actions.ts", {
    "./server": {
      requireAdmin: async () => {
        calls++;
        throw new Error("Forbidden");
      },
    },
  });
  await assert.rejects(getCurrentAdmin(), /Forbidden/);
  assert.equal(calls, 1);
});
