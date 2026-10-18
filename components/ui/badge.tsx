import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-6 shrink-0 items-center gap-1 rounded-full border px-2 text-xs font-medium whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-primary/20 bg-primary/12 text-primary",
        secondary:
          "border-kinetic-secondary/20 bg-kinetic-secondary/12 text-kinetic-secondary",
        success: "border-success/20 bg-success/12 text-success",
        destructive:
          "border-kinetic-error/20 bg-kinetic-error/12 text-kinetic-error",
        outline: "border-border text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
