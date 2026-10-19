"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { deleteMicroSaaS, setMaintenance, saveConfiguration } from "../actions";

export function ProductConfirmation({
  id,
  name,
  maintenance,
}: {
  id: string;
  name: string;
  maintenance?: boolean;
}) {
  const router = useRouter();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const deleting = maintenance === undefined;
  const label = deleting
    ? "Hapus produk"
    : maintenance
      ? "Nonaktifkan maintenance"
      : "Aktifkan maintenance";
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) {
          setOpen(value);
          setConfirmation("");
          setError("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant={deleting ? "destructive" : "secondary"}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            {deleting
              ? "Penghapusan bersifat permanen. Produk dengan riwayat terkait tidak dapat dihapus; gunakan status nonaktif."
              : "Status maintenance disimpan sebagai konfigurasi. Aplikasi produk perlu membaca status ini untuk membatasi layanannya."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          action={() =>
            startTransition(async () => {
              const result = deleting
                ? await deleteMicroSaaS(id, confirmation)
                : await setMaintenance(id, !maintenance, confirmation);
              if (result.error) {
                setError(result.error);
                return;
              }
              setOpen(false);
              setConfirmation("");
              if (deleting) router.push("/microsaas");
              router.refresh();
            })
          }
        >
          <label className="block space-y-2" htmlFor={inputId}>
            <span>
              Ketik nama produk: <strong>{name}</strong>
            </span>
            <Input
              id={inputId}
              required
              value={confirmation}
              disabled={pending}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
            />
          </label>
          <p role="alert" className="text-sm text-kinetic-error">
            {error}
          </p>
          <Button
            type="submit"
            variant={deleting ? "destructive" : "default"}
            disabled={pending || confirmation !== name}
          >
            {pending ? "Memproses…" : label}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConfigurationForm({
  id,
  config,
}: {
  id: string;
  config: {
    webhook_url: string | null;
    environment: string;
    api_key_mask: string | null;
    maintenance_mode: boolean;
  } | null;
}) {
  const inputId = useId();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return (
    <form
      className="space-y-4"
      action={(form) =>
        startTransition(async () => {
          const result = await saveConfiguration(id, form);
          setMessage(result.error ?? result.success ?? "");
        })
      }
    >
      <fieldset disabled={pending} className="space-y-4">
        <label className="block space-y-2" htmlFor={`${inputId}-webhook`}>
          <span>Webhook URL (HTTPS)</span>
          <Input
            id={`${inputId}-webhook`}
            name="webhook_url"
            type="url"
            maxLength={2048}
            defaultValue={config?.webhook_url ?? ""}
          />
        </label>
        <label className="block space-y-2" htmlFor={`${inputId}-env`}>
          <span>Environment</span>
          <select
            id={`${inputId}-env`}
            name="environment"
            defaultValue={config?.environment ?? "sandbox"}
            className="w-full rounded-md border border-input bg-background p-3"
          >
            <option value="sandbox">Sandbox</option>
            <option value="production">Production</option>
          </select>
        </label>
        <p className="text-sm text-muted-foreground">
          API key saat ini: {config?.api_key_mask ?? "Belum diatur"}. Kosongkan
          untuk mempertahankan key.
        </p>
        <label className="block space-y-2" htmlFor={`${inputId}-key`}>
          <span>API key baru</span>
          <Input
            id={`${inputId}-key`}
            name="api_key"
            type="password"
            maxLength={4096}
            autoComplete="new-password"
          />
        </label>
        <Button type="submit">
          {pending ? "Menyimpan…" : "Simpan konfigurasi"}
        </Button>
      </fieldset>
      <p role="status" className="text-sm" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
