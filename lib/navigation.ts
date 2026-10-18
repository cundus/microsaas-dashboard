import type { Admin } from "@/lib/auth/session";

const all = ["super_admin", "operator_admin", "finance_admin"] as const;
const operations = ["super_admin", "operator_admin"] as const;
const owner = ["super_admin"] as const;
const finance = ["super_admin", "finance_admin"] as const;

export const navigation = [
  { href: "/", label: "Dashboard", roles: all },
  { href: "/microsaas", label: "MicroSaaS", roles: all },
  { href: "/users", label: "Pengguna", roles: operations },
  { href: "/subscriptions", label: "Subscription", roles: all },
  { href: "/revenue", label: "Pendapatan", roles: all },
  { href: "/payment", label: "Pembayaran", roles: finance },
  { href: "/performance", label: "Performa", roles: operations },
  { href: "/alerts", label: "Notifikasi & Alert", roles: operations },
  { href: "/settings", label: "Pengaturan", roles: owner },
  { href: "/design-system", label: "Design system", roles: all },
] as const;

export const modulePages = [
  ...navigation.filter(({ href }) => !["/", "/design-system"].includes(href)),
  { href: "/revenue/transactions", label: "Transaksi", roles: all },
  { href: "/payment/gateways", label: "Payment gateway", roles: finance },
  { href: "/payment/plans", label: "Pricing plan", roles: finance },
  { href: "/payment/promo-codes", label: "Promo & kupon", roles: owner },
  { href: "/payment/webhook-logs", label: "Webhook log", roles: owner },
  { href: "/settings/team", label: "Tim & role admin", roles: owner },
  { href: "/settings/audit-log", label: "Audit log", roles: owner },
];

export function canAccess(
  item: { roles: readonly Admin["role"][] },
  role: Admin["role"],
) {
  return item.roles.includes(role);
}

export function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return [
    { href: "/", label: "Dashboard" },
    ...segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      const known = [...navigation, ...modulePages].find(
        (item) => item.href === href,
      );
      let label = segment;
      try {
        label = decodeURIComponent(segment).replaceAll("-", " ");
      } catch {
        // Keep malformed URL segments readable without breaking the shell.
      }
      return { href, label: known?.label ?? label };
    }),
  ];
}
