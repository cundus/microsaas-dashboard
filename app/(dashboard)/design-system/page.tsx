"use client";

import { useState } from "react";
import { Activity, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DataTable,
  type DataTableColumn,
  type TableQuery,
} from "@/components/shared/DataTable";
import { StatCard } from "@/components/shared/StatCard";

const sampleRows = Array.from({ length: 62 }, (_, index) => ({
  id: String(index + 1),
  name: `Produk ${String(index + 1).padStart(2, "0")}`,
  users: (index + 1) * 125,
  status: index % 3 === 0 ? "Degraded" : "Healthy",
}));

const columns: DataTableColumn<(typeof sampleRows)[number]>[] = [
  {
    id: "name",
    header: "Produk",
    sortable: true,
    cell: (row) => (
      <span className="font-medium whitespace-nowrap">{row.name}</span>
    ),
  },
  {
    id: "users",
    header: "Pengguna",
    sortable: true,
    cell: (row) => (
      <span className="font-mono tabular-nums">
        {row.users.toLocaleString("id-ID")}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => (
      <Badge variant={row.status === "Healthy" ? "success" : "destructive"}>
        {row.status}
      </Badge>
    ),
  },
];

export default function DesignSystemPage() {
  const [query, setQuery] = useState<TableQuery>({
    search: "",
    page: 1,
    pageSize: 25,
    sort: null,
  });
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const rows = sampleRows.filter(
    (row) =>
      row.name.toLowerCase().includes(query.search.toLowerCase()) &&
      (status === "all" || row.status === status),
  );
  const sort = query.sort;
  if (sort)
    rows.sort(
      (a, b) =>
        (sort.id === "users"
          ? a.users - b.users
          : a.name.localeCompare(b.name)) * (sort.direction === "asc" ? 1 : -1),
    );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-8">
        <div className="space-y-3">
          <Badge>
            <Activity aria-hidden="true" />
            Story 002 · Preview
          </Badge>
          <h1 className="font-display text-display-hero font-extrabold">
            Kinetic Obsidian
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Fondasi visual dashboard MicroSaaS. Semua angka di halaman ini
            adalah data contoh.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              Buka dialog
              <ArrowUpRight />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Preview dialog</DialogTitle>
              <DialogDescription>
                Contoh modal dengan fokus keyboard dan tombol tutup.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label htmlFor="preview-name" className="text-sm">
                Nama produk
              </label>
              <Input id="preview-name" placeholder="Masukkan nama produk" />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Tutup preview</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <section
        aria-label="Contoh metrik"
        className="grid gap-gutter md:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Total pengguna"
          value="12.480"
          delta={12.4}
          comparison="vs 30 hari lalu"
        />
        <StatCard
          label="Monthly recurring revenue"
          value="Rp48,2 jt"
          delta={-2.1}
          comparison="vs 30 hari lalu"
        />
        <StatCard label="MicroSaaS aktif" value="8" delta={0} />
        <StatCard label="Memuat metrik" value="" loading />
      </section>

      <section
        aria-label="Komponen dasar"
        className="grid gap-gutter lg:grid-cols-2"
      >
        <Card>
          <CardHeader>
            <CardTitle>Aksi & status</CardTitle>
            <CardDescription>
              Button, badge, dan panel kaca dengan token semantik.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="ghost">Ghost</Button>
              <Button disabled>Disabled</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">Healthy</Badge>
              <Badge variant="secondary">Trial</Badge>
              <Badge variant="destructive">Down</Badge>
              <Badge variant="outline">Inactive</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Input & select</CardTitle>
            <CardDescription>
              Label, placeholder, status invalid, dan pilihan keyboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="preview-email" className="text-sm">
                Email admin
              </label>
              <Input
                id="preview-email"
                type="email"
                placeholder="admin@contoh.id"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="preview-plan" className="text-sm">
                Plan
              </label>
              <Select defaultValue="pro">
                <SelectTrigger id="preview-plan">
                  <SelectValue placeholder="Pilih plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="preview-invalid" className="text-sm">
                Contoh validasi
              </label>
              <Input
                id="preview-invalid"
                defaultValue="email-invalid"
                aria-invalid="true"
                aria-describedby="email-error"
              />
              <p id="email-error" className="text-xs text-kinetic-error">
                Masukkan alamat email yang valid.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="palette-title" className="space-y-4">
        <h2
          id="palette-title"
          className="font-display text-headline-sm font-semibold"
        >
          Warna utama
        </h2>
        <div className="grid grid-cols-2 gap-gutter sm:grid-cols-3 xl:grid-cols-6">
          {[
            { name: "Canvas", hex: "#0F131C", color: "bg-background" },
            { name: "Surface", hex: "#1C1F29", color: "bg-card" },
            { name: "Elevated", hex: "#262A34", color: "bg-muted" },
            { name: "Cyan", hex: "#00F2FE", color: "bg-primary" },
            { name: "Indigo", hex: "#3131C0", color: "bg-secondary" },
            { name: "Emerald", hex: "#67F4B7", color: "bg-success" },
          ].map((swatch) => (
            <div
              key={swatch.name}
              className="overflow-hidden rounded-control border border-white/8"
            >
              <div className={`h-14 ${swatch.color}`} />
              <div className="space-y-1 p-3">
                <p className="text-sm">{swatch.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {swatch.hex}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="table-title" className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="table-title"
              className="font-display text-headline-sm font-semibold"
            >
              DataTable
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              62 produk contoh untuk mencoba pencarian, filter, urutan, dan
              pagination.
            </p>
          </div>
          <Button
            variant="secondary"
            aria-pressed={loading}
            onClick={() => setLoading(!loading)}
          >
            {loading ? "Selesai memuat" : "Simulasi loading"}
          </Button>
        </div>
        <DataTable
          caption="Produk contoh"
          columns={columns}
          rows={rows.slice(
            (query.page - 1) * query.pageSize,
            query.page * query.pageSize,
          )}
          rowCount={rows.length}
          rowKey={(row) => row.id}
          query={query}
          onQueryChange={setQuery}
          loading={loading}
          filters={
            <div className="w-44 space-y-2">
              <label htmlFor="status-filter" className="text-sm font-medium">
                Filter status
              </label>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setQuery({ ...query, page: 1 });
                }}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  <SelectItem value="Healthy">Healthy</SelectItem>
                  <SelectItem value="Degraded">Degraded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      </section>
    </div>
  );
}
