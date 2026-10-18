# Multi-MicroSaaS Admin Dashboard

Fondasi Next.js App Router + TypeScript untuk dashboard admin MicroSaaS.
Requirement: [PRD](docs/PRD.md), [backlog](docs/BACKLOG.md), dan [Kinetic Obsidian](DESIGN.md).

## Setup lokal

Gunakan Node.js 22 LTS dan pnpm 9.15.9 (lihat `packageManager`).

```sh
pnpm install --frozen-lockfile
```

Salin contoh environment di PowerShell:

```powershell
Copy-Item .env.local.example .env.local
```

```sh
pnpm dev
```

Buka <http://localhost:3000>. Halaman masih starter; integrasi Supabase dan fitur
bisnis mengikuti backlog. Environment boleh kosong sampai modul terkait dibangun.

## Environment

| Variable                        | Akses          | Kegunaan                                                             |
| ------------------------------- | -------------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Browser/server | URL project Supabase                                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/server | Anon key; akses data harus dibatasi RLS                              |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server saja    | Operasi istimewa setelah validasi role dan scope                     |
| `GATEWAY_ENCRYPTION_KEY`        | Server saja    | Dicadangkan untuk enkripsi secret gateway: 32 byte acak dalam base64 |

Jangan commit `.env.local`. Service role dan kunci enkripsi tidak boleh dikirim ke
browser. Belum ada pembacaan atau validasi runtime environment pada fondasi ini.

## Tooling dan verifikasi

```sh
pnpm lint
pnpm typecheck
pnpm format:check
pnpm build
pnpm start
```

`typecheck` menjalankan Next.js typegen sebelum TypeScript, termasuk pada checkout
baru. `pnpm format` merapikan source/config; `docs/`, `DESIGN.md`, lockfile, dan
file hasil generate dikecualikan. `pnpm build` membutuhkan akses Google Fonts
untuk mengunduh font; hasil build melayani font tersebut secara lokal.

Husky aktif melalui script `prepare` saat dependency diinstal. Hook pre-commit
menjalankan lint-staged: ESLint dan Prettier pada source JavaScript/TypeScript,
serta Prettier pada JSON/CSS/Markdown/YAML yang tidak diabaikan. CI tetap perlu
menjalankan semua perintah verifikasi.

## UI dan struktur

- Tailwind v4 memakai CSS-first di `app/globals.css`; integrasi Turbopack tetap
  melalui `next.config.ts`.
- shadcn/ui dikonfigurasi di `components.json`, tanpa `tailwind.config.ts`.
  Komponen awal `components/ui/button.tsx` menggunakan helper `lib/utils.ts`.
- Font: Plus Jakarta Sans (`font-display`), Inter (`font-sans`), JetBrains Mono
  (`font-mono`), dimuat melalui `next/font`. Tema gelap aktif tetap.
- Folder sumber langsung di root, tanpa `src/`; `@/` mengarah ke root proyek.
  Modul dan komponen lain dibuat sesuai task, bukan sekaligus pada setup ini.

Referensi: [shadcn manual setup](https://ui.shadcn.com/docs/installation/manual),
[Husky](https://typicode.github.io/husky/get-started.html), dan
[Prettier](https://prettier.io/docs/install).
