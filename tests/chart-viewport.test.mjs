import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const { outputText } = ts.transpileModule(
  await readFile(
    new URL(
      "../modules/dashboard/components/ChartViewport.tsx",
      import.meta.url,
    ),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  },
);

test("chart waits for proximity, stays mounted after leaving, and releases its observer", () => {
  let visible = false;
  let effect;
  let intersect;
  let observed;
  let options;
  let disconnected = 0;
  const element = {};
  const exports = {};
  runInNewContext(outputText, {
    exports,
    require: (name) =>
      name === "react"
        ? {
            useRef: () => ({ current: element }),
            useState: () => [
              visible,
              (value) => {
                visible = value;
              },
            ],
            useEffect: (callback) => {
              effect = callback;
            },
          }
        : { jsx: (type, props) => ({ type, props }) },
    IntersectionObserver: class {
      constructor(callback, settings) {
        intersect = callback;
        options = settings;
      }
      observe(target) {
        observed = target;
      }
      disconnect() {
        disconnected++;
      }
    },
  });
  const props = { label: "Revenue chart", children: { chart: true } };
  const before = exports.ChartViewport(props);
  assert.equal(before.props.children.type, exports.ChartPlaceholder);
  assert.equal(before.props["aria-label"], props.label);
  assert.ok(before.props.className.includes("h-80"));
  const cleanup = effect();
  assert.equal(observed, element);
  assert.equal(options.rootMargin, "200px");
  intersect([{ isIntersecting: false }]);
  assert.equal(visible, false);
  intersect([{ isIntersecting: true }]);
  assert.equal(disconnected, 1);
  assert.equal(exports.ChartViewport(props).props.children, props.children);
  intersect([{ isIntersecting: false }]);
  assert.equal(exports.ChartViewport(props).props.children, props.children);
  cleanup();
  assert.equal(disconnected, 2);
});
