"use client";

import { useActionState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [state, action, pending] = useActionState(signOut, {});
  return (
    <form action={action} className="space-y-2">
      <Button type="submit" variant="secondary" disabled={pending}>
        <LogOut aria-hidden="true" />
        {pending ? "Keluar…" : "Keluar"}
      </Button>
      {state.error && (
        <p role="alert" className="text-sm text-kinetic-error">
          {state.error}
        </p>
      )}
    </form>
  );
}
