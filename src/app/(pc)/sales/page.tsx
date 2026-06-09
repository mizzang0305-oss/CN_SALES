import { AppShell, PageHeader } from "@/components/app/app-shell";

export default function SalesPage() {
  return <AppShell activePath="/sales"><PageHeader title="매출" description="customer_total 기준 보고용 매출을 조회하는 화면입니다." /></AppShell>;
}
