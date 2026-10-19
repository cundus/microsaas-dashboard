"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatKPI } from "../kpis";
import type { revenueChartData } from "../revenue";

export function RevenuePlot({
  chart,
  id,
  currency,
  colors,
  dateLabel,
}: {
  chart: ReturnType<typeof revenueChartData>;
  id: string;
  currency: string;
  colors: string[];
  dateLabel: (day: string, full?: boolean) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <AreaChart
        data={chart.points}
        accessibilityLayer
        margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
      >
        <defs>
          {chart.products.map((product, index) => (
            <linearGradient
              key={product.id}
              id={`${id}-${product.id}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={colors[index % colors.length]}
                stopOpacity={0.2}
              />
              <stop
                offset="100%"
                stopColor={colors[index % colors.length]}
                stopOpacity={0}
              />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          stroke="rgba(255,255,255,0.04)"
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="day"
          tickFormatter={(value: string) => dateLabel(value)}
          stroke="#B9CACB"
          tickLine={false}
          axisLine={false}
          minTickGap={36}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          stroke="#B9CACB"
          tickLine={false}
          axisLine={false}
          width={72}
          tick={{ fontSize: 12 }}
          domain={[0, "auto"]}
          tickFormatter={(value: number) =>
            new Intl.NumberFormat("id-ID", {
              notation: "compact",
              maximumFractionDigits: 1,
            }).format(value)
          }
        />
        <Tooltip
          labelFormatter={(value) => dateLabel(String(value), true)}
          formatter={(value) => formatKPI(Number(value), currency)}
          contentStyle={{
            background: "rgba(15,19,28,0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            backdropFilter: "blur(24px)",
            color: "#DFE2EF",
          }}
          labelStyle={{ color: "#DFE2EF" }}
        />
        {chart.products.map((product, index) => (
          <Area
            key={product.id}
            dataKey={product.id}
            name={product.name}
            type="monotone"
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            fill={`url(#${id}-${product.id})`}
            isAnimationActive={false}
            dot={chart.points.length === 1}
            activeDot={{ r: 4 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
