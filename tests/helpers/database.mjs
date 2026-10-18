import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

// Supabase Auth owns these objects in cloud. Only its identity interface is stubbed here.
export async function createDatabase({ beforeMigration } = {}) {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
  `);
  const migrations = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(migrations)).sort()) {
    if (file.endsWith(".sql")) {
      await beforeMigration?.(db, file);
      await db.exec(await readFile(new URL(file, migrations), "utf8"));
    }
  }
  return db;
}

export const seed = () =>
  readFile(new URL("../../supabase/seed.sql", import.meta.url), "utf8");
