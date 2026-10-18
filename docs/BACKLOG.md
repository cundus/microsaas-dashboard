# Product Backlog
## Multi-MicroSaaS Admin Dashboard

**Versi:** 1.1.0
**Terakhir Diupdate:** 2026-10-18  
**Referensi:** [PRD.md](./PRD.md)

---

## Legenda

| Simbol | Arti |
|---|---|
| 🔴 | Priority: P0 — Must Have (MVP Blocker) |
| 🟠 | Priority: P1 — Should Have |
| 🟡 | Priority: P2 — Nice to Have |
| 🟢 | Priority: P3 — Future |
| ☐ | Belum dikerjakan |
| 🔄 | Sedang dikerjakan |
| ✅ | Selesai |

**Story Point (SP):** Ukuran relatif kompleksitas, bukan konversi jam. Kapasitas perencanaan sementara: 40 SP per sprint dua minggu; validasi lewat velocity aktual.

**Kontrak dokumen:** PRD menentukan scope/prioritas/hak akses; DESIGN.md menentukan token/layout. P0 = MVP, P1 = Growth, P2 = Scale, P3 = Future. Story campuran mengikuti prioritas per requirement di tabel pemetaan di bawah. Task ☐ belum menjadi bukti fitur tersedia. Estimasi baseline belum mencakup gap yang ditandai belum diestimasi.

**Viewport:** desktop ≥1280px wajib pada P0; tablet 768–1279px dan mobile 360–767px pada P1. Sidebar/header adalah navigasi MVP; dock mobile opsional.

---

## EPIC 1 — Foundation & Infrastructure

> Setup proyek, auth sistem, skema database, dan design system sebagai fondasi semua fitur.

---

### STORY-001 🔴 — Setup Project & Tooling

**Sebagai** developer,  
**saya ingin** project siap dijalankan secara lokal dan di production,  
**agar** seluruh tim bisa mulai berkontribusi dengan baseline yang sama.

**Acceptance Criteria:**
- Next.js 14+ dengan App Router dan TypeScript terkonfigurasi
- ESLint + Prettier + Husky pre-commit hook aktif
- Tailwind CSS + shadcn/ui terintegrasi
- Environment variables terdefinisi (`.env.local.example`)
- `README.md` dengan instruksi setup lengkap

| # | Task | SP | Status |
|---|---|---|---|
| T-001 | Init Next.js 14+ (App Router) dengan TypeScript | 1 | ☐ |
| T-002 | Setup Tailwind CSS + shadcn/ui | 1 | ☐ |
| T-003 | Konfigurasi font: Plus Jakarta Sans, Inter, JetBrains Mono | 1 | ☐ |
| T-004 | Setup ESLint + Prettier + Husky | 1 | ☐ |
| T-005 | Buat `.env.local.example` dan dokumentasi env vars | 1 | ☐ |
| T-006 | Setup folder structure (app/, components/, lib/, types/) | 1 | ☐ |
| T-007 | Konfigurasi path alias (`@/`) di tsconfig | 1 | ☐ |

**Total SP: 7**

---

### STORY-002 🔴 — Design System Implementation (Kinetic Obsidian)

**Sebagai** developer,  
**saya ingin** design system Kinetic Obsidian terimplementasi sebagai token CSS dan komponen dasar,  
**agar** semua halaman konsisten secara visual.

**Acceptance Criteria:**
- CSS variables mengikuti nilai HEX canonical pada front matter DESIGN.md dan mapping shadcn PRD §7.2
- Komponen dasar shadcn/ui tersedia: Button, Card, Badge, Input, Select, Dialog (modal)
- Dark mode aktif sebagai default (tidak ada light mode toggle)
- Glassmorphism utility class tersedia

| # | Task | SP | Status |
|---|---|---|---|
| T-008 | Definisikan color tokens sebagai CSS variables di `globals.css` | 2 | ☐ |
| T-009 | Buat `tailwind.config.ts` dengan extend colors, fonts, borderRadius | 2 | ☐ |
| T-010 | Buat komponen `Button` (primary, secondary, destructive, ghost) | 2 | ☐ |
| T-011 | Buat komponen `Card` dengan glassmorphism style | 2 | ☐ |
| T-012 | Buat komponen `Badge` / `Chip` (status, pill-shaped) | 1 | ☐ |
| T-013 | Buat komponen `StatCard` untuk metric display | 2 | ☐ |
| T-014 | Buat komponen `DataTable` (sortable, filterable, paginated) | 5 | ☐ |
| T-015 | Buat utility CSS class untuk glassmorphism (`.glass-panel`) | 1 | ☐ |

**Total SP: 17**

---

### STORY-003 🔴 — Supabase Setup & Database Schema

**Sebagai** developer,  
**saya ingin** skema database Supabase tersedia lengkap dengan RLS dan seed data,  
**agar** semua modul bisa mulai dibangun di atas fondasi data yang benar.

**Acceptance Criteria:**
- Semua tabel terdefinisi dengan kolom, tipe, dan constraint yang tepat
- RLS policy aktif di semua tabel sensitif
- Migration file tersimpan di `/supabase/migrations/`
- Seed script untuk data dummy tersedia
- Supabase client (server + browser) terkonfigurasi

| # | Task | SP | Status |
|---|---|---|---|
| T-016 | Init Supabase project dan setup local dev (`supabase start`) | 1 | ☐ |
| T-017 | Buat migration: tabel `microsaas` | 1 | ☐ |
| T-018 | Buat migration: tabel `admin_users` dan `admin_roles` | 2 | ☐ |
| T-019 | Buat migration: tabel `users` (agregat dari semua MicroSaaS) | 2 | ☐ |
| T-020 | Buat migration: tabel `subscriptions`, `plans` | 2 | ☐ |
| T-021 | Buat migration: tabel `transactions`, `invoices` | 2 | ☐ |
| T-022 | Buat migration: tabel `payment_gateways`, `promo_codes` | 2 | ☐ |
| T-023 | Buat migration: tabel `performance_metrics`, `audit_logs` | 2 | ☐ |
| T-024 | Buat migration: tabel `alert_rules`, `alert_logs` | 1 | ☐ |
| T-025 | Buat migration: tabel `admin_assignments` (operator per MicroSaaS) | 1 | ☐ |
| T-026 | Definisikan RLS policy: Super Admin akses penuh berbasis role; audit append-only | 3 | ☐ |
| T-027 | Definisikan RLS policy: Operator Admin — scoped ke MicroSaaS | 3 | ☐ |
| T-028 | Definisikan RLS policy: Finance Admin — read-only revenue tables | 2 | ☐ |
| T-029 | Setup Supabase client di Next.js (server + browser + middleware) | 2 | ☐ |
| T-030 | Buat seed script dengan dummy data (3 MicroSaaS, 50 users, dll.) | 3 | ☐ |
| T-031 | Generate TypeScript types dari Supabase schema | 1 | ☐ |

**Total SP: 30**

---

### STORY-004 🔴 — Authentication & Session Management

**Sebagai** admin,  
**saya ingin** bisa login dan logout dengan aman,  
**agar** hanya admin yang sah yang bisa mengakses dashboard.

**Acceptance Criteria:**
- Halaman login dengan email + password
- Session persistent via Supabase Auth cookie
- Redirect ke login jika tidak ter-autentikasi
- Role admin ter-load di session context
- Middleware proteksi semua route `/` kecuali `/login`

| # | Task | SP | Status |
|---|---|---|---|
| T-032 | Buat halaman `/login` dengan form email + password | 2 | ☐ |
| T-033 | Implementasi Supabase Auth sign-in logic (Server Action) | 2 | ☐ |
| T-034 | Buat middleware Next.js untuk proteksi route | 2 | ☐ |
| T-035 | Buat `AuthContext` / hook `useAuth()` untuk akses session di client | 2 | ☐ |
| T-036 | Implementasi logout dan invalidate session | 1 | ☐ |
| T-037 | Buat halaman error: 401 Unauthorized, 403 Forbidden | 1 | ☐ |

**Total SP: 10**

---

### STORY-005 🔴 — Layout & Navigation Shell

**Sebagai** admin,  
**saya ingin** layout dashboard yang konsisten dengan navigasi yang mudah digunakan,  
**agar** saya bisa berpindah modul dengan cepat.

**Acceptance Criteria:**
- Sidebar navigasi dengan semua menu utama
- Header dengan info user yang sedang login + dropdown logout
- Breadcrumb pada halaman nested
- Sidebar collapsible dengan state persist pada desktop ≥1280px; adaptasi tablet/mobile P1
- Active state pada menu yang sedang aktif

| # | Task | SP | Status |
|---|---|---|---|
| T-038 | Buat komponen `AppShell` (sidebar + header + content area) | 3 | ☐ |
| T-039 | Buat komponen `Sidebar` dengan semua menu items dan icon | 3 | ☐ |
| T-040 | Buat komponen `Header` dengan user avatar, nama, dan role | 2 | ☐ |
| T-041 | Buat komponen `Breadcrumb` yang dinamis | 1 | ☐ |
| T-042 | Implementasi collapsible sidebar dengan state persist (localStorage) | 2 | ☐ |
| T-043 | Buat `RootLayout` yang membungkus semua halaman admin | 1 | ☐ |

**Total SP: 12**

---

## EPIC 2 — Global Dashboard

> Halaman utama yang menampilkan ringkasan KPI dan status semua MicroSaaS.

---

### STORY-006 🔴 — KPI Summary Cards

**Sebagai** Super Admin,  
**saya ingin** melihat KPI agregat di bagian atas dashboard,  
**agar** saya bisa mengetahui kondisi bisnis secara keseluruhan sekilas.

**Acceptance Criteria:**
- 5 metric card: Total Users, Total MRR, Total ARR, Active Subscriptions, MicroSaaS Count
- Setiap card menampilkan delta persentase vs periode sebelumnya
- Data refresh otomatis setiap 5 menit
- Loading skeleton saat data sedang di-fetch

| # | Task | SP | Status |
|---|---|---|---|
| T-044 | Buat Server Action `getGlobalKPIs()` (aggregate query ke Supabase) | 3 | ☐ |
| T-045 | Buat komponen `KPICardGrid` dengan 5 metric cards | 2 | ☐ |
| T-046 | Implementasi delta calculation (% perubahan vs 30 hari lalu) | 2 | ☐ |
| T-047 | Tambahkan loading skeleton ke KPI cards | 1 | ☐ |

**Total SP: 8**

---

### STORY-007 🔴 — MicroSaaS Status Cards

**Sebagai** Super Admin,  
**saya ingin** melihat kartu ringkasan tiap MicroSaaS dengan health indicator,  
**agar** saya bisa mengidentifikasi produk yang bermasalah dengan cepat.

**Acceptance Criteria:**
- Satu card per MicroSaaS berisi: nama, logo, user count, MRR, uptime %, status badge
- Status badge: Healthy / Degraded / Down
- Klik pada card navigasi ke halaman detail MicroSaaS
- Empty state jika belum ada MicroSaaS terdaftar

| # | Task | SP | Status |
|---|---|---|---|
| T-048 | Buat query `getMicroSaaSList()` dengan data agregat | 3 | ☐ |
| T-049 | Buat komponen `MicroSaaSCard` dengan semua informasi | 2 | ☐ |
| T-050 | Implementasi status health indicator logic | 2 | ☐ |
| T-051 | Buat grid layout responsif untuk MicroSaaS cards | 1 | ☐ |

**Total SP: 8**

---

### STORY-008 🔴 — Revenue Trend Chart

**Sebagai** Super Admin,  
**saya ingin** melihat grafik tren pendapatan dengan range waktu yang bisa dipilih,  
**agar** saya bisa memahami pola pertumbuhan bisnis.

**Acceptance Criteria:**
- Area chart dengan data MRR per hari
- Toggle: 7 hari / 30 hari / 90 hari / Custom date range
- Tooltip saat hover menampilkan nilai dan tanggal
- Chart breakdown per MicroSaaS (multi-series dengan warna berbeda)

| # | Task | SP | Status |
|---|---|---|---|
| T-052 | Install dan konfigurasi Recharts | 1 | ☐ |
| T-053 | Buat Server Action `getRevenueTimeSeries(range)` | 3 | ☐ |
| T-054 | Buat komponen `RevenueAreaChart` dengan Recharts | 3 | ☐ |
| T-055 | Implementasi date range picker dan toggle period | 2 | ☐ |
| T-056 | Styling chart: cyan gradient fill, grid hairlines, tooltip glassmorphism | 2 | ☐ |

**Total SP: 11**

---

### STORY-009 🟠 — User Growth Chart

**Sebagai** Admin,  
**saya ingin** melihat grafik pertumbuhan user baru per hari/minggu,  
**agar** saya bisa menganalisis efektivitas akuisisi.

| # | Task | SP | Status |
|---|---|---|---|
| T-057 | Buat Server Action `getUserGrowthTimeSeries(range)` | 2 | ☐ |
| T-058 | Buat komponen `UserGrowthBarChart` | 2 | ☐ |
| T-059 | Integrasi date range filter ke chart | 1 | ☐ |

**Total SP: 5**

---

### STORY-010 🟠 — Activity Feed

**Sebagai** Admin,  
**saya ingin** melihat feed aktivitas terbaru dari semua MicroSaaS,  
**agar** saya tetap tahu kejadian penting tanpa harus cek satu per satu.

**Acceptance Criteria:**
- Feed menampilkan: signup baru, upgrade plan, churn, error spike
- Setiap item memiliki ikon, deskripsi, timestamp, dan link ke resource terkait
- Realtime update via Supabase Realtime WebSocket

| # | Task | SP | Status |
|---|---|---|---|
| T-060 | Buat query `getRecentActivity(limit)` dari signup, perubahan subscription, metrik error, dan audit admin yang relevan | 2 | ☐ |
| T-061 | Buat komponen `ActivityFeed` dengan item list | 2 | ☐ |
| T-062 | Subscribe ke Supabase Realtime channel untuk live updates | 3 | ☐ |

**Total SP: 7**

---

## EPIC 3 — MicroSaaS Management

> Pengelolaan registry dan konfigurasi tiap MicroSaaS.

---

### STORY-011 🔴 — MicroSaaS CRUD

**Sebagai** Super Admin,  
**saya ingin** bisa menambah, mengedit, dan menghapus MicroSaaS,  
**agar** registry produk selalu up-to-date.

**Acceptance Criteria:**
- Halaman `/microsaas` dengan daftar semua MicroSaaS
- Form tambah/edit: nama, slug (auto-generate), deskripsi, logo upload, URL, status
- Hapus MicroSaaS memerlukan konfirmasi (dengan ketik nama produk)
- Audit log tercatat saat CRUD

| # | Task | SP | Status |
|---|---|---|---|
| T-063 | Buat halaman `/microsaas` dengan daftar dan tombol tambah | 2 | ☐ |
| T-064 | Buat Server Action: `createMicroSaaS()` | 2 | ☐ |
| T-065 | Buat Server Action: `updateMicroSaaS()` | 2 | ☐ |
| T-066 | Buat Server Action: `deleteMicroSaaS()` | 2 | ☐ |
| T-067 | Buat komponen `MicroSaaSForm` (modal/drawer) | 3 | ☐ |
| T-068 | Implementasi konfirmasi delete dengan input nama produk | 2 | ☐ |
| T-069 | Implementasi logo upload via Supabase Storage | 3 | ☐ |
| T-070 | Auto-generate slug dari nama dengan validasi uniqueness | 1 | ☐ |

**Total SP: 17**

---

### STORY-012 🔴 — MicroSaaS Detail Page

**Sebagai** Admin,  
**saya ingin** melihat halaman detail tiap MicroSaaS dengan tab-tab terpisah,  
**agar** saya bisa mengelola setiap aspek produk secara terorganisir.

**Acceptance Criteria:**
- URL: `/microsaas/[slug]`
- Tab: Overview, Users, Subscriptions, Revenue, Performance
- Setiap tab memuat data yang relevan dengan MicroSaaS tersebut

| # | Task | SP | Status |
|---|---|---|---|
| T-071 | Buat layout halaman `/microsaas/[slug]` dengan tab navigation | 2 | ☐ |
| T-072 | Buat tab Overview: KPI mini (P0) + recent activity (P1, mengikuti FR-05) | 2 | ☐ |
| T-073 | Integrasi tab Users, Subscriptions, Revenue, Performance dari epic terkait; stub tidak memenuhi acceptance MVP | 1 | ☐ |

**Total SP: 5**

---

### STORY-013 🟠 — MicroSaaS Configuration

**Sebagai** Super Admin,  
**saya ingin** mengatur konfigurasi teknis tiap MicroSaaS,  
**agar** integrasi antar sistem bisa dikelola dari satu tempat.

| # | Task | SP | Status |
|---|---|---|---|
| T-074 | Form konfigurasi: webhook URL, API key display (masked), environment | 3 | ☐ |
| T-075 | Toggle maintenance mode dengan konfirmasi | 2 | ☐ |
| T-076 | Simpan konfigurasi secara aman (enkripsi secrets di DB) | 3 | ☐ |

**Total SP: 8**

---

## EPIC 4 — User Management

> Pencarian, pengelolaan, dan aksi pada end-user dari semua MicroSaaS.

---

### STORY-014 🔴 — User List & Search

**Sebagai** Admin,  
**saya ingin** melihat daftar semua user dengan kemampuan filter dan search,  
**agar** saya bisa menemukan user yang perlu dikelola dengan cepat.

**Acceptance Criteria:**
- Tabel user dengan kolom: Avatar, Nama, Email, MicroSaaS, Plan, Status, Join Date
- Search by email / nama / user ID
- Filter: MicroSaaS, Plan, Status (active/banned/trial), tanggal bergabung
- Sortable kolom
- Pagination (25 / 50 / 100 per halaman)

| # | Task | SP | Status |
|---|---|---|---|
| T-077 | Buat halaman `/users` | 1 | ☐ |
| T-078 | Buat Server Action `getUsers(filters, pagination)` dengan query Supabase | 3 | ☐ |
| T-079 | Implementasi search dengan debounce (300ms) | 2 | ☐ |
| T-080 | Implementasi multi-filter (MicroSaaS, Plan, Status) via URL params | 2 | ☐ |
| T-081 | Buat komponen `UserTable` dengan kolom dan sorting | 3 | ☐ |
| T-082 | Implementasi pagination dengan URL params | 2 | ☐ |

**Total SP: 13**

---

### STORY-015 🔴 — User Detail Page

**Sebagai** Admin,  
**saya ingin** melihat profil lengkap seorang user,  
**agar** saya bisa memahami riwayat dan status akun mereka secara menyeluruh.

**Acceptance Criteria:**
- URL: `/users/[userId]`
- Tampilkan: info profil, subscription aktif, riwayat transaksi, log login terakhir
- Semua data terformat rapi dengan komponen yang konsisten; detail invoice/gateway response mengikuti FR-43 (P1)

| # | Task | SP | Status |
|---|---|---|---|
| T-083 | Buat halaman `/users/[userId]` | 1 | ☐ |
| T-084 | Buat Server Action `getUserById(userId)` | 2 | ☐ |
| T-085 | Buat section: Profil User (avatar, nama, email, join date, MicroSaaS) | 2 | ☐ |
| T-086 | Buat section: Subscription aktif saat ini | 2 | ☐ |
| T-087 | Buat section: Riwayat transaksi user | 2 | ☐ |
| T-088 | Buat section: Log aktivitas / login history | 2 | ☐ |

**Total SP: 11**

---

### STORY-016 🔴 — User Actions (Ban, Reset Password, Delete)

**Sebagai** Admin,  
**saya ingin** melakukan aksi pada akun user dari halaman detail mereka,  
**agar** saya bisa menangani masalah akun tanpa akses langsung ke database.

**Acceptance Criteria:**
- Tombol Ban/Unban: mengubah status user + catat audit log
- Reset Password: trigger Supabase Auth reset email
- Delete Account: konfirmasi wajib + soft delete + audit log
- Feedback visual (toast/snackbar) setelah setiap aksi

| # | Task | SP | Status |
|---|---|---|---|
| T-089 | Buat Server Action `banUser(userId, reason)` | 2 | ☐ |
| T-090 | Buat Server Action `unbanUser(userId)` | 1 | ☐ |
| T-091 | Buat Server Action `resetUserPassword(userId)` | 2 | ☐ |
| T-092 | Buat Server Action `deleteUser(userId)` dengan soft delete | 2 | ☐ |
| T-093 | Buat komponen `UserActionsMenu` (dropdown atau button group) | 2 | ☐ |
| T-094 | Buat komponen `ConfirmDialog` yang reusable | 2 | ☐ |
| T-095 | Setup toast notification sistem (Sonner) | 1 | ☐ |

**Total SP: 12**

---

### STORY-017 🟠 — Impersonate User

**Sebagai** Super Admin,  
**saya ingin** login sebagai user tertentu,  
**agar** saya bisa mereproduksi bug atau membantu user tanpa meminta credentials mereka.

**Acceptance Criteria:**
- Tombol "Impersonate" hanya muncul untuk Super Admin
- Membuka tab baru dengan session user tersebut
- Banner "Impersonating as [nama]" selalu terlihat selama sesi
- Aksi impersonate selalu tercatat di audit log
- Tombol "Stop Impersonating" mengakhiri sesi dan kembali ke admin

| # | Task | SP | Status |
|---|---|---|---|
| T-096 | Buat Server Action `createImpersonateToken(userId)` | 3 | ☐ |
| T-097 | Implementasi redirect ke MicroSaaS dengan token impersonate | 2 | ☐ |
| T-098 | Catat audit log impersonate (siapa, kapan, siapa yang di-impersonate) | 1 | ☐ |

**Total SP: 6**

---

### STORY-018 🟡 — Bulk Actions & Export

**Sebagai** Admin,  
**saya ingin** melakukan aksi pada banyak user sekaligus dan mengekspor data,  
**agar** saya bisa bekerja lebih efisien.

| # | Task | SP | Status |
|---|---|---|---|
| T-099 | Implementasi checkbox selection di UserTable | 2 | ☐ |
| T-100 | Bulk action: Export CSV user yang dipilih | 3 | ☐ |
| T-101 | Bulk action: Bulk ban dengan reason | 2 | ☐ |
| T-102 | Buat komponen `BulkActionBar` (muncul saat ada selection) | 2 | ☐ |

**Total SP: 9**

---

## EPIC 5 — Subscription Management

> Pengelolaan subscription, plan, dan deteksi churn.

---

### STORY-019 🔴 — Subscription List

**Sebagai** Admin,  
**saya ingin** melihat semua subscription dengan status dan detail plan,  
**agar** saya bisa memantau kesehatan subscription bisnis.

**Acceptance Criteria:**
- Tabel subscription: User, MicroSaaS, Plan, Status, Next Billing Date, Amount
- Detail subscription: plan, billing cycle, next payment date, payment method (FR-31, P0; bagian T-105)
- Tab filter: All / Active / Trial / Past Due / Canceled
- Sortable dan filterable

| # | Task | SP | Status |
|---|---|---|---|
| T-103 | Buat halaman `/subscriptions` | 1 | ☐ |
| T-104 | Buat Server Action `getSubscriptions(filters)` | 3 | ☐ |
| T-105 | Buat komponen `SubscriptionTable` dengan status badges | 3 | ☐ |
| T-106 | Implementasi filter tabs (All/Active/Trial/Past Due/Canceled) | 1 | ☐ |

**Total SP: 8**

---

### STORY-020 🔴/🟠 — Subscription Override (P0/P1)

**Sebagai** Admin,  
**saya ingin** mengubah subscription user secara manual,  
**agar** saya bisa menangani kasus khusus (kompensasi, migrasi, dll.).

**Acceptance Criteria:**
- Upgrade / Downgrade plan (pilih plan baru dari dropdown)
- Extend trial period
- Cancel subscription (immediate atau end of period)
- Tambah subscription gratis / complimentary (FR-33, P1; bukan syarat MVP)
- Semua aksi tercatat di audit log

| # | Task | SP | Status |
|---|---|---|---|
| T-107 | Buat Server Action `changeSubscriptionPlan(subId, newPlanId)` | 3 | ☐ |
| T-108 | Buat Server Action `extendTrial(subId, days)` | 2 | ☐ |
| T-109 | Buat Server Action `cancelSubscription(subId, mode)` | 2 | ☐ |
| T-110 | Buat Server Action `grantComplimentarySubscription(userId, planId)` | 2 | ☐ |
| T-111 | Buat komponen `SubscriptionOverrideModal` | 3 | ☐ |

**Total SP: 12**

---

### STORY-021 🟠 — Churn Risk Dashboard

**Sebagai** Admin,  
**saya ingin** melihat daftar user yang berisiko churn,  
**agar** saya bisa mengambil tindakan retensi proaktif.

**Acceptance Criteria:**
- Daftar user dengan trial expired dalam 7 hari ke depan
- Daftar user dengan status `past_due` (gagal bayar)
- Grafik churn rate bulanan

| # | Task | SP | Status |
|---|---|---|---|
| T-112 | Buat Server Action `getChurnRiskUsers()` | 3 | ☐ |
| T-113 | Buat komponen `ChurnRiskTable` dengan CTA aksi cepat | 2 | ☐ |
| T-114 | Buat grafik `ChurnRateChart` (bar chart bulanan) | 3 | ☐ |

**Total SP: 8**

---

## EPIC 6 — Revenue & Finance

> Dashboard keuangan dan riwayat transaksi.

---

### STORY-022 🔴 — Revenue Dashboard

**Sebagai** Finance Admin,  
**saya ingin** melihat ringkasan pendapatan dengan breakdown detail,  
**agar** saya bisa memantau kesehatan keuangan secara real-time.

**Acceptance Criteria:**
- Metric cards: MRR, ARR, New MRR, Expansion MRR, Churned MRR
- Breakdown per MicroSaaS (tabel dan pie/donut chart)
- Breakdown per plan
- Filter date range

| # | Task | SP | Status |
|---|---|---|---|
| T-115 | Buat halaman `/revenue` | 1 | ☐ |
| T-116 | Buat Server Action `getRevenueMetrics(dateRange)` | 3 | ☐ |
| T-117 | Buat komponen metric cards (MRR, ARR, dll.) | 2 | ☐ |
| T-118 | Buat `RevenueBreakdownTable` per MicroSaaS | 2 | ☐ |
| T-119 | Buat `RevenueDonutChart` breakdown per produk | 3 | ☐ |

**Total SP: 11**

---

### STORY-023 🔴/🟠 — Transaction History (P0/P1)

**Sebagai** Finance Admin,  
**saya ingin** melihat semua riwayat transaksi dengan detail lengkap,  
**agar** saya bisa menangani dispute dan pertanyaan pembayaran.

**Acceptance Criteria:**
- Tabel transaksi: User, MicroSaaS, Amount, Status, Gateway, Tanggal
- Filter: status (success/failed/refunded), gateway, MicroSaaS, date range
- Klik row → detail transaksi (modal): invoice, payment method, gateway response (FR-43, P1)
- Export CSV transaksi (FR-44, P1); daftar/filter transaksi tetap P0

| # | Task | SP | Status |
|---|---|---|---|
| T-120 | Buat halaman `/revenue/transactions` | 1 | ☐ |
| T-121 | Buat Server Action `getTransactions(filters, pagination)` | 3 | ☐ |
| T-122 | Buat komponen `TransactionTable` | 3 | ☐ |
| T-123 | Buat `TransactionDetailModal` dengan data lengkap | 2 | ☐ |
| T-124 | Implementasi export CSV transaksi | 2 | ☐ |

**Total SP: 11**

---

## EPIC 7 — Payment Configuration

> Konfigurasi gateway, pricing plan, dan promo code.

---

### STORY-024 🔴 — Payment Gateway Configuration

**Sebagai** Super Admin,  
**saya ingin** mengkonfigurasi payment gateway dari dashboard,  
**agar** semua MicroSaaS menggunakan konfigurasi yang sama dan terpusat.

**Acceptance Criteria:**
- Form per gateway: Stripe dan Midtrans; gateway tambahan memerlukan adapter yang mendukung provider tersebut
- Field: API Key (public + secret), Webhook Secret, Mode (sandbox/production)
- Secret fields ditampilkan masked, klik untuk reveal
- Test connection button
- Simpan dengan enkripsi

| # | Task | SP | Status |
|---|---|---|---|
| T-125 | Buat halaman `/payment/gateways` | 1 | ☐ |
| T-126 | Buat Server Action `saveGatewayConfig(gateway, config)` dengan enkripsi | 5 | ☐ |
| T-127 | Buat komponen `GatewayConfigForm` per gateway | 3 | ☐ |
| T-128 | Implementasi "Test Connection" button dengan ping ke gateway API | 3 | ☐ |
| T-129 | Implementasi masked input untuk secret fields (toggle show/hide) | 1 | ☐ |

**Total SP: 13**

---

### STORY-025 🔴 — Pricing Plan Management

**Sebagai** Super Admin,  
**saya ingin** membuat dan mengelola pricing plan,  
**agar** perubahan harga bisa diterapkan ke semua MicroSaaS dengan mudah.

**Acceptance Criteria:**
- CRUD pricing plan: nama, harga, interval (monthly/annual), fitur list, trial period
- Assign plan ke satu atau banyak MicroSaaS
- Preview visual plan (T-135, P0); workflow draft/publish harga dan grandfathering terpisah pada FR-53 (P1, belum diestimasi)
- Arsipkan plan (tidak dihapus agar tidak merusak subscription aktif)

| # | Task | SP | Status |
|---|---|---|---|
| T-130 | Buat halaman `/payment/plans` | 1 | ☐ |
| T-131 | Buat Server Action `createPlan()`, `updatePlan()`, `archivePlan()` | 3 | ☐ |
| T-132 | Buat komponen `PlanForm` (modal) dengan field lengkap | 3 | ☐ |
| T-133 | Implementasi feature list editor (dynamic add/remove baris) | 2 | ☐ |
| T-134 | Buat multi-select assign plan ke MicroSaaS | 2 | ☐ |
| T-135 | Buat `PlanPreviewCard` (preview tampilan pricing) | 2 | ☐ |

**Total SP: 13**

---

### STORY-026 🟠 — Promo Code Management

**Sebagai** Super Admin,  
**saya ingin** membuat promo code / coupon,  
**agar** saya bisa menjalankan promosi tanpa harus coding.

**Acceptance Criteria:**
- Buat promo code: kode, diskon (% atau nominal), masa berlaku, max usage, berlaku untuk plan tertentu
- Daftar promo code aktif / expired dengan usage count
- Nonaktifkan promo code kapan saja

| # | Task | SP | Status |
|---|---|---|---|
| T-136 | Buat halaman `/payment/promo-codes` | 1 | ☐ |
| T-137 | Buat Server Action CRUD promo code | 3 | ☐ |
| T-138 | Buat komponen `PromoCodeForm` dan tabel promo code | 3 | ☐ |
| T-139 | Implementasi auto-generate kode random | 1 | ☐ |

**Total SP: 8**

---

### STORY-027 🟠 — Webhook Log

**Sebagai** Admin,  
**saya ingin** melihat log request/response dari payment gateway,  
**agar** saya bisa men-debug masalah pembayaran yang gagal.

| # | Task | SP | Status |
|---|---|---|---|
| T-140 | Buat tabel log webhook (endpoint, payload, response, status, timestamp) | 2 | ☐ |
| T-141 | Buat halaman `/payment/webhook-logs` dengan filter | 2 | ☐ |
| T-142 | Buat modal detail webhook log dengan JSON viewer | 2 | ☐ |

**Total SP: 6**

---

## EPIC 8 — Performance Monitoring

> Pemantauan uptime, response time, dan error rate tiap MicroSaaS.

---

### STORY-028 🔴 — Uptime Dashboard

**Sebagai** Admin,  
**saya ingin** melihat uptime tiap MicroSaaS,  
**agar** saya tahu mana yang sedang atau pernah down.

**Acceptance Criteria:**
- Persentase uptime 30 hari per MicroSaaS
- Visual timeline uptime (bar hijau/merah per hari)
- Data diambil dari tabel `performance_metrics`
- Uptime tersedia juga pada tab Performance per MicroSaaS (FR-11/FR-60, P0); response time/error rate P1

| # | Task | SP | Status |
|---|---|---|---|
| T-143 | Buat halaman `/performance` | 1 | ☐ |
| T-144 | Buat Server Action `getUptimeData(microsaasId, range)` | 3 | ☐ |
| T-145 | Buat komponen `UptimeTimeline` (bar per hari, hijau/kuning/merah) | 3 | ☐ |
| T-146 | Buat komponen `UptimeSummaryCard` per MicroSaaS | 2 | ☐ |

**Total SP: 9**

---

### STORY-029 🟠 — Response Time & Error Rate

**Sebagai** Admin,  
**saya ingin** melihat grafik response time dan error rate,  
**agar** saya bisa mendeteksi degradasi performa sebelum user complain.

| # | Task | SP | Status |
|---|---|---|---|
| T-147 | Buat Server Action `getResponseTimeMetrics(microsaasId, range)` | 3 | ☐ |
| T-148 | Buat `ResponseTimeChart` (line chart p50/p90/p99) | 3 | ☐ |
| T-149 | Buat `ErrorRateChart` (stacked bar: 4xx vs 5xx) | 3 | ☐ |
| T-150 | Buat `RealtimeActiveUsersWidget` (Supabase Realtime) | 3 | ☐ |

**Total SP: 12**

---

## EPIC 9 — Notification & Alerting

> Konfigurasi alert rule dan notifikasi proaktif.

---

### STORY-030 🟠 — Alert Rule Engine

**Sebagai** Admin,  
**saya ingin** membuat aturan alert berdasarkan threshold metrik,  
**agar** saya mendapat notifikasi otomatis saat ada anomali.

**Acceptance Criteria:**
- Buat rule: pilih metrik + kondisi (>, <, =) + threshold + channel notifikasi
- Channel: Email, Slack webhook
- Aktif/nonaktifkan rule
- Test kirim notifikasi

| # | Task | SP | Status |
|---|---|---|---|
| T-151 | Buat halaman `/alerts` | 1 | ☐ |
| T-152 | Buat Server Action CRUD alert rules | 3 | ☐ |
| T-153 | Buat komponen `AlertRuleForm` | 3 | ☐ |
| T-154 | Buat cron job / Supabase Edge Function evaluasi alert rules | 5 | ☐ |
| T-155 | Implementasi email notifikasi via Resend / Nodemailer | 3 | ☐ |
| T-156 | Implementasi Slack webhook notifikasi | 2 | ☐ |

**Total SP: 17**

---

### STORY-031 🟠 — In-App Notification

**Sebagai** Admin,  
**saya ingin** melihat notifikasi di dalam dashboard,  
**agar** saya tidak ketinggalan alert saat sedang aktif menggunakan dashboard.

| # | Task | SP | Status |
|---|---|---|---|
| T-157 | Buat komponen `NotificationBell` di header dengan badge counter | 2 | ☐ |
| T-158 | Buat `NotificationDropdown` dengan daftar alert terbaru | 2 | ☐ |
| T-159 | Subscribe ke Supabase Realtime channel `alert_logs` | 2 | ☐ |
| T-160 | Mark as read / mark all as read | 1 | ☐ |

**Total SP: 7**

---

## EPIC 10 — Admin & Access Control

> RBAC, audit log, dan keamanan akun admin.

---

### STORY-032 🔴 — Role-Based Access Control (RBAC)

**Sebagai** Super Admin,  
**saya ingin** mengatur peran dan izin tiap admin,  
**agar** tidak semua admin bisa mengakses semua fitur sensitif.

**Acceptance Criteria:**
- 3 role bawaan: Super Admin, Operator Admin, Finance Admin
- Setiap route dan aksi diperiksa berdasarkan role
- UI menyembunyikan fitur yang tidak diizinkan (bukan hanya disable)
- Operator dibatasi assignment; Finance read-only untuk data keuangan/metadata non-secret
- Server Action memvalidasi identitas, role, scope sebelum memakai Service Role untuk operasi istimewa

| # | Task | SP | Status |
|---|---|---|---|
| T-161 | Definisikan permission matrix di kode (role → resource → action) | 2 | ☐ |
| T-162 | Buat helper `hasPermission(role, resource, action)` | 2 | ☐ |
| T-163 | Implementasi guard di semua Server Actions | 3 | ☐ |
| T-164 | Implementasi UI conditional rendering berdasarkan role | 2 | ☐ |

**Total SP: 9**

---

### STORY-033 🔴 — Admin User Management

**Sebagai** Super Admin,  
**saya ingin** mengelola akun admin lain,  
**agar** saya bisa onboard dan offboard tim dengan mudah.

**Acceptance Criteria:**
- Invite admin via email (kirim link invite)
- Set role saat invite; assign/unassign Operator Admin ke MicroSaaS (FR-14, P0; bagian T-166/T-167)
- Edit role admin yang sudah ada
- Revoke / disable akun admin

| # | Task | SP | Status |
|---|---|---|---|
| T-165 | Buat halaman `/settings/team` | 1 | ☐ |
| T-166 | Implementasi invite admin via email (Supabase Auth invite) | 3 | ☐ |
| T-167 | Buat Server Action `updateAdminRole(adminId, role)` | 2 | ☐ |
| T-168 | Buat Server Action `revokeAdmin(adminId)` | 2 | ☐ |
| T-169 | Buat tabel daftar admin aktif dengan aksi | 2 | ☐ |

**Total SP: 10**

---

### STORY-034 🔴 — Audit Log

**Sebagai** Super Admin,  
**saya ingin** melihat semua riwayat aksi admin,  
**agar** ada akuntabilitas atas setiap perubahan yang dilakukan.

**Acceptance Criteria:**
- Tabel audit log: Who, Action, Resource, Before/After value (diff), Timestamp, IP
- Filter: admin, action type, date range
- Non-deletable (append-only)

| # | Task | SP | Status |
|---|---|---|---|
| T-170 | Buat helper `recordAuditLog(adminId, action, resource, diff)` | 2 | ☐ |
| T-171 | Integrasikan audit log ke semua Server Actions | 3 | ☐ |
| T-172 | Buat halaman `/settings/audit-log` dengan tabel dan filter | 3 | ☐ |
| T-173 | Tampilkan diff before/after dalam format readable | 2 | ☐ |

**Total SP: 10**

---

### STORY-035 🟠 — Two-Factor Authentication (2FA)

**Sebagai** Admin,  
**saya ingin** mengaktifkan 2FA pada akun saya,  
**agar** akun admin saya lebih aman dari akses tidak sah.

| # | Task | SP | Status |
|---|---|---|---|
| T-174 | Implementasi TOTP 2FA dan alur pemulihan akun; verifikasi dukungan recovery provider | 3 | ☐ |
| T-175 | Buat halaman setup 2FA di `/settings` (QR code + alur pemulihan yang telah diverifikasi) | 3 | ☐ |
| T-176 | Enforce 2FA challenge saat login jika sudah di-setup | 2 | ☐ |

**Total SP: 8**

---

## Ringkasan Backlog

| Epic | Stories | Total SP | Prioritas |
|---|---|---|---|
| EPIC 1 — Foundation | 5 | 76 | 🔴 P0 |
| EPIC 2 — Global Dashboard | 5 | 39 | 🔴/🟠 P0-P1 |
| EPIC 3 — MicroSaaS Management | 3 | 30 | 🔴/🟠 P0-P1 |
| EPIC 4 — User Management | 5 | 51 | 🔴/🟠/🟡 P0-P2 |
| EPIC 5 — Subscription Management | 3 | 28 | 🔴/🟠 P0-P1 |
| EPIC 6 — Revenue & Finance | 2 | 22 | 🔴/🟠 P0-P1 |
| EPIC 7 — Payment Configuration | 4 | 40 | 🔴/🟠 P0-P1 |
| EPIC 8 — Performance Monitoring | 2 | 21 | 🔴/🟠 P0-P1 |
| EPIC 9 — Notification & Alerting | 2 | 24 | 🟠 P1 |
| EPIC 10 — Admin & Access Control | 4 | 37 | 🔴/🟠 P0-P1 |
| **TOTAL** | **35** | **368 SP** | |

---

## Pemetaan Requirement & Gap

Pemetaan ini melengkapi acceptance criteria story. P0 wajib ditutup sebelum MVP; label prioritas pada story tidak menaikkan prioritas seluruh isinya.

| PRD | Prioritas | Story / tindak lanjut |
|---|---|---|
| FR-01–03 | P0 | STORY-006–008; lima KPI termasuk ARR |
| FR-04–05 | P1 | STORY-009–010; agregasi harian/mingguan/bulanan pada T-057 |
| FR-06 | P2 | Quick actions promo/broadcast; belum diestimasi |
| FR-10–11 | P0 | STORY-011–012 + integrasi tab dari STORY-014/019/022/028 |
| FR-12–13 | P1 | STORY-013 |
| FR-14 | P0 | STORY-033, T-166/T-167 + scope RLS STORY-003/032 |
| FR-20–23, FR-26 | P0 | STORY-014–016; soft delete, konfirmasi destruktif, pagination |
| FR-24 | P1 | STORY-017; integrasi token/banner/stop session perlu dukungan tiap MicroSaaS |
| FR-25 | P2 | STORY-018 untuk CSV/bulk ban; bulk email belum diestimasi |
| FR-27 | P2 | Infinite scroll opsional; belum diestimasi |
| FR-30–32 | P0 | STORY-019–020; detail subscription termasuk T-105 |
| FR-33 | P1 | T-110 dalam STORY-020 |
| FR-34–35 | P1 | STORY-021; cohort retention belum diestimasi |
| FR-40–42 | P0 | STORY-022–023; breakdown per plan bagian T-116/T-118 |
| FR-43–44 | P1 | T-123/T-124; export CSV laporan agregat revenue belum diestimasi |
| FR-45–46 | P2 | Refund dan export Excel; belum diestimasi |
| FR-50–52 | P0 | STORY-024–025; secret terenkripsi, plan diarsipkan |
| FR-53 | P1 | Draft/publish dan grandfathering; belum diestimasi; T-135 hanya preview visual |
| FR-54 | P1 | STORY-026 |
| FR-55 | P2 | Konfigurasi tax; belum diestimasi |
| FR-56 | P1 | STORY-027; log request/response wajib menyamarkan secret |
| FR-60 | P0 | STORY-028; wajib sebelum MVP |
| FR-61–63 | P1 | STORY-029; breakdown per endpoint bagian T-147/T-148 |
| FR-64 | P2 | Slow query/connection pool; belum diestimasi |
| FR-65 | P3 | Status page; belum diestimasi |
| FR-70–71 | P1 | STORY-030–031 |
| FR-72–73 | P2 | Riwayat alert lengkap dan broadcast; belum diestimasi; dropdown P1 hanya alert terbaru |
| FR-80–82 | P0 | STORY-032–034; dikerjakan mulai Foundation |
| FR-83 | P1 | Daftar/revoke session admin; belum diestimasi; STORY-004 hanya sesi login/logout saat ini |
| FR-84 | P1 | STORY-035; alur pemulihan harus diverifikasi sebelum implementasi |
| NFR-01–08 | P0 | Validasi performa, uptime, auth/otorisasi, enkripsi, skala, desktop, konfirmasi destruktif pada QA; belum diestimasi terpisah |
| NFR-07, adaptasi tablet/mobile | P1 | Drawer/layout responsif sesuai DESIGN.md; belum diestimasi |

Tambahan atau perubahan acceptance criteria pada task yang sudah ada (assignment operator, detail subscription, breakdown per plan/endpoint, lima KPI, integrasi tab, sumber activity feed, dan pemulihan 2FA) memerlukan estimasi ulang sebelum sprint commitment. Angka 368 SP adalah baseline task awal yang telah dikoreksi aritmetikanya, bukan estimasi lengkap untuk semua requirement. Task baru untuk gap harus mendapat ID, estimasi, dan acceptance criteria saat refinement; tidak dianggap selesai oleh story terkait.

## Sprint Planning (Estimasi)

Asumsi sementara: satu developer, kapasitas 40 SP/sprint, dua minggu/sprint. Milestone mencakup pekerjaan campuran P0–P2; pekerjaan Growth/Scale dapat ditunda untuk memprioritaskan MVP. RBAC dan audit disiapkan sebelum mutasi bisnis.

| Sprint | Milestone | Lingkup baseline | Total SP | Rata-rata SP/sprint |
|---|---|---|---|---|
| 1–3 | M1 — Foundation & Security | EPIC 1 + STORY-032–034 | 105 | 35 |
| 4–6 | M2 — Core Dashboard | EPIC 2–4 | 120 | 40 |
| 7–9 | M3 — Revenue & Payment | EPIC 5–7 | 90 | 30 |
| 10–11 | M4 — Performance & Alerts | EPIC 8–9 | 45 | 22.5 |
| 12 | M5 — Polish & Launch | STORY-035 + QA, hardening, deploy | 8 | 8 (fitur terestimasi) |
| **Total** | | | **368** | |

Rencana berurutan sekitar 24 minggu; pembagian task tiap sprint dilakukan saat refinement dan harus ≤40 SP. Sisa kapasitas merupakan ruang QA/integrasi dan estimasi ulang, bukan jaminan seluruh gap muat. Jadwal ditinjau ulang setelah gap diestimasi. Tidak ada task yang dihitung dua kali; STORY-032–034 dipindahkan dari tahap akhir ke M1.

**Gate MVP:** seluruh P0 pada PRD lolos, termasuk RBAC tiga role, audit append-only, assignment operator, uptime 30 hari, dan desktop ≥1280px. Stub tab, konfigurasi dummy, atau task bertanda ☐ tidak memenuhi gate.

---

*Backlog ini adalah living document. Update status berdasarkan bukti implementasi dan verifikasi.*
