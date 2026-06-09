import { notFound } from "next/navigation";
import { CustomerDetailView } from "@/components/customers/customer-detail";
import { customerDetails } from "@/lib/data/mock";

export default async function MobileCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = customerDetails[id];

  if (!customer) notFound();

  return (
    <main className="min-h-screen bg-slate-50 p-4 pb-20">
      <CustomerDetailView customer={customer} mobile />
    </main>
  );
}
