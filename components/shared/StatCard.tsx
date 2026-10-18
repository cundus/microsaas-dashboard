import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string | number;
  delta?: number;
  comparison?: string;
  action?: ReactNode;
  children?: ReactNode;
  loading?: boolean;
};

function StatCard({
  label,
  value,
  delta,
  comparison = "vs periode sebelumnya",
  action,
  children,
  loading = false,
}: StatCardProps) {
  const trend =
    delta === undefined || delta === 0 ? "neutral" : delta > 0 ? "up" : "down";
  const Icon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

  return (
    <Card aria-label={label} aria-busy={loading}>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <span className="text-label-caps uppercase text-muted-foreground">
          {label}
        </span>
        {action}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading ? (
          <>
            <span className="sr-only">Memuat {label}</span>
            <div
              aria-hidden="true"
              className="h-9 w-3/4 rounded-sm bg-muted motion-safe:animate-pulse"
            />
            <div
              aria-hidden="true"
              className="h-6 w-1/2 rounded-sm bg-muted motion-safe:animate-pulse"
            />
          </>
        ) : (
          <>
            <p className="font-display text-metric-stat font-extrabold tabular-nums">
              {value}
            </p>
            {delta !== undefined && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    trend === "up"
                      ? "success"
                      : trend === "down"
                        ? "destructive"
                        : "outline"
                  }
                >
                  <Icon aria-hidden="true" />
                  {delta > 0 ? "+" : ""}
                  {delta}%
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {comparison}
                </span>
              </div>
            )}
            {children}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export { StatCard, type StatCardProps };
