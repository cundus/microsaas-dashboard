"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      closeButton
      toastOptions={{
        style: {
          background: "var(--popover)",
          color: "var(--popover-foreground)",
          borderColor: "var(--border)",
        },
      }}
    />
  );
}
