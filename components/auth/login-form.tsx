"use client";

import { useActionState } from "react";
import { LoaderCircle, ArrowRight } from "lucide-react";
import { signIn } from "@/app/login/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(signIn, {});
  return (
    <form action={action} className="space-y-5" aria-busy={pending}>
      <input type="hidden" name="next" value={nextPath} />
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email admin
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="admin@perusahaan.com"
          required
          maxLength={254}
          disabled={pending}
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Masukkan password Anda"
          required
          maxLength={4096}
          disabled={pending}
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </div>
      {state.error && (
        <p id="login-error" role="alert" className="text-sm text-kinetic-error">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <ArrowRight aria-hidden="true" />
        )}
        {pending ? "Memverifikasi…" : "Masuk ke dashboard"}
      </Button>
    </form>
  );
}
