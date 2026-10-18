import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        "flex min-h-10 w-full min-w-0 rounded-control border border-input bg-card/80 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-kinetic-error aria-invalid:ring-kinetic-error/20 [@media(pointer:coarse)]:min-h-12",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
