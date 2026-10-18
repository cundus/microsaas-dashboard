"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  Boxes,
  CreditCard,
  LayoutDashboard,
  Palette,
  Repeat,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { canAccess, isActivePath, navigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const icons = {
  "/": LayoutDashboard,
  "/microsaas": Boxes,
  "/users": Users,
  "/subscriptions": Repeat,
  "/revenue": TrendingUp,
  "/payment": CreditCard,
  "/performance": Activity,
  "/alerts": Bell,
  "/settings": Settings,
  "/design-system": Palette,
};

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const admin = useAuth();
  if (!admin) return null;
  return (
    <aside
      id="app-sidebar"
      aria-label="Sidebar"
      className={cn(
        "sticky top-0 flex h-dvh shrink-0 flex-col border-r border-white/8 bg-kinetic-surface-container-lowest",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <Link
        href="/"
        aria-label="MicroSaaS Admin — Dashboard"
        className="flex h-20 shrink-0 items-center gap-3 px-5 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary">
          <Boxes className="size-6" aria-hidden="true" />
        </span>
        {!collapsed && (
          <span className="font-display text-lg font-bold tracking-tight">
            MicroSaaS
            <span className="block text-label-caps tracking-widest text-muted-foreground uppercase">
              Admin workspace
            </span>
          </span>
        )}
      </Link>
      <nav
        aria-label="Navigasi utama"
        className="flex-1 space-y-1 overflow-y-auto px-3 py-6"
      >
        {navigation
          .filter((item) => canAccess(item, admin.role))
          .map((item) => {
            const Icon = icons[item.href];
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-control border border-transparent px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  collapsed && "justify-center px-0",
                  active
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-white/4 hover:text-foreground",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                {!collapsed && item.label}
              </Link>
            );
          })}
      </nav>
      {!collapsed && (
        <p className="border-t border-white/8 px-6 py-5 text-xs text-muted-foreground">
          Satu workspace. Semua produk.
        </p>
      )}
    </aside>
  );
}
