"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  banUser,
  unbanUser,
  deleteUser,
  resetUserPassword,
} from "../account-actions";

type Action = "ban" | "unban" | "reset" | "delete";
const labels = {
  ban: "Ban pengguna",
  unban: "Cabut ban",
  reset: "Reset password",
  delete: "Hapus akun",
};

export function UserActionsMenu({
  user,
}: {
  user: { id: string; email: string; name: string; status: string };
}) {
  const [action, setAction] = useState<Action | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const fieldId = useId();
  const description =
    action === "ban"
      ? `Ban akun ${user.name}. Masukkan alasan untuk catatan audit.`
      : action === "unban"
        ? `Kembalikan status akun ${user.name} sebelum diban.`
        : action === "delete"
          ? `Akun ${user.name} akan dihapus dari daftar pengguna. Riwayat subscription dan transaksi tetap disimpan. Ketik ${user.email} untuk melanjutkan.`
          : `Minta tautan reset password untuk ${user.email}. Pengguna akan melanjutkan proses di MicroSaaS mereka.`;
  function close(open: boolean) {
    if (!open) {
      setAction(null);
      setValue("");
      setError("");
    }
  }
  function confirm() {
    if (!action) return;
    setError("");
    startTransition(async () => {
      try {
        const result = await (action === "ban"
          ? banUser(user.id, value)
          : action === "unban"
            ? unbanUser(user.id)
            : action === "delete"
              ? deleteUser(user.id, value)
              : resetUserPassword(user.id));
        if (result.error) {
          setError(result.error);
          toast.error(result.error);
          return;
        }
        toast.success(result.success);
        close(false);
        if (action === "delete") router.push("/users");
        else router.refresh();
      } catch {
        const message = "Aksi gagal diproses. Silakan coba lagi.";
        setError(message);
        toast.error(message);
      }
    });
  }
  return (
    <>
      <div
        role="group"
        aria-label="Aksi akun pengguna"
        className="flex flex-wrap gap-2"
      >
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => setAction(user.status === "banned" ? "unban" : "ban")}
        >
          {user.status === "banned" ? <ShieldCheck /> : <Ban />}
          {user.status === "banned" ? labels.unban : labels.ban}
        </Button>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => setAction("reset")}
        >
          <KeyRound />
          {labels.reset}
        </Button>
        <Button
          variant="destructive"
          disabled={pending}
          onClick={() => setAction("delete")}
        >
          <Trash2 />
          {labels.delete}
        </Button>
      </div>
      <ConfirmDialog
        open={action !== null}
        onOpenChange={close}
        title={action ? labels[action] : "Aksi pengguna"}
        description={description}
        confirmLabel={action ? labels[action] : "Konfirmasi"}
        pending={pending}
        destructive={action === "ban" || action === "delete"}
        disabled={
          action === "ban"
            ? !value.trim()
            : action === "delete"
              ? value !== user.email
              : false
        }
        onConfirm={confirm}
      >
        {(action === "ban" || action === "delete") && (
          <div className="space-y-2">
            <label htmlFor={fieldId} className="text-sm font-medium">
              {action === "ban" ? "Alasan ban" : "Konfirmasi email pengguna"}
            </label>
            <Input
              id={fieldId}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              maxLength={action === "ban" ? 500 : 320}
              required
              disabled={pending}
              autoComplete="off"
            />
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-kinetic-error">
            {error}
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
