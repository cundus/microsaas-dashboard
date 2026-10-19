import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const { outputText } = ts.transpileModule(
  await readFile(
    new URL("../app/(dashboard)/page.tsx", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  },
);

function setup(role = "super_admin", denied = false) {
  const started = [];
  const pending = new Map();
  const range = { start: "2026-09-20", end: "2026-10-19" };
  const actions = Object.fromEntries(
    [
      "getGlobalKPIs",
      "getMicroSaaSList",
      "getRevenueTimeSeries",
      "getUserGrowthTimeSeries",
      "getRecentActivity",
    ].map((name) => [
      name,
      (...args) => {
        started.push({ name, args });
        return new Promise((resolve) => pending.set(name, resolve));
      },
    ]),
  );
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  runInNewContext(outputText, {
    exports,
    require(name) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "react") return { Suspense: "Suspense" };
      if (name === "next/server") return { connection: async () => {} };
      if (name === "@/lib/auth/server")
        return {
          requireAdmin: async () => {
            if (denied) throw new Error("Access denied");
            return { role };
          },
        };
      if (name === "@/modules/dashboard/actions") return actions;
      if (name === "@/modules/dashboard/revenue")
        return { presetRange: () => range };
      const component = name.split("/").at(-1);
      return { [component]: component };
    },
  });
  const boundary = exports
    .default()
    .props.children.find((node) => node.type === "Suspense");
  return { started, pending, range, render: boundary.props.children.type };
}

test("initial widget reads start together and their results reach the client props", async () => {
  const { render, started, pending, range } = setup();
  const rendering = render();
  // No query has resolved yet: all five must already be in flight.
  await new Promise(setImmediate);
  assert.equal(started.length, 5);
  assert.equal(
    started.find((call) => call.name === "getRevenueTimeSeries").args[0],
    range,
  );
  assert.equal(
    started.find((call) => call.name === "getUserGrowthTimeSeries").args[0]
      .interval,
    "day",
  );
  const results = [...pending].map(([name, resolve], index) => {
    const result =
      index === 2 ? { error: "Revenue unavailable" } : { data: [{ name }] };
    resolve(result);
    return result;
  });
  const widgets = (await rendering).props.children;
  assert.equal(widgets.length, 5);
  widgets.forEach((widget, index) =>
    assert.equal(widget.props.initialResult, results[index]),
  );
  assert.equal(widgets[2].props.initialRange, range);
});

test("finance dashboard never requests or renders user growth", async () => {
  const { render, started, pending } = setup("finance_admin");
  const rendering = render();
  await new Promise(setImmediate);
  assert.equal(started.length, 4);
  assert.ok(started.every((call) => call.name !== "getUserGrowthTimeSeries"));
  for (const resolve of pending.values()) resolve({ data: [] });
  assert.equal((await rendering).props.children[3], null);
});

test("authorization completes before any initial data query starts", async () => {
  const { render, started } = setup("super_admin", true);
  await assert.rejects(render(), /Access denied/);
  assert.equal(started.length, 0);
});
