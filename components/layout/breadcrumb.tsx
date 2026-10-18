"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getBreadcrumbs } from "@/lib/navigation";

export function Breadcrumb() {
  const crumbs = getBreadcrumbs(usePathname());
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {crumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex min-w-0 items-center gap-2">
            {index > 0 && (
              <ChevronRight className="size-3 shrink-0" aria-hidden="true" />
            )}
            {index === crumbs.length - 1 ? (
              <span aria-current="page" className="break-all text-foreground">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
