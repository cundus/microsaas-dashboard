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

## Deployment Netlify

Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` pada environment
Netlify untuk build/deploy context yang dipakai. Keduanya sengaja masuk ke bundle
browser Next.js. Gunakan anon/publishable key untuk variabel publik tersebut;
service-role key tetap server-only. Akses data dibatasi oleh autentikasi dan RLS,
sesuai [panduan API key Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

`netlify.toml` mengatur `SECRETS_SCAN_OMIT_KEYS` hanya untuk kedua variabel publik
tersebut agar tidak memblokir deployment ketika nilainya ditemukan di output
build atau dokumentasi. Pemindaian secret lainnya tetap aktif. Konfigurasi ini
mengikuti [pengaturan secret scanning Netlify](https://docs.netlify.com/build/environment-variables/secrets-controller/#configure-secret-scanning).
Setelah perubahan konfigurasi tersedia di branch deployment, jalankan deploy ulang.

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

Story 7 menambahkan kartu status per produk di dashboard. `getMicroSaaSList()`
memanggil RPC invoker-rights yang mengikuti RLS: Operator hanya assignment,
Finance hanya ringkasan produk dan MRR, tanpa user count maupun telemetri.
Pengguna soft-deleted dikecualikan. MRR memakai definisi Story 6 dan setiap mata
uang tetap terpisah. Klik kartu membuka ringkasan server di `/microsaas/[slug]`;
produk tidak ditemukan atau tidak terakses menampilkan not-found. Lima tab detail
lengkap belum termasuk Story 7.

Uptime 30 hari adalah rata-rata sampel `performance_metrics` untuk endpoint `/`,
tanpa pembobotan durasi dan tanpa menganggap celah monitoring sebagai uptime.
Health memakai sampel terbaru endpoint `/`: Healthy >=99,5%, Degraded >0 dan
<99,5%, Down 0%. Tanpa sampel atau sampel lebih tua dari 15 menit tampil Unknown;
status registrasi inactive ditampilkan terpisah. Ambang health adalah baseline
implementasi karena PRD belum menetapkannya. Pengumpul telemetri tidak termasuk
story ini; integrasi harus memasok sampel endpoint `/` secara berkala.

Kartu memiliki fallback logo, skeleton, empty state, refresh/polling lima menit,
dan retry yang mempertahankan data terakhir. Jalankan `pnpm test:microsaas`
untuk memeriksa agregasi, health, dan otorisasi. Browser telah memverifikasi empty
state cloud, refresh, kegagalan/pemulihan koneksi, not-found detail, serta kartu
dengan fixture sementara di state browser (empat health state, logo gagal,
multi-currency, nama panjang, layout 1280/1600px). Fixture tidak ditulis ke cloud.
Detail produk nyata dan review visual pengguna masih perlu diverifikasi setelah
produk tersedia. Migration cloud sudah diterapkan dan tipe resmi digenerate ulang.

Story 8 menambahkan grafik MRR harian per MicroSaaS dengan Recharts pada dashboard.
Gunakan 7/30/90 hari atau Custom lalu Terapkan; kedua tanggal dihitung inklusif,
maksimal 366 hari hingga hari ini. Rentang divalidasi juga pada Server Action dan
RPC. Tooltip menampilkan tanggal/nilai saat hover atau navigasi tombol panah.
Setiap produk memiliki seri, gradient, dan legenda; ID produk menjaga seri tetap
terpisah meskipun namanya sama. Bila ada beberapa mata uang, pilih satu melalui
kontrol Mata uang. Nilai lintas mata uang tidak dijumlahkan atau dikonversi.

MRR memakai subscription aktif dan harga tahunan /12 seperti KPI, bukan total
transaksi dibayar. Titik harian adalah keadaan akhir hari Asia/Jakarta; titik
hari ini dihitung pada waktu query. Sebuah rentang tetap dipakai sampai pengguna
mengubah pilihan periode/tanggal. Produk tanpa subscription aktif mendapat nilai
nol; scope tanpa produk menampilkan empty state. Data direfresh tiap lima menit,
dengan skeleton awal serta retry/data terakhir saat refresh gagal. Data periode
sebelumnya disembunyikan ketika periode baru dimuat.

RPC `get_revenue_time_series` memakai definer rights untuk membaca before-image
audit, memeriksa admin aktif dan assignment Operator secara eksplisit, serta
mengembalikan hanya agregat. Finance bisa membaca seluruh revenue. Riwayat harga,
status, mata uang, subscription/produk terhapus direkonstruksi memakai audit
terurut. Keterbatasan audit Story 6 tetap berlaku: keadaan sebelum data impor
atau mutasi tanpa before-image tidak bisa dipastikan. Produk baru tidak memberi
MRR pada hari sebelum dibuat. Mata uang tanpa pendapatan sepanjang rentang
tidak menghasilkan seri; produk tanpa revenue memakai fallback IDR bernilai nol.

Jalankan `pnpm test:revenue` untuk pemeriksaan tanggal, agregasi historis, mata
uang, batas hari WIB, dan otorisasi. Migration cloud sudah diterapkan dan tipe
resmi digenerate ulang. Browser memverifikasi filter preset/custom dan empty
state cloud. Grafik nonzero, tooltip keyboard, IDR/USD, dan pemulihan koneksi
diverifikasi memakai fixture sementara di state browser; fixture tidak ditulis
ke cloud. Pemeriksaan data nyata menunggu produk tersedia dan review visual
pengguna belum dilakukan. Referensi chart: [Recharts API](https://recharts.github.io/en-US/api/).

Story 9 menambahkan grafik batang pertumbuhan pengguna di bawah tren pendapatan.
Pilih 7/30/90 hari atau tanggal Custom, lalu pilih agregasi Harian, Mingguan,
atau Bulanan. Rentang inklusif dibatasi 366 hari sampai hari ini, mengikuti WIB.
Minggu dimulai Senin dan bulan mengikuti kalender; bucket pertama/terakhir
hanya menghitung tanggal yang dipilih. Tooltip menampilkan batas bucket aktual
dan jumlah pendaftaran, termasuk melalui navigasi tombol panah. Periode tanpa
pendaftaran bernilai nol, disertai total periode dan pesan empty state.

Akuisisi dihitung dari `users.created_at` per akun per produk, termasuk akun
yang kemudian banned atau soft-deleted. Akun orang yang sama pada dua produk
dihitung dua kali; ini bukan jumlah orang unik lintas produk atau pertumbuhan
bersih pengguna aktif. Penghapusan fisik/perubahan `created_at` mengubah histori;
query tidak merekonstruksi audit pengguna. Timestamp mendatang tidak dihitung.
RPC invoker-rights mengikuti RLS pengguna: Super Admin seluruh produk, Operator
hanya assignment, Finance ditolak dan grafik disembunyikan. Hanya agregat yang
dikirim ke browser. Skeleton, refresh manual/polling lima menit, pemisahan data
antarfilter, dan retry dengan data terakhir mengikuti pola Story 8.

Jalankan `pnpm test:user-growth` untuk memeriksa batas WIB, agregasi kalender,
periode tepi, zero-fill, validasi RPC, dan akses role. Migration cloud diterapkan
dan tipe resmi digenerate ulang. Browser memverifikasi data nol cloud, filter
preset/custom, agregasi, grafik nonzero/tooltip keyboard memakai fixture di state
browser, serta kegagalan/pemulihan koneksi. Fixture tidak ditulis ke cloud;
verifikasi data pengguna nyata dan review visual pengguna masih diperlukan.

Story 10 menambahkan Aktivitas terbaru (20 item) di bawah grafik pengguna.
Setiap item memiliki ikon/jenis, produk, deskripsi, timestamp WIB, dan link.
Link pengguna/subscription/performa menuju modul yang masih placeholder dengan
filter resource di query string; detail fitur modul mengikuti story berikutnya.
Audit menuju detail produk. Super Admin melihat semua aktivitas, Operator hanya
produk assignment, dan Finance hanya upgrade/churn.

Tabel `dashboard_activity` menyimpan projection tersanitasi dari sumber bisnis.
Trigger mencatat signup pada insert pengguna, upgrade saat MRR subscription
active naik dalam mata uang sama (tahunan /12), dan churn saat status beralih
ke canceled/expired. Perubahan integrasi tanpa JWT admin tetap tercatat.
Error spike adalah crossing error rate >=5% pada sampel minimal 20 request
per endpoint; sampel tinggi berurutan tidak menghasilkan spam hingga ada sampel
di bawah ambang. Masukkan sampel secara kronologis; koreksi/update atau backfill
metrik lama tidak merekonsiliasi episode yang sudah dicatat. Ambang baseline ini
terpisah dari evaluator alert rules yang belum tersedia.

Audit feed memakai allowlist event per produk untuk gateway, promo, alert rule,
serta registry dengan scope tercatat. Email/nama pengguna, raw metadata audit,
dan URL endpoint tidak disalin ke projection. Klien hanya dapat membaca event;
RLS yang sama berlaku untuk RPC maupun Realtime. Histori saat migrasi diisi dari
data sumber dan audit yang tersedia. Churn lama tanpa audit memakai canceled_at
atau updated_at; upgrade tanpa audit historis tidak bisa dipulihkan. Penghapusan
produk menghapus projection produk tersebut melalui FK cascade.

Klien berlangganan INSERT menggunakan
[Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
pada tabel projection saja, lalu memuat ulang daftar melalui Server Action.
Notifikasi digabung per 200 ms, sehingga payload Realtime tidak digabung langsung
ke state. Subscribe/reconnect juga memuat ulang daftar. Saat WebSocket terputus,
refresh fallback berjalan tiap satu menit; online/focus dan tombol Refresh
aktivitas dapat memulihkan data. Error tetap mempertahankan data terakhir.
Unmount membersihkan channel, listener, dan timer.

Jalankan `pnpm test:activity` untuk trigger, backfill historis, normalisasi harga,
crossing error spike, deduplikasi, limit, link, RLS seluruh role, larangan mutasi
event, dan publikasi. Migration cloud sudah diterapkan dan tipe resmi digenerate
ulang. Browser memverifikasi handshake Live, empty state, lima jenis item melalui
fixture state, pemulihan koneksi, dan frame INSERT simulasi yang memicu fetch
baru. Frame simulasi tidak membuktikan pengiriman event bisnis nyata dari cloud;
verifikasi tersebut menunggu data bisnis tersedia. Tidak menambahkan fixture ke
cloud. Review visual pengguna masih diperlukan.

Build dapat dijalankan tanpa menyentuh output dev yang sedang aktif:
`$env:NEXT_DIST_DIR = 'build'; pnpm build` pada PowerShell. Gunakan nilai yang
sama ketika menjalankan `pnpm start`, lalu hapus environment tersebut sebelum
menjalankan `pnpm dev` bila ingin kembali ke output default `.next`.

## Epic 3 — MicroSaaS Management

`/microsaas` menampilkan registry sesuai RLS. Super Admin dapat membuat dan
mengedit produk, mengunggah logo PNG/JPEG/WebP maksimal 1 MB, serta menghapus
produk setelah mengetik nama persis. Slug otomatis mengikuti nama sampai diedit
manual; constraint database menjamin uniqueness. Produk dengan data bisnis terkait
tidak dapat dihapus; gunakan status nonaktif agar riwayat tetap tersimpan.

Detail `/microsaas/[slug]` memiliki Overview, Users, Subscriptions, Revenue, dan
Performance. Tab memuat data produk dari database, dengan pagination server
25/50/100 untuk tabel. Revenue memisahkan mata uang pada MRR/ARR; Performance
memakai uptime 30 hari endpoint `/` dan daftar sampel. Operator hanya mengakses
produk assignment; Finance tidak mendapat tab Users/Performance atau konfigurasi.
Tabel detail bersifat baca; aksi support, override billing, dan monitoring lanjutan
tetap mengikuti epic masing-masing.

Overview Super Admin menyediakan webhook HTTPS, environment, rotasi API key,
dan maintenance dengan konfirmasi nama. API key kosong mempertahankan key lama.
Key dienkripsi AES-256-GCM dengan identitas produk sebagai authenticated data;
ciphertext disimpan di schema `private`, sedangkan metadata dan audit hanya
menyimpan mask tetap. Atur `MICROSAAS_ENCRYPTION_KEY` di environment server:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Simpan key ini di secret manager dan backup; gunakan nilai yang sama pada semua
instance. Key lokal sudah dibuat saat implementasi, tanpa dicatat di Git.
Mengganti key enkripsi memerlukan migrasi ciphertext. Maintenance menyimpan flag;
aplikasi MicroSaaS perlu mengonsumsi flag itu untuk membatasi layanan produk.

Migration `20261019000500` dan `20261019000600` sudah diterapkan pada project
cloud yang terhubung; bucket publik `microsaas-logos` hanya mengizinkan mutasi
Super Admin. Logo lama dibersihkan setelah penggantian/penghapusan produk;
kegagalan pembersihan Storage tidak membatalkan mutasi database yang sudah sukses.
Audit database mencatat CRUD, konfigurasi, dan maintenance secara atomik.

Verifikasi: `pnpm test:microsaas-management`, seluruh 73 tes regresi, typecheck,
dan build produksi lulus. ESLint memakai `--ignore-pattern 'test-results/**'`
untuk mengecualikan artefak eksperimen lama; tiga warning pada script Lighthouse
yang sudah ada tetap terpisah dari Epic 3. Browser dengan session admin cloud
memverifikasi create/edit, upload logo, API key masked, maintenance, lima tab,
dan delete dengan konfirmasi. Produk uji dan logo dibersihkan setelah pengujian;
audit tetap dipertahankan. Tab tabel diuji dengan empty state cloud; data berisi
dan isolasi role diuji di database embedded. Review visual pengguna masih terbuka.

## STORY-014 — User List & Search

`/users` tersedia untuk Super Admin dan Operator. Tabel memakai shared DataTable
dengan avatar/inisial, nama, email, produk, plan berjalan terbaru, status, dan
tanggal bergabung. Pencarian literal nama/email/ID tidak menafsirkan wildcard SQL;
fetch didebounce 300 ms, request lama diabaikan, dan kegagalan bisa dicoba ulang.

Filter produk, plan, status, tanggal bergabung, sorting, page, serta page size
disimpan di URL. Native history menyinkronkan Back/Forward dan kontrol tabel;
server action membaca halaman baru setelah perubahan filter. Reload URL memakai
query yang sama di server. Rentang tanggal inklusif menggunakan Asia/Jakarta.
Ukuran halaman 25/50/100, urutan memiliki ID tie-break, dan page di luar hasil
dikembalikan ke halaman terakhir yang tersedia. Pengguna soft-deleted dikecualikan.

Plan ditentukan dari subscription active/trial/past_due/complimentary terbaru
berdasarkan created_at lalu ID; canceled/expired tidak dianggap sebagai plan
berjalan. Filter plan mengikuti plan yang tampil, tanpa menggandakan pengguna
yang memiliki beberapa subscription. RPC `get_users` memakai security invoker,
sehingga RLS berlaku pada baris, count, serta join plan/produk. Finance, non-admin,
dan akun admin nonaktif ditolak. Tidak memakai service role atau dependency baru.

Migration `20261019000700` sudah diterapkan ke project cloud dan tipe diperbarui.
`pnpm test:users` menguji query/validasi, tanggal WIB, pagination, sorting, beberapa
subscription, isolasi role, debounce, dan respons stale. Seluruh 82 tes, typecheck,
lint file story, serta build produksi lulus. Browser admin cloud memverifikasi
empty state, pencarian/filter/sorting URL, Back, page size, dan URL dengan tanggal.
Data berisi diuji di database embedded; tidak menambahkan seed bisnis ke cloud.
Halaman detail pengguna dan aksi akun mengikuti STORY-015/016.

## STORY-015 — User Detail Page

Klik nama pengguna di `/users` untuk membuka `/users/[userId]`. Halaman memuat
profil, produk, tanggal bergabung/login terakhir (WIB), subscription berjalan,
riwayat transaksi, serta aktivitas login. Subscription active/trial/past_due/
complimentary termasuk; canceled/expired dikecualikan. Setiap tabel mempunyai
pagination server 25/50/100 melalui `subscriptionsPage`, `transactionsPage`,
`loginsPage`, dan `size` di URL. Mata uang ditampilkan per transaksi/subscription.
Finance ditolak; Operator mengikuti assignment, termasuk query count/riwayat.
User tidak ditemukan, tidak terakses, atau soft-deleted menghasilkan not-found.

Migration `20261019000800_user_login_history.sql` sudah diterapkan ke cloud.
Riwayat login berasal dari insert/perubahan `users.last_login_at` oleh integrasi
MicroSaaS, bukan login admin dashboard. Kirim timestamp login produk yang sebenarnya
setiap login berhasil; timestamp identik tidak menghasilkan event ganda.
Backfill hanya menyimpan login terakhir yang tersedia, sehingga riwayat sebelumnya,
IP, perangkat, dan login gagal tidak tersedia. Browser tidak dapat menulis tabel
riwayat secara langsung. Tipe Supabase sudah diperbarui.

Jalankan `pnpm test:user-detail` untuk validasi, scope action, pagination/error,
fallback avatar sebelum hydration, trigger/backfill login, dan RLS. Pengujian
browser memakai session admin cloud untuk not-found/URL invalid dan fixture lokal
sementara untuk tampilan berisi/kosong, IDR/USD, tautan pagination, serta avatar.
Fixture lokal sudah dihapus; tidak menambahkan data bisnis ke cloud. Pemeriksaan
aksesibilitas fixture menemukan 0 pelanggaran. Data pengguna cloud nyata dan review
visual pengguna masih perlu diverifikasi. Aksi akun mengikuti STORY-016.

## STORY-016 — User Actions

Detail `/users/[userId]` menyediakan Ban/Unban, Reset password, dan Hapus akun
untuk Super Admin dan Operator sesuai assignment. Ban wajib alasan maksimal
500 karakter; Unban mengembalikan status sebelumnya, termasuk trial. Ban lama
tanpa snapshot kembali ke active. Alasan ban tampil di profil. Hapus akun wajib
konfirmasi email yang cocok dan memakai soft delete; histori keuangan tetap
disimpan. Setelah berhasil, pengguna kembali ke daftar. ConfirmDialog reusable
dan Sonner menampilkan pending, sukses, serta error/retry.

Migration `20261019000900_user_actions.sql` diterapkan ke cloud; tipe database
diperbarui. RPC `manage_user` memeriksa role/scope dari database, mengunci baris,
dan menjalankan mutasi beserta audit before/after secara atomik. Hard delete
users dicabut dari authenticated. Tidak memakai service role. Integrasi produk
harus membaca status banned/deleted untuk menegakkan akses; perubahan status
dashboard tidak otomatis mencabut sesi Auth produk.

Reset memanggil [Supabase resetPasswordForEmail](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)
dengan email dari baris yang diotorisasi dan redirect URL produk dari registry.
Client Auth terpisah memakai implicit flow tanpa menyimpan sesi atau PKCE
verifier di cookie admin. Akun produk harus menggunakan Supabase Auth project
yang sama. Tambahkan URL produk ke Auth Redirect URLs; aplikasi produk harus
menangani `PASSWORD_RECOVERY` dan formulir `updateUser({ password })` sesuai
[panduan password recovery](https://supabase.com/docs/guides/auth/passwords).
Project Auth terpisah membutuhkan integrasi reset produk tersendiri. Audit
mencatat permintaan, dengan jeda 60 detik per user lintas admin. Respons sukses
tidak menjamin email terkirim atau email terdaftar di Auth.

Jalankan `pnpm test:user-actions`. Seluruh 88 tes regresi, typecheck, lint file
story, dan build produksi lulus. Browser memverifikasi dialog, konfirmasi email,
serta error/toast memakai fixture lokal sementara yang sudah dihapus. Tidak
mengubah akun bisnis cloud atau mengirim email nyata selama pengujian.
Pengiriman email/reset dicatat sebagai **pending E2E manual test** pada
[checklist STORY-016](docs/BACKLOG.md#story-016--user-actions-ban-reset-password-delete).
Review visual pengguna masih terbuka.

Referensi: [shadcn manual setup](https://ui.shadcn.com/docs/installation/manual),
[Husky](https://typicode.github.io/husky/get-started.html), dan
[Prettier](https://prettier.io/docs/install).
