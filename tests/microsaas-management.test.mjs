import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createDecipheriv, randomBytes } from "node:crypto";
import { test } from "node:test";
import ts from "typescript";
import { createDatabase, seed } from "./helpers/database.mjs";

async function load(path) {
  const source = (
    await readFile(new URL(path, import.meta.url), "utf8")
  ).replace('import "server-only";', "");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
}
const { slugify, parseProduct, validUrl, logoExtension } = await load(
  "../modules/microsaas/validation.ts",
);
const { encryptSecret } = await load("../lib/secrets.ts");

test("product boundary validation, slug generation and logo content validation", () => {
  assert.equal(slugify("  Café Forms 2! "), "cafe-forms-2");
  const form = new FormData();
  form.set("name", "New Product");
  form.set("url", "https://example.com");
  assert.equal(parseProduct(form).slug, "new-product");
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "https://user:pass@example.com",
    "bad",
  ])
    assert.equal(validUrl(url), false);
  assert.equal(validUrl("http://example.com", true), false);
  form.set("slug", "UPPER");
  assert.throws(() => parseProduct(form), /Slug/);
  form.set("slug", "valid");
  form.set("status", "deleted");
  assert.throws(() => parseProduct(form), /Status/);
  assert.equal(
    logoExtension(
      Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]),
      "image/png",
    ),
    "png",
  );
  assert.throws(
    () => logoExtension(new Uint8Array([60, 115, 118, 103]), "image/png"),
    /valid/,
  );
  assert.throws(
    () => logoExtension(new Uint8Array(1048577), "image/png"),
    /1 MB/,
  );
});

test("API keys use authenticated encryption bound to the product", (t) => {
  const previous = process.env.MICROSAAS_ENCRYPTION_KEY;
  t.after(() => {
    if (previous === undefined) delete process.env.MICROSAAS_ENCRYPTION_KEY;
    else process.env.MICROSAAS_ENCRYPTION_KEY = previous;
  });
  delete process.env.MICROSAAS_ENCRYPTION_KEY;
  assert.throws(() => encryptSecret("secret", "product"), /ENCRYPTION_KEY/);
  const key = randomBytes(32);
  process.env.MICROSAAS_ENCRYPTION_KEY = key.toString("base64");
  const encrypted = encryptSecret("secret-value", "product");
  assert.ok(!encrypted.includes("secret-value"));
  assert.notEqual(encrypted, encryptSecret("secret-value", "product"));
  const [version, iv, tag, data] = encrypted.split(".");
  assert.equal(version, "v1");
  const decrypt = (context) => {
    const cipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(iv, "base64"),
    );
    cipher.setAAD(Buffer.from(context));
    cipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([
      cipher.update(Buffer.from(data, "base64")),
      cipher.final(),
    ]).toString();
  };
  assert.equal(decrypt("product"), "secret-value");
  assert.throws(() => decrypt("other-product"));
});

test("registry CRUD, configuration isolation, confirmation and append-only audit", async (t) => {
  const db = await createDatabase();
  t.after(() => db.close());
  await db.exec(await seed());
  const admin = (n) => `f0000000-0000-4000-8000-00000000000${n}`;
  const product = "10000000-0000-4000-8000-000000000001";
  await db.exec(`insert into auth.users values ('${admin(1)}'),('${admin(2)}'),('${admin(3)}'),('${admin(4)}');
    insert into public.admin_users(id,role_id,name) values ('${admin(1)}','super_admin','Owner'),('${admin(2)}','operator_admin','Operator'),('${admin(3)}','finance_admin','Finance');
    insert into public.admin_assignments(admin_id,microsaas_id) values ('${admin(2)}','${product}');`);
  async function asAdmin(n) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      admin(n),
    ]);
    await db.exec("set role authenticated");
  }
  await asAdmin(1);
  const {
    rows: [created],
  } = await db.query(
    "insert into public.microsaas(name,slug,url) values ('Test Product','test-product','https://example.com') returning id",
  );
  const id = created.id;
  await assert.rejects(
    db.query(
      "insert into public.microsaas(name,slug,url) values ('Duplicate','test-product','https://example.com')",
    ),
    /unique/,
  );
  await db.query(
    "update public.microsaas set description='Updated',status='inactive' where id=$1",
    [id],
  );
  await db.query(
    "select public.save_microsaas_config($1,'https://example.com/webhook','production','v1.testcipher','••••••••')",
    [id],
  );
  await db.query("select public.save_microsaas_config($1,null,'sandbox')", [
    id,
  ]);
  assert.equal(
    (
      await db.query(
        "select api_key_mask from public.microsaas_config where microsaas_id=$1",
        [id],
      )
    ).rows[0].api_key_mask,
    "••••••••",
  );
  await assert.rejects(
    db.query("select * from private.microsaas_secrets"),
    /permission denied/,
  );
  const audit = (
    await db.query("select * from public.audit_logs where resource_id=$1", [id])
  ).rows;
  assert.ok(
    audit.some((r) => r.action === "insert" && r.resource_type === "microsaas"),
  );
  assert.ok(
    audit.some((r) => r.action === "update" && r.resource_type === "microsaas"),
  );
  assert.ok(!JSON.stringify(audit).includes("testcipher"));
  await assert.rejects(
    db.query("select public.set_microsaas_maintenance($1,true,'Wrong')", [id]),
    /confirmation mismatch/,
  );
  await db.query(
    "select public.set_microsaas_maintenance($1,true,'Test Product')",
    [id],
  );
  assert.equal(
    (
      await db.query(
        "select maintenance_mode from public.microsaas_config where microsaas_id=$1",
        [id],
      )
    ).rows[0].maintenance_mode,
    true,
  );
  for (const n of [2, 3, 4]) {
    await asAdmin(n);
    await assert.rejects(
      db.query("select public.save_microsaas_config($1,null,'sandbox')", [id]),
      /Super Admin/,
    );
    await assert.rejects(
      db.query(
        "select public.set_microsaas_maintenance($1,true,'Test Product')",
        [id],
      ),
      /Super Admin/,
    );
    await assert.rejects(
      db.query("select public.delete_microsaas($1,'Test Product')", [id]),
      /Super Admin/,
    );
    await assert.rejects(
      db.query(
        "insert into public.microsaas(name,slug,url) values ('Blocked','blocked','https://example.com')",
      ),
      /row-level security/,
    );
    assert.deepEqual(
      (await db.query("select * from public.microsaas_config")).rows,
      [],
    );
    assert.deepEqual(
      (
        await db.query(
          "update public.microsaas set name='Hacked' where id=$1 returning id",
          [id],
        )
      ).rows,
      [],
    );
  }
  await asAdmin(1);
  await assert.rejects(
    db.query("select public.delete_microsaas($1,'Wrong')", [id]),
    /confirmation mismatch/,
  );
  await assert.rejects(
    db.query("delete from public.microsaas where id=$1", [id]),
    /permission denied/,
  );
  await assert.rejects(
    db.query("select public.delete_microsaas($1,'Formly')", [product]),
    /confirmation mismatch|foreign key/,
  );
  await db.query("select public.delete_microsaas($1,'Test Product')", [id]);
  assert.deepEqual(
    (await db.query("select * from public.microsaas where id=$1", [id])).rows,
    [],
  );
  assert.ok(
    (
      await db.query(
        "select * from public.audit_logs where resource_id=$1 and action='delete'",
        [id],
      )
    ).rows.length > 0,
  );
  await assert.rejects(
    db.query("delete from public.audit_logs"),
    /permission denied/,
  );
  await db.exec("reset role");
  assert.deepEqual(
    (
      await db.query(
        "select * from private.microsaas_secrets where microsaas_id=$1",
        [id],
      )
    ).rows,
    [],
  );
  await db.exec("set role anon");
  await assert.rejects(
    db.query("select public.save_microsaas_config($1,null,'sandbox')", [id]),
    /permission denied/,
  );
});
