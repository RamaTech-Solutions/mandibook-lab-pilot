import { requireFirm } from "@/lib/auth";
import { getDashboardStats } from "@/actions/reports";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default async function DashboardPage() {
  const { firm } = await requireFirm();
  const stats = await getDashboardStats();

  return (
    <DashboardView
      firmName={firm.name}
      mandiName={firm.mandiName}
      stats={{
        todayTransactionCount: stats.todayTransactionCount,
        todayGross: stats.todayGross,
        todayCommission: stats.todayCommission,
        totalKisanBaki: stats.totalKisanBaki,
        totalVyapariBaki: stats.totalVyapariBaki,
      }}
    />
  );
}
