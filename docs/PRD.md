# Product Requirements Document
## Multi-MicroSaaS Admin Dashboard

**Version:** 1.1.1
**Tanggal:** 2026-10-18  
**Status:** Draft  
**Owner:** Admin / Founder  

---

## 1. Overview

### 1.1 Latar Belakang

Seiring berkembangnya portofolio produk digital, pengelolaan beberapa MicroSaaS secara terpisah menjadi tidak efisien. Setiap produk memiliki user base, aliran pendapatan, dan metrik performa yang perlu dipantau secara individual maupun agregat. Dibutuhkan satu platform terpusat yang memungkinkan admin (founder/operator) untuk memonitor dan mengelola seluruh ekosistem MicroSaaS dari satu titik kontrol.

### 1.2 Visi Produk

> **"One Command Center for All Your MicroSaaS"**

Sebuah admin dashboard berbasis web yang menjadi pusat kendali tunggal untuk memantau kesehatan bisnis, mengelola pengguna, mengkonfigurasi pembayaran, dan menganalisis performa seluruh MicroSaaS yang berjalan di atas infrastruktur Supabase yang tersentralisasi.

### 1.3 Tujuan

- Meminimalisir context-switching antar panel admin masing-masing produk.
- Memberikan visibilitas penuh atas KPI bisnis lintas produk secara real-time.
- Menyediakan kontrol terpusat atas konfigurasi payment gateway dan subscription tier.
- Mendeteksi anomali performa dan potensi churn lebih awal.

---

## 2. Stakeholder

| Role | Deskripsi |
|---|---|
| **Super Admin (Founder)** | Akses penuh ke semua fitur, semua MicroSaaS |
| **Operator Admin** | Akses terbatas per MicroSaaS yang di-assign |
| **Finance Admin** | Baca revenue, subscription, invoice, dan metadata plan/gateway; tanpa akses secret atau mutasi |
| **End User (MicroSaaS)** | Tidak memiliki akses ke dashboard ini; hanya dikelola dari sini |

---

## 3. Ruang Lingkup

### 3.1 In Scope

- Dashboard agregat & per-MicroSaaS
- Manajemen user (CRUD, ban, impersonate)
- Manajemen subscription & plan
- Monitoring pendapatan (MRR, ARR, churn)
- Konfigurasi payment gateway terpusat
- Monitoring performa aplikasi (uptime, latency, error rate)
- Notifikasi & alerting
- Audit log aktivitas admin

### 3.2 Out of Scope (v1.0)

- Panel admin untuk end-user masing-masing MicroSaaS
- White-label dashboard per produk
- Otomatisasi deployment / CI-CD pipeline
- Customer support ticketing system

---

### 3.3 Acuan & Tahapan Rilis

- PRD menjadi acuan scope, prioritas, dan hak akses: P0 = MVP, P1 = Growth, P2 = Scale, P3 = Future.
- [BACKLOG.md](./BACKLOG.md) memetakan requirement ke pekerjaan dan estimasi. Story dapat memuat beberapa prioritas; bagian P1/P2 tidak menjadi syarat selesai MVP.
- [DESIGN.md](../DESIGN.md) menjadi acuan token dan layout. MVP berfokus pada desktop ≥1280px; adaptasi tablet/mobile adalah P1.
- Status backlog adalah rencana, bukan bukti implementasi. Perubahan requirement harus diperbarui pada dokumen terkait.

## 4. User Stories

### 4.1 Monitoring & Overview

```
Sebagai Super Admin,
saya ingin melihat ringkasan KPI semua MicroSaaS di satu halaman,
agar saya bisa mengidentifikasi produk yang perlu perhatian dengan cepat.
```

```
Sebagai Admin,
saya ingin melihat grafik pertumbuhan user baru per hari/minggu/bulan per MicroSaaS,
agar saya bisa memahami tren adopsi produk.
```

```
Sebagai Finance Admin,
saya ingin melihat total MRR, ARR, dan pendapatan per produk,
agar saya bisa membuat laporan keuangan yang akurat.
```

### 4.2 Manajemen User

```
Sebagai Admin,
saya ingin mencari, memfilter, dan melihat detail user di tiap MicroSaaS,
agar saya bisa menangani request support atau investigasi akun.
```

```
Sebagai Admin,
saya ingin melakukan ban/unban dan reset password user,
agar saya bisa menangani akun bermasalah tanpa harus masuk ke database langsung.
```

```
Sebagai Super Admin,
saya ingin mengimpersonate (login sebagai) user tertentu,
agar saya bisa mereproduksi bug atau membantu user secara langsung.
```

### 4.3 Subscription & Revenue

```
Sebagai Finance Admin,
saya ingin melihat daftar subscriber aktif, trial, dan yang akan churn,
agar saya bisa mengambil tindakan retensi proaktif.
```

```
Sebagai Admin,
saya ingin mengubah plan subscription user secara manual (upgrade/downgrade/cancel),
agar saya bisa menangani kasus khusus tanpa menunggu user melakukan self-service.
```

```
Sebagai Finance Admin,
saya ingin melihat riwayat transaksi dan invoice per user,
agar saya bisa menjawab dispute pembayaran dengan cepat.
```

### 4.4 Payment Configuration

```
Sebagai Super Admin,
saya ingin mengkonfigurasi payment gateway (Stripe, Midtrans, dll.) dari satu panel,
agar semua MicroSaaS menggunakan konfigurasi yang konsisten dan aman.
```

```
Sebagai Super Admin,
saya ingin membuat dan mengedit pricing plan (harga, interval, fitur yang di-include),
agar perubahan harga dapat diterapkan ke semua produk dengan efisien.
```

### 4.5 Performa & Monitoring

```
Sebagai Admin,
saya ingin melihat uptime, average response time, dan error rate tiap MicroSaaS,
agar saya bisa mendeteksi degradasi layanan sebelum user complain.
```

```
Sebagai Admin,
saya ingin menerima notifikasi (email, Slack, atau in-app) ketika ada anomali metrik,
agar saya bisa merespons insiden dengan cepat.
```

---

## 5. Functional Requirements

### 5.1 Modul: Global Dashboard (Home)

| ID | Requirement | Prioritas |
|---|---|---|
| FR-01 | Tampilkan lima KPI agregat: Total Users, Total MRR, Total ARR, Active Subscriptions, MicroSaaS Count | P0 |
| FR-02 | Tampilkan kartu ringkasan per MicroSaaS dengan status health indicator | P0 |
| FR-03 | Grafik tren pendapatan (7 hari, 30 hari, 90 hari, custom range) | P0 |
| FR-04 | Grafik pertumbuhan user baru per hari/minggu/bulan | P1 |
| FR-05 | Feed aktivitas terbaru (signup baru, upgrade, churn, error spike) | P1 |
| FR-06 | Widget quick-action: tambah promo code, broadcast notifikasi | P2 |

### 5.2 Modul: MicroSaaS Management

| ID | Requirement | Prioritas |
|---|---|---|
| FR-10 | CRUD MicroSaaS (nama, slug, deskripsi, logo, URL, status aktif/nonaktif) | P0 |
| FR-11 | Tiap MicroSaaS memiliki halaman detail dengan tab: Overview, Users, Subscriptions, Revenue, Performance | P0 |
| FR-12 | Konfigurasi metadata per MicroSaaS (webhook URL, API key, environment) | P1 |
| FR-13 | Toggle maintenance mode per MicroSaaS | P1 |
| FR-14 | Assign admin/operator ke MicroSaaS tertentu untuk isolasi akses | P0 |

### 5.3 Modul: User Management

| ID | Requirement | Prioritas |
|---|---|---|
| FR-20 | Tampilkan daftar user dengan filter: MicroSaaS, plan, status, tanggal bergabung | P0 |
| FR-21 | Pencarian user by email, nama, atau ID | P0 |
| FR-22 | Halaman detail user: profil, subscription aktif, riwayat transaksi, aktivitas login | P0 |
| FR-23 | Aksi: Ban/Unban, Reset Password, Delete Account | P0 |
| FR-24 | Impersonate user (dengan audit log wajib) | P1 |
| FR-25 | Bulk actions: export CSV, bulk ban, bulk email | P2 |
| FR-26 | Pagination server-side pada tabel user (25/50/100 per halaman) | P0 |
| FR-27 | Infinite scroll opsional pada tabel user | P2 |

### 5.4 Modul: Subscription Management

| ID | Requirement | Prioritas |
|---|---|---|
| FR-30 | Daftar subscription aktif, trial, canceled, past_due per MicroSaaS | P0 |
| FR-31 | Detail subscription: plan, billing cycle, next payment date, payment method | P0 |
| FR-32 | Override subscription secara manual: upgrade, downgrade, extend trial, cancel | P0 |
| FR-33 | Tambah subscription gratis / complimentary untuk user tertentu | P1 |
| FR-34 | Grafik churn rate bulanan dan cohort retention | P1 |
| FR-35 | Daftar user yang akan churn (trial expired < 7 hari, payment failed) | P1 |

### 5.5 Modul: Revenue & Finance

| ID | Requirement | Prioritas |
|---|---|---|
| FR-40 | Dashboard pendapatan: MRR, ARR, new MRR, expansion MRR, churned MRR | P0 |
| FR-41 | Breakdown pendapatan per MicroSaaS dan per plan | P0 |
| FR-42 | Riwayat transaksi dengan filter tanggal, status, MicroSaaS, gateway | P0 |
| FR-43 | Detail transaksi: invoice, payment method, gateway response | P1 |
| FR-44 | Export laporan pendapatan dan transaksi ke CSV | P1 |
| FR-45 | Refund transaksi dari dashboard (terintegrasi ke payment gateway) | P2 |
| FR-46 | Export laporan pendapatan ke Excel | P2 |

### 5.6 Modul: Payment Configuration

| ID | Requirement | Prioritas |
|---|---|---|
| FR-50 | Konfigurasi payment gateway: Stripe, Midtrans, atau gateway lain (API key, webhook secret) | P0 |
| FR-51 | CRUD pricing plan: nama, harga, interval (bulanan/tahunan), fitur, trial period | P0 |
| FR-52 | Assign plan ke satu atau banyak MicroSaaS | P0 |
| FR-53 | Draft harga, preview sebelum publish, dan grandfathering subscription aktif | P1 |
| FR-54 | Promo code / coupon: persentase atau nominal, masa berlaku, batas penggunaan | P1 |
| FR-55 | Konfigurasi tax rate per negara / region | P2 |
| FR-56 | Webhook log: request/response payment gateway untuk debugging | P1 |

### 5.7 Modul: Performance Monitoring

| ID | Requirement | Prioritas |
|---|---|---|
| FR-60 | Tampilkan uptime percentage (30 hari terakhir) per MicroSaaS | P0 |
| FR-61 | Grafik response time (p50, p90, p99) per endpoint utama | P1 |
| FR-62 | Error rate tracker: 4xx dan 5xx per MicroSaaS | P1 |
| FR-63 | Realtime active user count per MicroSaaS | P1 |
| FR-64 | Database query performance (Supabase-specific: slow queries, connection pool) | P2 |
| FR-65 | Status page publik (opsional, bisa di-generate dari dashboard) | P3 |

### 5.8 Modul: Notification & Alerting

| ID | Requirement | Prioritas |
|---|---|---|
| FR-70 | Konfigurasi alert rule: threshold metrik + channel notifikasi | P1 |
| FR-71 | Channel notifikasi: Email, Slack webhook, in-app notification | P1 |
| FR-72 | Riwayat alert yang sudah dikirim | P2 |
| FR-73 | Broadcast pesan ke user tertentu atau semua user per MicroSaaS | P2 |

### 5.9 Modul: Admin & Access Control

| ID | Requirement | Prioritas |
|---|---|---|
| FR-80 | Role-based access control (Super Admin, Operator Admin, Finance Admin) | P0 |
| FR-81 | CRUD admin account dan assignment role | P0 |
| FR-82 | Audit log: semua aksi admin tercatat (who, what, when, affected resource) | P0 |
| FR-83 | Session management: lihat dan revoke active session admin | P1 |
| FR-84 | Two-factor authentication (2FA) untuk admin login | P1 |

---

## 6. Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | **Performance** - Initial page load time | < 2 detik |
| NFR-02 | **Performance** - Benchmark render tabel dengan fixture 1000 rows; UI produksi tetap memakai pagination server-side | < 500ms |
| NFR-03 | **Availability** - Dashboard uptime | ≥ 99.5% |
| NFR-04 | **Security** - Semua API endpoint dilindungi autentikasi + otorisasi | Wajib |
| NFR-05 | **Security** - Sensitive data (API keys) dienkripsi at rest | Wajib |
| NFR-06 | **Scalability** - Support hingga 50 MicroSaaS dan 1 juta user agregat | v1.0 |
| NFR-07 | **Responsiveness** - Semua fitur MVP fungsional pada viewport ≥1280px dengan sidebar collapsible | P0; adaptasi 768–1279px dan 360–767px pada P1 |
| NFR-08 | **Audit** - Semua aksi destruktif memerlukan konfirmasi eksplisit | Wajib |

---

## 7. Technical Architecture

### 7.1 Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | Next.js 14+ (App Router), TypeScript |
| **UI Base** | Tailwind CSS v4 (konfigurasi CSS-first) |
| **UI Kit** | shadcn/ui (Radix UI primitives + Tailwind variants) |
| **Design System** | Kinetic Obsidian — custom token layer di atas shadcn/ui |
| **Database** | Supabase (PostgreSQL) — tersentralisasi |
| **Auth** | Supabase Auth (JWT + RLS) |
| **Realtime** | Supabase Realtime (WebSocket) |
| **Payment** | Stripe SDK / Midtrans (terkonfigurasi dari dashboard) |
| **Charts** | Recharts |
| **State Management** | TanStack Query (server state) + Zustand (client/UI state) |
| **Forms** | React Hook Form + Zod (schema validation) |
| **API** | Next.js Server Actions + Route Handlers |
| **Icons** | Lucide React |

### 7.2 shadcn/ui Component Kit

shadcn/ui digunakan sebagai **fondasi komponen yang di-own langsung** (bukan dependency eksternal). Setiap komponen di-copy ke `components/ui/` di root proyek dan di-extend dengan token Kinetic Obsidian. Semua folder sumber berada di root, tanpa folder `src/`; alias `@/*` mengarah ke `./*`.

**Komponen shadcn/ui yang digunakan:**

| Kategori | Komponen |
|---|---|
| **Layout** | `Separator`, `ScrollArea`, `ResizablePanel` |
| **Navigation** | `NavigationMenu`, `Breadcrumb`, `Tabs` |
| **Data Display** | `Table`, `Badge`, `Avatar`, `Card`, `Skeleton` |
| **Forms** | `Input`, `Select`, `Checkbox`, `Switch`, `RadioGroup`, `Textarea`, `DatePicker` |
| **Feedback** | `Toast` (Sonner), `Alert`, `Progress` |
| **Overlay** | `Dialog`, `Sheet`, `Popover`, `Tooltip`, `DropdownMenu`, `ContextMenu` |
| **Actions** | `Button`, `Toggle`, `ToggleGroup` |
| **Command** | `Command` (command palette / search) |

**Kustomisasi Kinetic Obsidian di atas shadcn:**

Nilai HEX di front matter `DESIGN.md` menjadi acuan tunggal. Tailwind v4 menggunakan `@import "tailwindcss"` dan `@theme inline` pada `app/globals.css` untuk memetakan CSS variables ke utility warna, font, dan radius. Gunakan nilai warna CSS langsung (`var(--primary)`), tanpa pembungkus `hsl()` kecuali variabelnya memang berisi kanal HSL. Tidak diperlukan `tailwind.config.ts`.

Starter saat ini memakai `@tailwindcss/turbopack` melalui `next.config.ts`; pertahankan integrasi tersebut selama lint dan build lolos. Konfigurasi shadcn/ui nantinya menggunakan `tailwind.config: ""`, `tailwind.css: "app/globals.css"`, dan alias komponen di root. Contoh mapping warna: `--color-primary: var(--primary)` di dalam `@theme inline` menghasilkan utility `bg-primary`.

| shadcn variable | Token DESIGN.md | HEX |
|---|---|---|
| `--background` | `background` | `#0f131c` |
| `--foreground`, `--card-foreground` | `on-surface` | `#dfe2ef` |
| `--card` | `surface-container` | `#1c1f29` |
| `--primary`, `--ring` | `primary-container` | `#00f2fe` |
| `--primary-foreground` | `on-primary` | `#00373a` |
| `--secondary` | `secondary-container` | `#3131c0` |
| `--secondary-foreground` | `on-secondary-container` | `#b0b2ff` |
| `--muted` | `surface-container-high` | `#262a34` |
| `--muted-foreground` | `on-surface-variant` | `#b9cacb` |
| `--border`, `--input` | `outline-variant` | `#3a494b` |
| `--destructive` | `error-container` | `#93000a` |
| `--destructive-foreground` | `on-error-container` | `#ffdad6` |

Status sukses memakai `tertiary-container` (`#67f4b7`). Token `primary` di DESIGN.md adalah warna teks tonal; CTA shadcn memakai `primary-container`.

### 7.3 Database Architecture (Supabase)

```
[Supabase Central Database]
│
├── public.microsaas              -- Registry semua MicroSaaS
├── public.admin_users            -- Akun admin dashboard
├── public.admin_roles            -- Role & permission admin
├── public.admin_assignments      -- Scope operator per MicroSaaS
├── public.audit_logs             -- Log semua aksi admin
│
├── public.users                  -- User agregat dari semua MicroSaaS
│   └── (with foreign key: microsaas_id)
│
├── public.subscriptions          -- Data subscription aktif
├── public.plans                  -- Pricing plans
├── public.transactions           -- Riwayat transaksi pembayaran
├── public.invoices               -- Invoice transaksi
│
├── public.payment_gateways       -- Konfigurasi gateway (encrypted)
├── public.promo_codes            -- Promo & coupon data
│
├── public.performance_metrics    -- Time-series metrik performa
├── public.alert_rules            -- Aturan alert (P1)
├── public.alert_logs             -- Hasil evaluasi/notifikasi (P1)
└── public.webhook_logs           -- Debug webhook (P1)
```

### 7.4 Row Level Security (RLS)

RLS aktif pada tabel sensitif. Super Admin mendapat izin penuh melalui policy role. Operator Admin hanya mengakses MicroSaaS yang di-assign dan aksi yang diizinkan permission matrix. Finance Admin hanya membaca data keuangan dan metadata non-secret; tidak boleh mengubah subscription, plan, atau gateway. Audit log bersifat append-only, termasuk bagi Super Admin.

Setiap Server Action memvalidasi identitas, role, dan scope. Service Role hanya digunakan pada server untuk operasi istimewa setelah pemeriksaan izin eksplisit; key tidak dikirim ke browser.

```sql
-- Contoh RLS policy untuk operator admin
CREATE POLICY "operator_access_own_microsaas"
ON public.users
FOR ALL
USING (
  microsaas_id IN (
    SELECT microsaas_id FROM admin_assignments
    WHERE admin_id = auth.uid()
  )
);
```

### 7.5 Data Flow

```
[Admin Browser]
      │
      ▼
[Next.js App Router]
      │
      ├── Server Actions ──────► [Supabase server client + JWT/RLS]
      │
      └── Client Components ──► [Supabase JS Client via Anon Key + RLS]
                                        │
                                        ▼
                               [Supabase Realtime]
                               (live updates: metrics, alerts)
```

### 7.6 Folder Structure (Modular)

Proyek menggunakan **feature-based modular structure** dengan `app/`, `modules/`, `components/`, `lib/`, `hooks/`, dan `types/` langsung di root, tanpa lapisan `src/`. Routes berada di `app/`; logic bisnis, komponen spesifik, actions, queries, hooks, dan types tiap fitur berada di `modules/`. Pohon berikut adalah struktur target; folder dan file dibuat ketika task terkait dikerjakan.

```
dashboard-saas/
├── app/                              # Next.js App Router
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/                  # Protected routes group
│   │   ├── layout.tsx                # AppShell (sidebar + header)
│   │   ├── page.tsx                  # /  → Global Dashboard
│   │   │
│   │   ├── microsaas/
│   │   │   ├── page.tsx              # /microsaas
│   │   │   └── [slug]/
│   │   │       ├── layout.tsx        # Tab navigation
│   │   │       ├── page.tsx          # /microsaas/[slug] → Overview
│   │   │       ├── users/page.tsx
│   │   │       ├── subscriptions/page.tsx
│   │   │       ├── revenue/page.tsx
│   │   │       └── performance/page.tsx
│   │   │
│   │   ├── users/
│   │   │   ├── page.tsx              # /users
│   │   │   └── [userId]/page.tsx     # /users/[userId]
│   │   │
│   │   ├── subscriptions/
│   │   │   └── page.tsx
│   │   │
│   │   ├── revenue/
│   │   │   ├── page.tsx
│   │   │   └── transactions/page.tsx
│   │   │
│   │   ├── payment/
│   │   │   ├── gateways/page.tsx
│   │   │   ├── plans/page.tsx
│   │   │   ├── promo-codes/page.tsx
│   │   │   └── webhook-logs/page.tsx
│   │   │
│   │   ├── performance/
│   │   │   └── page.tsx
│   │   │
│   │   ├── alerts/
│   │   │   └── page.tsx
│   │   │
│   │   └── settings/
│   │       ├── page.tsx               # Setup 2FA (P1)
│   │       ├── team/page.tsx
│   │       └── audit-log/page.tsx
│   │
│   └── api/                          # Route Handlers (webhook receivers, etc.)
│       └── webhooks/
│           ├── stripe/route.ts
│           └── midtrans/route.ts
│
├── modules/                          # Feature modules (core business logic)
│   ├── dashboard/
│   │   ├── actions.ts                # Server Actions: getGlobalKPIs, etc.
│   │   ├── queries.ts                # Supabase queries
│   │   ├── types.ts                  # TypeScript types modul ini
│   │   └── components/
│   │       ├── KPICardGrid.tsx
│   │       ├── RevenueAreaChart.tsx
│   │       ├── MicroSaaSStatusGrid.tsx
│   │       └── ActivityFeed.tsx
│   │
│   ├── microsaas/
│   │   ├── actions.ts
│   │   ├── queries.ts
│   │   ├── types.ts
│   │   └── components/
│   │       ├── MicroSaaSTable.tsx
│   │       ├── MicroSaaSCard.tsx
│   │       ├── MicroSaaSForm.tsx
│   │       └── MicroSaaSConfigForm.tsx
│   │
│   ├── users/
│   │   ├── actions.ts
│   │   ├── queries.ts
│   │   ├── types.ts
│   │   └── components/
│   │       ├── UserTable.tsx
│   │       ├── UserDetailCard.tsx
│   │       ├── UserActionsMenu.tsx
│   │       └── BulkActionBar.tsx
│   │
│   ├── subscriptions/
│   │   ├── actions.ts
│   │   ├── queries.ts
│   │   ├── types.ts
│   │   └── components/
│   │       ├── SubscriptionTable.tsx
│   │       ├── SubscriptionOverrideModal.tsx
│   │       └── ChurnRiskTable.tsx
│   │
│   ├── revenue/
│   │   ├── actions.ts
│   │   ├── queries.ts
│   │   ├── types.ts
│   │   └── components/
│   │       ├── RevenueMetricCards.tsx
│   │       ├── RevenueBreakdownTable.tsx
│   │       ├── RevenueDonutChart.tsx
│   │       └── TransactionTable.tsx
│   │
│   ├── payment/
│   │   ├── actions.ts
│   │   ├── queries.ts
│   │   ├── types.ts
│   │   └── components/
│   │       ├── GatewayConfigForm.tsx
│   │       ├── PlanForm.tsx
│   │       ├── PlanPreviewCard.tsx
│   │       ├── PromoCodeForm.tsx
│   │       └── WebhookLogTable.tsx
│   │
│   ├── performance/
│   │   ├── actions.ts
│   │   ├── queries.ts
│   │   ├── types.ts
│   │   └── components/
│   │       ├── UptimeTimeline.tsx
│   │       ├── ResponseTimeChart.tsx
│   │       └── ErrorRateChart.tsx
│   │
│   ├── alerts/
│   │   ├── actions.ts
│   │   ├── queries.ts
│   │   ├── types.ts
│   │   └── components/
│   │       ├── AlertRuleForm.tsx
│   │       ├── AlertRuleTable.tsx
│   │       └── NotificationBell.tsx
│   │
│   └── admin/
│       ├── actions.ts
│       ├── queries.ts
│       ├── types.ts
│       └── components/
│           ├── AdminTable.tsx
│           ├── InviteAdminModal.tsx
│           └── AuditLogTable.tsx
│
├── components/                       # Shared / UI components
│   ├── ui/                           # shadcn/ui components (owned, customized)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── skeleton.tsx
│   │   ├── sheet.tsx
│   │   ├── sonner.tsx
│   │   └── ...                       # semua shadcn components
│   │
│   ├── layout/                       # Shell & navigation
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Breadcrumb.tsx
│   │
│   └── shared/                       # Reusable cross-module components
│       ├── StatCard.tsx
│       ├── ConfirmDialog.tsx
│       ├── DataTable.tsx
│       ├── DateRangePicker.tsx
│       ├── EmptyState.tsx
│       └── PageHeader.tsx
│
├── lib/                              # Utilities & configs
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client (Server Actions/RSC)
│   │   └── middleware.ts             # Session refresh helper
│   ├── auth/
│   │   ├── permissions.ts            # Permission matrix (role → actions)
│   │   └── audit.ts                  # recordAuditLog() helper
│   ├── utils.ts                      # cn(), formatCurrency(), formatDate()
│   └── constants.ts                  # App-wide constants
│
├── hooks/                            # Shared custom React hooks
│   ├── useAuth.ts
│   ├── useRealtime.ts
│   └── useDebounce.ts
│
├── types/                            # Global TypeScript types
│   ├── database.ts                   # Auto-generated dari Supabase
│   └── index.ts                      # Re-exports & global types
│
├── supabase/
│   ├── migrations/                       # SQL migration files
│   └── seed.sql                          # Seed data untuk development
│
├── public/                               # Static assets
├── .env.local.example
├── components.json                       # shadcn/ui config
├── next.config.ts
└── tsconfig.json
```

> **Prinsip Modular Structure:**
> - **Modules** (`modules/`) → semua logic bisnis per fitur: actions, queries, types, dan komponen spesifik modul
> - **Components** (`components/`) → hanya komponen yang **digunakan oleh lebih dari satu modul**
> - **Lib** (`lib/`) → pure utilities, konfigurasi client, dan helpers tanpa UI
> - Import antar modul **dilarang** (modul A tidak import dari modul B). Shared logic naik ke `lib/` atau `components/shared/`

---

## 8. Information Architecture

```
/                          ← Global Dashboard (Home)
├── /microsaas             ← Daftar semua MicroSaaS
│   └── /[slug]            ← Detail MicroSaaS
│       ├── /                    ← Overview pada /microsaas/[slug]
│       ├── /users
│       ├── /subscriptions
│       ├── /revenue
│       └── /performance
│
├── /users                 ← Global User Management
│   └── /[userId]          ← Detail User
│
├── /revenue               ← Global Revenue Dashboard
│   └── /transactions      ← Riwayat Transaksi
│
├── /subscriptions         ← Global Subscription Management
│
├── /payment               ← Payment Configuration
│   ├── /gateways          ← Gateway config (Stripe, Midtrans)
│   ├── /plans             ← Pricing Plans
│   ├── /promo-codes       ← Promo & Coupon
│   └── /webhook-logs      ← Debug webhook (P1)
│
├── /performance           ← Global Performance Monitoring
│
├── /alerts                ← Notification & Alert Rules
│
└── /settings              ← Admin Settings + setup 2FA (P1)
    ├── /team              ← Admin Users & Roles
    └── /audit-log         ← Audit Log
```

---

## 9. Design System

Mengacu pada design system **Kinetic Obsidian** yang sudah didefinisikan di [`DESIGN.md`](../DESIGN.md):

- **Base Canvas:** `#0F131C` — dark, abyssal background
- **Primary Accent:** `#00F2FE` (Electric Cyan) — active states, CTAs, live indicators
- **Secondary Accent:** `#3131C0` (Electric Indigo) — secondary actions, chart series
- **Success/Health:** `#67F4B7` (Emerald) — positive metrics, uptime, revenue growth
- **Font Stack:** Plus Jakarta Sans (headline) + Inter (body) + JetBrains Mono (metrics/code)
- **Elevation:** Glassmorphism dengan `backdrop-filter: blur()` + gradient borders

---

## 10. Acceptance Criteria

### Fase 1 — MVP (P0 Features)

- [ ] Admin dapat login dengan email+password (Supabase Auth)
- [ ] Global dashboard menampilkan lima KPI, kartu health per produk, dan grafik revenue 7/30/90 hari/custom
- [ ] CRUD MicroSaaS berfungsi
- [ ] Detail MicroSaaS memiliki lima tab; tab Performance MVP berisi uptime
- [ ] Tabel user dengan search, filter, sorting, pagination, dan halaman detail lengkap
- [ ] Aksi ban/unban, reset password, dan soft delete user berfungsi
- [ ] Subscription management: lihat dan override plan
- [ ] Dashboard revenue: MRR/ARR/transaksi
- [ ] Konfigurasi payment gateway tersimpan dengan aman
- [ ] CRUD pricing plan dan assign ke MicroSaaS
- [ ] Audit log mencatat semua aksi admin
- [ ] RBAC tiga role, invite/revoke admin, assignment operator, dan isolasi RLS berjalan
- [ ] Uptime 30 hari per MicroSaaS tersedia
- [ ] Semua fitur MVP fungsional pada viewport ≥1280px

### Fase 2 — Growth (P1 Features)

- [ ] Impersonate user
- [ ] Churn prediction widget (trial expiring soon)
- [ ] Alert rule engine dan notifikasi email/Slack
- [ ] Monitoring lanjutan: response time p50/p90/p99, error rate, realtime active users
- [ ] Promo code / coupon management
- [ ] 2FA untuk admin login
- [ ] Export CSV laporan pendapatan dan transaksi
- [ ] User growth chart, activity feed realtime, konfigurasi/maintenance MicroSaaS
- [ ] Detail transaksi, complimentary subscription, churn chart, cohort retention
- [ ] Draft/publish harga dengan grandfathering, webhook log debugging, lihat/revoke session admin
- [ ] Adaptasi tablet/mobile sesuai DESIGN.md

### Fase 3 — Scale (P2 Features)

- [ ] Bulk actions pada user (bulk email, bulk export)
- [ ] Quick actions promo/broadcast, riwayat alert lengkap, dan broadcast per MicroSaaS
- [ ] Refund dari dashboard
- [ ] Tax rate configuration
- [ ] Infinite scroll opsional dan export Excel laporan pendapatan
- [ ] Performance: database slow query monitor

### Fase 4 — Future (P3)

- [ ] Status page generator

---

## 11. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| API key payment gateway bocor | Kritis | Rendah | Enkripsi at rest + hanya tampilkan masked value di UI |
| Admin yang di-impersonate tidak sadar | Tinggi | Medium | Wajib catat di audit log + notifikasi ke user (opsional) |
| Overload Supabase connection pool | Tinggi | Medium | Connection pooling via PgBouncer + monitoring aktif |
| Data antar MicroSaaS cross-contaminate | Kritis | Rendah | RLS policy ketat + test suite isolation |
| Perubahan harga plan berdampak ke subscriber aktif | Tinggi | Medium | Draft mode + grandfathering logic per subscription |

---

## 12. Milestones

| Milestone | Estimasi sprint | Deliverable |
|---|---|---|
| **M1 - Foundation & Security** | Sprint 1–3 | Foundation 76 SP + RBAC, admin/assignment, audit log 29 SP = 105 SP |
| **M2 - Core Dashboard** | Sprint 4–6 | Dashboard, MicroSaaS, user management; 120 SP |
| **M3 - Revenue & Payment** | Sprint 7–9 | Subscription, revenue, payment; 90 SP |
| **M4 - Performance & Alerts** | Sprint 10–11 | Uptime, monitoring lanjutan, alerting; 45 SP |
| **M5 - Polish & Launch** | Sprint 12 | 2FA 8 SP, QA, hardening, deploy |

Baseline 368 SP, kapasitas 40 SP per sprint dua minggu: sekitar 24 minggu jika milestone berurutan. Epic dapat dipecah antar sprint. Estimasi mencakup task P0–P2 yang sudah diestimasi; gap requirement di BACKLOG.md belum termasuk dan dapat memperpanjang jadwal. MVP hanya dirilis setelah seluruh P0, termasuk uptime di M4, lolos verifikasi. Bagian P1/P2 boleh ditunda meskipun berada dalam milestone yang sama.

---

## 13. Glossary

| Term | Definisi |
|---|---|
| **MicroSaaS** | Produk SaaS individual yang dikelola melalui dashboard ini |
| **MRR** | Monthly Recurring Revenue — pendapatan berulang bulanan |
| **ARR** | Annual Recurring Revenue — MRR × 12 |
| **Churn** | User/subscription yang berhenti berlangganan |
| **Impersonate** | Kemampuan admin untuk login sebagai user tertentu untuk keperluan support |
| **RLS** | Row Level Security — fitur Supabase untuk isolasi data per user/role |
| **Super Admin** | Admin dengan akses penuh ke semua MicroSaaS |
| **Operator Admin** | Admin dengan akses terbatas ke MicroSaaS tertentu |

---

*Dokumen ini adalah living document. Perubahan requirement akan ditrack melalui versi PRD.*
