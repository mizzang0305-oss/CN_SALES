import { AppShell, PageHeader } from "@/components/app/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardData } from "@/lib/import/service-factory";

export default async function DashboardPage() {
  const dashboardData = await getDashboardData();

  return (
    <AppShell activePath="/dashboard">
      <PageHeader title="대시보드" description="파트별 매출, 회입, 외상잔액과 목표 대비 현황을 확인합니다." />
      <DashboardView data={dashboardData} />
    </AppShell>
  );
}
