import { notFound } from "next/navigation";
import { AppShell, PageHeader } from "@/components/app/app-shell";
import { CustomerDetailView } from "@/components/customers/customer-detail";
import { customerDetails } from "@/lib/data/mock";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = customerDetails[id];

  if (!customer) notFound();

  return (
    <AppShell activePath="/customers">
      <PageHeader title="거래처 상세" description="매출, 회입, 상품, 처리 이슈, 방문일지, 약속을 한 화면에서 확인합니다." />
      <CustomerDetailView customer={customer} />
    </AppShell>
  );
}
