import { KPICardGrid } from "@/modules/dashboard/components/KPICardGrid";

import { MicroSaaSCardGrid } from "@/modules/dashboard/components/MicroSaaSCardGrid";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-headline-lg font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan bisnis dari seluruh MicroSaaS dalam akses Anda.
        </p>
      </div>
      <KPICardGrid />
      <MicroSaaSCardGrid />
    </div>
  );
}
