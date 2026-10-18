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
cookie melalui `getUser()`, memvalidasi admin aktif, dan mencegah caching respons session.
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
refresh session dengan akun admin cloud dilakukan setelah bootstrap akun di atas.
`types/database.ts` dihasilkan CLI dari schema public cloud; karena project dipakai
bersama, file ini juga berisi tipe tabel aplikasi lama. `pnpm db:types` memperbarui
dan memformat file tersebut dari cloud.
Kegagalan generate tidak menimpa file types yang sudah ada.

## Authentication (STORY-004)

`/login` menerima email/password lewat Server Action Supabase Auth. Session
disimpan pada cookie Supabase SSR; `proxy.ts` memverifikasi identitas melalui
Auth server dengan `getUser()` dan membaca role dari `admin_users` yang aktif.
Seluruh route aplikasi, termasuk `/design-system`, membutuhkan akses admin.
Route `/login`, `/401`, dan `/403` tersedia untuk login dan informasi kegagalan
akses; aset statis dikecualikan. Akun tanpa session diarahkan ke login dengan
parameter `next` internal yang divalidasi. Akun tanpa admin aktif diarahkan ke 403. Konfigurasi Supabase wajib tersedia; tidak ada bypass auth untuk preview.

Global client state menggunakan **Zustand** (`lib/auth/store.ts`), diinisialisasi
dari hasil validasi server melalui `AuthProvider` di layout `(dashboard)`.
`useAuth()` mengembalikan profil admin (id, email, nama, role) atau `null` setelah
logout. Store dibuat per provider agar tidak berbagi identitas antar request;
token/password tidak disalin ke store atau localStorage. Pola mengikuti
[panduan Next.js Zustand](https://zustand.docs.pmnd.rs/learn/guides/nextjs).
Event Auth serta fokus kembali ke tab memicu validasi ulang. Gunakan
`requireAdmin()` di setiap Server Action/query fitur berikutnya dan tetap
andalkan RLS untuk otorisasi data; state client hanya untuk tampilan.

Logout mencabut session perangkat saat ini (`scope: local`), membersihkan cookie,
menginvalidasi cache layout, lalu kembali ke login. Kegagalan login/logout
ditampilkan pada form. Route group `(dashboard)` menjaga layout terproteksi;
sidebar/header lengkap mengikuti STORY-005.

```sh
pnpm test:auth
```

Pengujian otomatis memeriksa identitas, tiga role, akun nonaktif/non-admin,
kegagalan database, redirect internal, dan isolasi/reset store. Untuk verifikasi
cloud: buat akun Auth dengan email terkonfirmasi dan password, jalankan SQL
bootstrap di atas, lalu login melalui `/login`. Muat ulang halaman untuk
memastikan cookie persisten; buka `/design-system` secara langsung; logout lalu
coba akses URL tersebut kembali. Akun Auth tanpa baris admin atau dengan
`is_active = false` harus masuk ke `/403` dan tetap bisa logout. Uji ketiga role
dengan akun yang memang disediakan untuk pengujian. Tidak ada akun atau password
default yang dibuat aplikasi.

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

Story 5 memasang shell navigasi pada seluruh halaman `(dashboard)`. Sidebar
menyesuaikan menu berdasarkan role, menyimpan status collapse di localStorage,
dan menandai modul aktif. Header menyediakan profil serta dropdown logout.
Modul pada backlog yang belum tersedia menampilkan placeholder; halaman nested
seperti `/payment/plans` dan `/settings/team` juga menyediakan breadcrumb.
Placeholder melakukan pemeriksaan role di server, sementara query modul nantinya
tetap wajib memakai validasi server dan RLS.

Jalankan `pnpm test:navigation` untuk tes logika navigasi. Review manual story 5
setelah login dengan admin yang sah pada viewport desktop ≥1280px:

- Ciutkan/perluas sidebar, pindah halaman, lalu reload; pilihan tetap tersimpan.
  Buka tab kedua dan periksa sinkronisasi pilihan.
- Buka halaman nested dari Pembayaran atau Pengaturan; periksa breadcrumb dan
  active state menu induk. Menu tim/audit hanya tersedia untuk Super Admin.
- Periksa avatar inisial, nama, email, dan role. Buka dropdown profil lewat
  keyboard, Tab menuju Keluar, Escape untuk menutup, dan klik di luar dropdown.
- Gunakan skip link dengan Tab pertama, lalu uji logout dari dropdown.
- Periksa role Operator dan Finance; menu terbatas disembunyikan dan URL
  placeholder yang tidak diizinkan mengarah ke `/403`.

Review visual/interaksi story 5 belum dilakukan. Adaptasi tablet/mobile tetap P1.

Story 6 menampilkan lima KPI dari Supabase pada `/`, dengan skeleton awal,
refresh otomatis setiap lima menit, tombol refresh, dan pesan kegagalan yang
mempertahankan data terakhir. Operator hanya melihat produk yang di-assign;
Finance mendapat metrik finansial dan produk, sementara Total Users dibatasi.
Database cloud kosong menampilkan nol, tanpa menambahkan seed ke cloud.

MRR menjumlahkan harga subscription berstatus `active`; paket tahunan dibagi 12.
ARR = MRR × 12. Trial, complimentary, canceled, past_due, dan expired tidak
menambah MRR. Total Users mengecualikan soft delete; MicroSaaS Count mencakup
produk aktif maupun nonaktif. Mata uang berbeda ditampilkan terpisah.
Delta menggunakan `(sekarang - sebelumnya) / sebelumnya × 100`, dibulatkan
satu desimal. Baseline nol dengan nilai positif ditandai Baru karena persentase
tidak terdefinisi; nol ke nol ditampilkan 0%.

Nilai 30 hari lalu direkonstruksi dari waktu pembuatan dan before-image audit.
Riwayat berlaku untuk perubahan yang tercatat oleh audit dashboard. Data impor
tanpa riwayat diasumsikan belum berubah sebelum event audit pertamanya;
perubahan melalui service role tanpa identitas admin tidak dicatat oleh trigger
foundation, sehingga integrasi tersebut harus memasok riwayat audit sebelum
delta historisnya dapat dianggap akurat. Event baru diurutkan dengan identity
`event_order`, termasuk beberapa perubahan dalam satu transaksi. Urutan event
lama yang memiliki timestamp sama sebelum migration ini tidak dapat dipulihkan.
RPC memeriksa admin aktif dan assignment di database serta hanya mengembalikan
angka agregat; metadata audit dan PII tidak dikirim ke client.

Jalankan `pnpm test:kpis` untuk memeriksa perhitungan dan izin RPC. Verifikasi
browser story 6 memakai sesi Super Admin yang tersedia: lima kartu nol,
refresh manual, timer 300.000 ms beserta callback polling, error koneksi dengan
data terakhir, pemulihan setelah retry, serta layout desktop 1280px. Skenario
nonzero, mata uang, dan role lainnya diuji di PostgreSQL embedded. Review visual
pengguna tetap diperlukan.

Build dapat dijalankan tanpa menyentuh output dev yang sedang aktif:
`$env:NEXT_DIST_DIR = 'build'; pnpm build` pada PowerShell. Gunakan nilai yang
sama ketika menjalankan `pnpm start`, lalu hapus environment tersebut sebelum
menjalankan `pnpm dev` bila ingin kembali ke output default `.next`.

Referensi: [shadcn manual setup](https://ui.shadcn.com/docs/installation/manual),
[Husky](https://typicode.github.io/husky/get-started.html), dan
[Prettier](https://prettier.io/docs/install).
