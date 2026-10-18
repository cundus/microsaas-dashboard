import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";

// Capture first: an auth/network failure must never truncate the existing types.
const cli = new URL(
  "../node_modules/supabase/dist/supabase.js",
  import.meta.url,
);
const types = execFileSync(
  process.execPath,
  [
    fileURLToPath(cli),
    "gen",
    "types",
    "typescript",
    "--project-id",
    "nbcgglhxqtgewtoeqbnf",
    "--schema",
    "public",
  ],
  { encoding: "utf8", stdio: ["inherit", "pipe", "inherit"] },
);
if (!types.includes("export type Database"))
  throw new Error("Supabase returned no Database type");
await mkdir(new URL("../types/", import.meta.url), { recursive: true });
const target = new URL("../types/database.ts", import.meta.url);
const formatted = await format(types, {
  ...(await resolveConfig(fileURLToPath(target))),
  filepath: fileURLToPath(target),
});
await writeFile(target, formatted);
