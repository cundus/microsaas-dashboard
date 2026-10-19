import { Suspense } from "react";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import {
  getGlobalKPIs,
  getMicroSaaSList,
  getRevenueTimeSeries,
  getUserGrowthTimeSeries,
  getRecentActivity,
} from "@/modules/dashboard/actions";
import { presetRange } from "@/modules/dashboard/revenue";

import { KPICardGrid } from "@/modules/dashboard/components/KPICardGrid";

import { MicroSaaSCardGrid } from "@/modules/dashboard/components/MicroSaaSCardGrid";
import { RevenueAreaChart } from "@/modules/dashboard/components/RevenueAreaChart";
import { UserGrowthBarChart } from "@/modules/dashboard/components/UserGrowthBarChart";
import { ActivityFeed } from "@/modules/dashboard/components/ActivityFeed";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-headline-lg font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan bisnis dari seluruh MicroSaaS dalam akses Anda.
        </p>
      </div>
      <Suspense fallback={<p role="status">Memuat ringkasan dashboard…</p>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
async function DashboardContent() {
  await connection();
  const admin = await requireAdmin();
  const range = presetRange(30);
  const growthRange = { ...range, interval: "day" as const };
  const [kpis, products, revenue, growth, activity] = await Promise.all([
    getGlobalKPIs(),
    getMicroSaaSList(),
    getRevenueTimeSeries(range),
    admin.role === "finance_admin"
      ? null
      : getUserGrowthTimeSeries(growthRange),
    getRecentActivity(20),
  ]);

  return (
    <>
      <KPICardGrid initialResult={kpis} />
      <MicroSaaSCardGrid initialResult={products} />
      <RevenueAreaChart initialResult={revenue} initialRange={range} />
      {growth && (
        <UserGrowthBarChart initialResult={growth} initialRange={growthRange} />
      )}
      <ActivityFeed initialResult={activity} />
    </>
  );
}
