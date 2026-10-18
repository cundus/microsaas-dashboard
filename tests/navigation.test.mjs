import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../lib/navigation.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
});
const { navigation, modulePages, canAccess, isActivePath, getBreadcrumbs } =
  await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );

test("active navigation respects segment boundaries and nested modules", () => {
  assert.equal(isActivePath("/", "/"), true);
  assert.equal(isActivePath("/users/123", "/"), false);
  assert.equal(isActivePath("/users/123", "/users"), true);
  assert.equal(isActivePath("/users-archive", "/users"), false);
  assert.equal(isActivePath("/payment/plans", "/payment"), true);
});

test("role navigation follows existing data access and hides admin-only modules", () => {
  const visible = (role) =>
    navigation.filter((item) => canAccess(item, role)).map((item) => item.href);
  assert.equal(visible("super_admin").length, navigation.length);
  assert.ok(visible("operator_admin").includes("/users"));
  assert.ok(visible("operator_admin").includes("/performance"));
  assert.ok(!visible("operator_admin").includes("/payment"));
  assert.ok(!visible("operator_admin").includes("/settings"));
  assert.ok(visible("finance_admin").includes("/payment"));
  for (const path of ["/users", "/performance", "/alerts", "/settings"]) {
    assert.ok(!visible("finance_admin").includes(path));
  }
  for (const path of [
    "/settings/team",
    "/settings/audit-log",
    "/payment/promo-codes",
    "/payment/webhook-logs",
  ]) {
    const page = modulePages.find((item) => item.href === path);
    assert.ok(canAccess(page, "super_admin"));
    assert.ok(!canAccess(page, "finance_admin"));
    assert.ok(!canAccess(page, "operator_admin"));
  }
});

test("breadcrumbs resolve known labels and preserve nested resource paths", () => {
  assert.deepEqual(getBreadcrumbs("/"), [{ href: "/", label: "Dashboard" }]);
  assert.deepEqual(getBreadcrumbs("/payment/plans"), [
    { href: "/", label: "Dashboard" },
    { href: "/payment", label: "Pembayaran" },
    { href: "/payment/plans", label: "Pricing plan" },
  ]);
  const crumbs = getBreadcrumbs("/microsaas/produk-satu/users");
  assert.deepEqual(crumbs[2], {
    href: "/microsaas/produk-satu",
    label: "produk satu",
  });
  assert.deepEqual(crumbs[3], {
    href: "/microsaas/produk-satu/users",
    label: "users",
  });
  assert.equal(getBreadcrumbs("/users/a%20b").at(-1).label, "a b");
  assert.equal(getBreadcrumbs("/users/%invalid").at(-1).label, "%invalid");
});

test("all sidebar destinations resolve to an existing page or explicit module placeholder", () => {
  const paths = modulePages.map((item) => item.href);
  assert.equal(new Set(paths).size, paths.length);
  for (const item of navigation) {
    assert.ok(["/", "/design-system", ...paths].includes(item.href));
  }
});
