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

Buka <http://localhost:3000>. Halaman utama masih starter; preview UI ada di
`/design-system`. Client Supabase tersedia; fitur bisnis mengikuti backlog.

## Environment

| Variable                        | Akses          | Kegunaan                                                             |
| ------------------------------- | -------------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Browser/server | URL project Supabase                                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/server | Anon key; akses data harus dibatasi RLS                              |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server saja    | Operasi istimewa setelah validasi role dan scope                     |
| `GATEWAY_ENCRYPTION_KEY`        | Server saja    | Dicadangkan untuk enkripsi secret gateway: 32 byte acak dalam base64 |

Jangan commit `.env.local`. Service role dan kunci enkripsi tidak boleh dikirim ke
browser. Client memvalidasi URL/key ketika dipanggil. Proxy hanya refresh session
jika kedua public environment terisi; preview UI tetap dapat dibuka tanpa key.
Proteksi route, login, dan pemeriksaan role di Server Action mengikuti story 4/32.

## Supabase cloud (story 3)

Project tujuan: `nbcgglhxqtgewtoeqbnf` di
<https://nbcgglhxqtgewtoeqbnf.supabase.co>. Workflow ini tidak memakai Docker.
Project ini bernama `SDSKanban` dan juga berisi tabel Kanban/budgeting. Migration
`20261018000100_foundation.sql` sudah diterapkan ke cloud; RLS seluruh 16 tabel
dashboard diverifikasi aktif dan akses anonim melalui PostgREST ditolak.
Tabel aplikasi lama tidak diubah. Seed dummy belum diterapkan ke cloud.
Tidak ada service-role client yang melewati RLS.

Migration ada di `supabase/migrations/`, seed di `supabase/seed.sql`. Skema berisi
16 tabel public, termasuk relasi `plan_microsaas` agar satu plan bisa dipakai
beberapa produk. Foreign key gabungan menjaga user/subscription/transaksi/invoice
tetap di produk yang sama. Nilai uang memakai `numeric(14,2)` dan currency eksplisit.
Subscription menyimpan snapshot harga untuk mempertahankan harga pelanggan lama.

| Role                       | Akses database                                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Super Admin                | CRUD tabel dashboard; audit hanya baca                                                                                                        |
| Operator Admin             | Baca produk yang di-assign, users, plans, subscriptions, transaksi, invoice, metrik, promo, dan alert; update users/subscriptions dalam scope |
| Finance Admin              | Baca subscriptions, transactions, invoices, serta metadata produk/plan/gateway; tanpa mutasi, profil user, atau secret                        |
| Non-admin / admin nonaktif | Tidak memiliki akses data bisnis                                                                                                              |

Kredensial gateway dipisah ke `private.payment_gateway_secrets`, di luar Data API.
Hanya operasi server istimewa boleh mengakses ciphertext setelah pemeriksaan izin;
enkripsi dan pengelolaan secret diimplementasikan pada story payment. Metadata
gateway dan alert tidak boleh berisi token atau webhook rahasia. RLS memakai role
admin aktif dari database, bukan `user_metadata` JWT. Audit otomatis mencatat
mutasi admin dan menolak update/delete/truncate, termasuk oleh Super Admin.
Mutasi backend dengan service role wajib menyertakan audit eksplisit di story fitur.
Hard delete produk yang sudah memiliki data keuangan ditolak foreign key; gunakan
status `inactive` untuk mempertahankan histori.

Client browser: `lib/supabase/client.ts`; client server per request:
`lib/supabase/server.ts`. `proxy.ts` memakai konvensi Next.js 16 untuk refresh
cookie melalui `getClaims()` dan mencegah caching respons yang menulis session.
Pola mengikuti [panduan SSR Supabase](https://supabase.com/docs/guides/auth/server-side/creating-a-client).

Setelah akses CLI tersedia dan perubahan cloud disetujui, gunakan workflow ini:

```sh
pnpm exec supabase login
pnpm exec supabase link --project-ref nbcgglhxqtgewtoeqbnf
pnpm exec supabase db push --linked --dry-run
# Periksa migration dan pastikan project tujuan sebelum menjalankan push.
pnpm exec supabase db push --linked
pnpm db:types
```

Jangan menerapkan baseline ini langsung ke project yang sudah mempunyai tabel
bernama sama; tarik dan rekonsiliasi schema terlebih dahulu. Ambil public anon key
dari Supabase Connect dan isi `.env.local` bersama URL project. Jangan commit key.
Bootstrap admin pertama melalui SQL Editor setelah membuat/mengundang akun Auth:

```sql
insert into public.admin_users (id, role_id, name)
select id, 'super_admin', 'Admin Utama'
from auth.users where email = 'GANTI_DENGAN_EMAIL_ADMIN';
```

Seed bersifat sintetis dan idempotent: 3 produk, 50 users, 50 subscriptions,
50 transaksi/invoice, 90 metrik harian, promo, gateway sandbox tanpa secret,
dan alert contoh. Seed tidak membuat akun Auth atau memberi role admin.
Jalankan `supabase/seed.sql` melalui SQL Editor **hanya pada project development**;
`db push` di atas tidak menyertakan seed. Jangan menjalankan `db reset` ke cloud.

```sh
pnpm test:db
```

Pengujian database memakai PostgreSQL embedded (PGlite), tanpa container atau
koneksi cloud. Migrations dan seed asli dijalankan; hanya interface identitas
Supabase Auth yang dibuat sebagai stub. Pengujian meliputi isolasi RLS, eskalasi
role, pencabutan akses, append-only audit, scope FK, dan constraint billing.
PostgREST cloud sudah diuji untuk penolakan akses anonim. Pengujian login dan
refresh session pengguna nyata mengikuti story 4.
`types/database.ts` dihasilkan CLI dari schema public cloud; karena project dipakai
bersama, file ini juga berisi tipe tabel aplikasi lama. `pnpm db:types` memperbarui
dan memformat file tersebut dari cloud.
Kegagalan generate tidak menimpa file types yang sudah ada.

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

Preview story 2 tersedia di <http://localhost:3000/design-system> setelah
`pnpm dev`. Halaman ini memakai data contoh. Komponen owned shadcn tersedia di
`components/ui/`: Button, Card, Badge, Input, Select, dan Dialog. StatCard dan
DataTable tersedia di `components/shared/`.

Warna canonical memakai `--kinetic-*` (`bg-kinetic-primary` untuk warna teks
tonal); alias shadcn mengikuti PRD §7.2 (`bg-primary` untuk CTA cyan). Utility
`glass-panel` dan `glass-floating` menyediakan dua level kaca. Skala tipografi
tersedia melalui `text-display-hero`, `text-headline-lg/md/sm`,
`text-body-lg/md/sm`, `text-label-numeric/caps`, dan `text-metric-stat`, dipasangkan
dengan `font-display`, `font-sans`, atau `font-mono` sesuai DESIGN.md.

DataTable bersifat controlled: pemanggil menyediakan `rows` halaman aktif,
`rowCount` setelah filter, `query`, dan `onQueryChange`. Modul fitur menangani
query server dan perubahan URL; preview memproses fixture lokal.

Konfirmasi manual story 2 dilakukan pengguna pada desktop ≥1280px:

- Coba pencarian, filter status, sorting Pengguna, pagination 25/50/100, dan
  simulasi loading. Pencarian tanpa hasil menampilkan empty state.
- Coba Select dengan keyboard; buka Dialog, periksa fokus dengan Tab/Shift+Tab,
  lalu tutup dengan Escape dan periksa fokus kembali ke pemicu.
- Periksa warna, font, panel kaca, badge, tombol disabled, dan input invalid.

Story 2 telah diterima pengguna melalui pemeriksaan manual; tidak memakai pengujian
Playwright.

- Tailwind v4 memakai CSS-first di `app/globals.css`; integrasi Turbopack tetap
  melalui `next.config.ts`.
- shadcn/ui dikonfigurasi di `components.json`, tanpa `tailwind.config.ts`.
  Komponen UI menggunakan helper `lib/utils.ts`.
- Font: Plus Jakarta Sans (`font-display`), Inter (`font-sans`), JetBrains Mono
  (`font-mono`), dimuat melalui `next/font`. Tema gelap aktif tetap.
- Folder sumber langsung di root, tanpa `src/`; `@/` mengarah ke root proyek.
  Modul dan komponen lain dibuat sesuai task, bukan sekaligus pada setup ini.

Referensi: [shadcn manual setup](https://ui.shadcn.com/docs/installation/manual),
[Husky](https://typicode.github.io/husky/get-started.html), dan
[Prettier](https://prettier.io/docs/install).
