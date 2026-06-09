import { AppShell, PageHeader } from "@/components/app/app-shell";
import { VisitForm } from "@/components/mobile/forms";

export default function VisitsPage() {
  return (
    <AppShell activePath="/visits">
      <PageHeader title="방문일지" description="거래처 상담, 미수관리, 상품제안, 다음 조치를 기록합니다." />
      <VisitForm />
    </AppShell>
  );
}
