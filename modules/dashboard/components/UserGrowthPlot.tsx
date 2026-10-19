"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { UserGrowthPoint } from "../user-growth";

export function UserGrowthPlot({
  data,
  dateLabel,
  numberLabel,
}: {
  data: UserGrowthPoint[];
  dateLabel: (day: string) => string;
  numberLabel: (value: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <BarChart
        data={data}
        accessibilityLayer
        margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
      >
        <CartesianGrid
          stroke="rgba(255,255,255,0.04)"
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="period_start"
          tickFormatter={dateLabel}
          stroke="#B9CACB"
          tickLine={false}
          axisLine={false}
          minTickGap={36}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          allowDecimals={false}
          domain={[0, "auto"]}
          stroke="#B9CACB"
          tickLine={false}
          axisLine={false}
          width={56}
          tick={{ fontSize: 12 }}
          tickFormatter={numberLabel}
        />
        <Tooltip
          cursor={{ fill: "#67F4B7", fillOpacity: 0.08 }}
          labelFormatter={(_, payload) => {
            const row = payload[0]?.payload as UserGrowthPoint | undefined;
            return row
              ? row.period_start === row.period_end
                ? dateLabel(row.period_start)
                : `${dateLabel(row.period_start)} – ${dateLabel(row.period_end)}`
              : "";
          }}
          formatter={(value) => [numberLabel(Number(value)), "Pengguna baru"]}
          contentStyle={{
            background: "rgba(15,19,28,0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            backdropFilter: "blur(24px)",
            color: "#DFE2EF",
          }}
          labelStyle={{ color: "#DFE2EF" }}
        />
        <Bar
          dataKey="new_users"
          name="Pengguna baru"
          fill="#67F4B7"
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
