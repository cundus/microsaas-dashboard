"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createMicroSaaS, updateMicroSaaS } from "../actions";
import { slugify } from "../validation";

type Product = Database["public"]["Tables"]["microsaas"]["Row"];

export function MicroSaaSForm({ product }: { product?: Product }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={product ? "secondary" : "default"}>
          {product ? "Edit produk" : "Tambah MicroSaaS"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit MicroSaaS" : "Tambah MicroSaaS"}
          </DialogTitle>
          <DialogDescription>
            Kelola identitas dan status produk Anda.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ProductFields product={product} onSaved={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProductFields({
  product,
  onSaved,
}: {
  product?: Product;
  onSaved: () => void;
}) {
  const id = useId();
  const router = useRouter();
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [editedSlug, setEditedSlug] = useState(Boolean(product));
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="space-y-4"
      action={(form) =>
        startTransition(async () => {
          setError("");
          const result = product
            ? await updateMicroSaaS(product.id, form)
            : await createMicroSaaS(form);
          if (result.error) {
            setError(result.error);
            return;
          }
          onSaved();
          router.push(`/microsaas/${result.slug}`);
          router.refresh();
        })
      }
    >
      <fieldset disabled={pending} className="space-y-4">
        <label className="block space-y-2" htmlFor={`${id}-name`}>
          <span>Nama produk</span>
          <Input
            id={`${id}-name`}
            name="name"
            required
            maxLength={120}
            defaultValue={product?.name}
            onChange={(e) => {
              if (!editedSlug) setSlug(slugify(e.target.value));
            }}
          />
        </label>
        <label className="block space-y-2" htmlFor={`${id}-slug`}>
          <span>Slug</span>
          <Input
            id={`${id}-slug`}
            name="slug"
            required
            maxLength={80}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={slug}
            onChange={(e) => {
              setEditedSlug(true);
              setSlug(e.target.value);
            }}
          />
        </label>
        <label className="block space-y-2" htmlFor={`${id}-description`}>
          <span>Deskripsi</span>
          <textarea
            id={`${id}-description`}
            name="description"
            maxLength={2000}
            defaultValue={product?.description ?? ""}
            className="w-full rounded-md border border-input bg-background p-3"
            rows={3}
          />
        </label>
        <label className="block space-y-2" htmlFor={`${id}-url`}>
          <span>URL produk</span>
          <Input
            id={`${id}-url`}
            name="url"
            type="url"
            required
            maxLength={2048}
            placeholder="https://produk.example.com"
            defaultValue={product?.url}
          />
        </label>
        <label className="block space-y-2" htmlFor={`${id}-logo`}>
          <span>Logo (PNG/JPEG/WebP, maksimal 1 MB)</span>
          <Input
            id={`${id}-logo`}
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
          />
        </label>
        {product?.logo_url && (
          <p className="text-sm text-muted-foreground">
            Biarkan kosong untuk mempertahankan logo saat ini.
          </p>
        )}
        <label className="block space-y-2" htmlFor={`${id}-status`}>
          <span>Status</span>
          <select
            id={`${id}-status`}
            name="status"
            defaultValue={product?.status ?? "active"}
            className="w-full rounded-md border border-input bg-background p-3"
          >
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </label>
        <p role="alert" className="text-sm text-kinetic-error">
          {error}
        </p>
        <Button type="submit">
          {pending ? "Menyimpan…" : "Simpan produk"}
        </Button>
      </fieldset>
    </form>
  );
}
