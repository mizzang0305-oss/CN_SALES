import { AppShell, PageHeader } from "@/components/app/app-shell";

export default function TargetsPage() {
  return <AppShell activePath="/targets"><PageHeader title="목표" description="월별 파트 목표와 목표 대비율 관리를 위한 화면입니다." /></AppShell>;
}
