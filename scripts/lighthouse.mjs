#!/usr/bin/env node
/**
 * scripts/lighthouse.mjs
 *
 * Menjalankan Google Lighthouse pada halaman dashboard yang dilindungi autentikasi.
 *
 * Strategi:
 *  1. Login via Supabase Auth REST API → dapatkan access_token & refresh_token.
 *  2. Jalankan Chrome (via puppeteer-core / chrome-launcher) dalam mode debug.
 *  3. Inject cookies sesi Supabase ke browser sebelum audit dimulai.
 *  4. Jalankan Lighthouse dengan koneksi ke Chrome tersebut.
 *  5. Simpan laporan HTML & JSON ke ./lighthouse-reports/.
 *
 * Credential dibaca dari environment:
 *   LIGHTHOUSE_EMAIL    – email admin (wajib)
 *   LIGHTHOUSE_PASSWORD – password admin (wajib)
 *   NEXT_PUBLIC_SUPABASE_URL   – (sudah ada di .env.local)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY – (sudah ada di .env.local)
 *
 * Penggunaan:
 *   pnpm lighthouse            # pakai .env.local otomatis
 *   node scripts/lighthouse.mjs [url]
 *
 * Contoh:
 *   node scripts/lighthouse.mjs http://localhost:3000
 *   node scripts/lighthouse.mjs http://localhost:3000/microsaas
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";

// ─── Load .env.local ──────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadEnv(file) {
  if (!existsSync(file)) return;
  const lines = readFileSync(file, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv(resolve(ROOT, ".env.local"));
loadEnv(resolve(ROOT, ".env"));

// ─── Validasi environment ─────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const EMAIL = process.env.LIGHTHOUSE_EMAIL;
const PASSWORD = process.env.LIGHTHOUSE_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "❌  NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY harus ada di .env.local",
  );
  process.exit(1);
}

if (!EMAIL || !PASSWORD) {
  console.error(
    "❌  Set LIGHTHOUSE_EMAIL dan LIGHTHOUSE_PASSWORD di .env.local atau environment:\n\n" +
      "    LIGHTHOUSE_EMAIL=admin@example.com LIGHTHOUSE_PASSWORD=*** node scripts/lighthouse.mjs\n",
  );
  process.exit(1);
}

const TARGET_URL = process.argv[2] ?? "http://localhost:3000";

// ─── 1. Login via Supabase REST ───────────────────────────────────────────────
async function supabaseSignIn() {
  console.log(`\n🔐  Login sebagai ${EMAIL} …`);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`❌  Login gagal (${res.status}): ${body}`);
    process.exit(1);
  }

  const data = await res.json();
  console.log(`✅  Login berhasil (user: ${data.user?.email})`);
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}

// ─── 2. Jalankan Lighthouse ───────────────────────────────────────────────────
async function runLighthouse(targetUrl, accessToken, refreshToken) {
  // Import dinamis agar tidak crash jika package belum install
  let chromeLauncher, lighthouse, ReportGenerator;
  try {
    ({ launch: chromeLauncher } = await import("chrome-launcher"));
  } catch {
    console.error(
      "❌  chrome-launcher belum terinstall. Jalankan:\n\n" +
        "    pnpm add -D chrome-launcher lighthouse\n",
    );
    process.exit(1);
  }
  try {
    ({ default: lighthouse } = await import("lighthouse"));
  } catch {
    console.error(
      "❌  lighthouse belum terinstall. Jalankan:\n\n" +
        "    pnpm add -D lighthouse\n",
    );
    process.exit(1);
  }

  // Coba load ReportGenerator (tersedia di lighthouse >= 10)
  try {
    const reportModule =
      await import("lighthouse/report/generator/report-generator.js");
    ReportGenerator = reportModule.default ?? reportModule.ReportGenerator;
  } catch {
    // Tidak kritis; akan skip generate HTML jika tidak tersedia
  }

  // ── Launch Chrome headless ──
  console.log("\n🌐  Membuka Chrome …");
  const chrome = await chromeLauncher({
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    // ── Inject cookies sesi Supabase via CDP ──
    console.log("🍪  Menyuntikkan sesi Supabase ke browser …");

    const { default: CDP } = await import("chrome-remote-interface").catch(
      () => ({ default: null }),
    );

    // Bangun string storage key Supabase (sb-<project-ref>-auth-token)
    const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
    const storageKey = `sb-${projectRef}-auth-token`;
    const storageValue = JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
    });

    if (CDP) {
      // Inject via localStorage menggunakan CDP sebelum Lighthouse mengambil alih
      const client = await CDP({ port: chrome.port });
      try {
        const { Target } = client;
        const { targetId } = await Target.createTarget({ url: "about:blank" });
        const { sessionId } = await Target.attachToTarget({
          targetId,
          flatten: true,
        });

        await client.send(
          "Runtime.evaluate",
          {
            expression: `localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(storageValue)})`,
            returnByValue: true,
          },
          sessionId,
        );

        await Target.closeTarget({ targetId });
      } finally {
        await client.close();
      }
    } else {
      console.warn(
        "⚠️  chrome-remote-interface tidak terinstall; sesi akan diinject via extraHeaders.\n" +
          "    Untuk injeksi localStorage, jalankan: pnpm add -D chrome-remote-interface",
      );
    }

    // ── Jalankan Lighthouse ──
    console.log(`\n🔦  Menjalankan Lighthouse pada: ${targetUrl}`);
    console.log(
      "    Kategori: performance, accessibility, best-practices, seo",
    );
    console.log("    Mode: desktop\n");

    const result = await lighthouse(
      targetUrl,
      {
        port: chrome.port,
        output: ["html", "json"],
        logLevel: "error",
        // Kirim Authorization header sebagai fallback
        extraHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
        // Simpan localStorage sebelum audit (Lighthouse 10+)
        formFactor: "desktop",
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
      },
      {
        extends: "lighthouse:default",
        settings: {
          onlyCategories: [
            "performance",
            "accessibility",
            "best-practices",
            "seo",
          ],
          // Tambahkan localStorage seed agar session tersedia saat navigasi
          extraHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      },
    );

    return result;
  } finally {
    await chrome.kill();
  }
}

// ─── 3. Simpan laporan ────────────────────────────────────────────────────────
function saveReports(lhr, reports) {
  const outDir = resolve(ROOT, "lighthouse-reports");
  mkdirSync(outDir, { recursive: true });

  const ts = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);

  const slug =
    TARGET_URL.replace(/https?:\/\/[^/]+/, "").replace(/\//g, "_") || "_home";
  const base = `${ts}${slug}`;

  // HTML
  if (reports?.[0]) {
    const htmlPath = resolve(outDir, `${base}.html`);
    writeFileSync(htmlPath, reports[0], "utf8");
    console.log(`📄  HTML: ${htmlPath}`);
  }

  // JSON
  if (reports?.[1]) {
    const jsonPath = resolve(outDir, `${base}.json`);
    writeFileSync(jsonPath, reports[1], "utf8");
    console.log(`📊  JSON: ${jsonPath}`);
  }

  // Ringkasan skor di terminal
  const cats = lhr.categories;
  console.log("\n─────────────────────────────────────────");
  console.log("  Skor Lighthouse");
  console.log("─────────────────────────────────────────");
  for (const [id, cat] of Object.entries(cats)) {
    const score = Math.round((cat.score ?? 0) * 100);
    const emoji = score >= 90 ? "🟢" : score >= 50 ? "🟡" : "🔴";
    console.log(`  ${emoji}  ${cat.title.padEnd(20)} ${score}`);
  }
  console.log("─────────────────────────────────────────\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const { accessToken, refreshToken } = await supabaseSignIn();
const result = await runLighthouse(TARGET_URL, accessToken, refreshToken);
saveReports(result.lhr, result.report);
