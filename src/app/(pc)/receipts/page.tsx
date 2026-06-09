import { AppShell, PageHeader } from "@/components/app/app-shell";

export default function ReceiptsPage() {
  return <AppShell activePath="/receipts"><PageHeader title="회입" description="입금액과 입금할인을 합산한 회입 내역을 조회합니다." /></AppShell>;
}
