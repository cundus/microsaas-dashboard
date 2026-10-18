"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { adminRoles } from "@/lib/auth/session";
import { Breadcrumb } from "./breadcrumb";

export function Header({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const admin = useAuth();
  const [open, setOpen] = useState(false);
  const profile = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!profile.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  if (!admin) return null;
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const initials =
    admin.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "A";
  return (
    <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between gap-4 border-b border-white/8 bg-background/90 px-8 py-3 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
        >
          <ToggleIcon aria-hidden="true" />
        </Button>
        <Breadcrumb />
      </div>
      <div
        ref={profile}
        className="relative shrink-0"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setOpen(false);
        }}
      >
        <Button
          ref={trigger}
          variant="ghost"
          className="h-auto gap-3 px-2 text-left"
          aria-expanded={open}
          aria-controls="profile-dropdown"
          onClick={() => setOpen(!open)}
        >
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm text-primary"
          >
            {initials}
          </span>
          <span className="hidden max-w-48 sm:block">
            <span className="block truncate">{admin.name}</span>
            <span className="block text-xs font-normal text-muted-foreground">
              {adminRoles[admin.role]}
            </span>
          </span>
          <ChevronDown
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="sr-only">Menu akun</span>
        </Button>
        {open && (
          <div
            id="profile-dropdown"
            className="glass-floating absolute top-full right-0 mt-3 w-72 max-w-[calc(100vw-2rem)] space-y-4 rounded-lg p-4"
          >
            <div className="space-y-1 border-b border-white/8 pb-4">
              <p className="break-words font-semibold">{admin.name}</p>
              <p className="break-all text-sm text-muted-foreground">
                {admin.email}
              </p>
              <p className="text-xs text-primary">{adminRoles[admin.role]}</p>
            </div>
            <LogoutButton />
          </div>
        )}
      </div>
    </header>
  );
}
