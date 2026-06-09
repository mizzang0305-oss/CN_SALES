import { AppShell, PageHeader } from "@/components/app/app-shell";

export default function ReportsPage() {
  return <AppShell activePath="/reports"><PageHeader title="보고서" description="자동 DOCX/PDF 보고서는 2차 범위이며 현재는 조회 기반 구조만 준비합니다." /></AppShell>;
}
