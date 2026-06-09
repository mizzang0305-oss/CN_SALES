import Link from "next/link";
import { AppShell, PageHeader } from "@/components/app/app-shell";
import { formatWon } from "@/lib/format";
import { customers } from "@/lib/data/mock";

export default function CustomersPage() {
  return (
    <AppShell activePath="/customers">
      <PageHeader title="거래처" description="담당 파트와 미수 상태를 기준으로 거래처를 조회합니다." />
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full border-collapse text-[15px]">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-4 py-3 text-left">거래처</th>
              <th className="px-4 py-3 text-left">파트</th>
              <th className="px-4 py-3 text-left">담당</th>
              <th className="px-4 py-3 text-right">이번달 매출</th>
              <th className="px-4 py-3 text-right">외상잔액</th>
              <th className="px-4 py-3 text-left">상태</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-t border-slate-200">
                <td className="px-4 py-3 font-semibold">
                  <Link href={`/customers/${customer.id}`} className="hover:underline">
                    {customer.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{customer.partCode}</td>
                <td className="px-4 py-3">{customer.salesRepName}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatWon(customer.monthSales)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatWon(customer.currentArBalance)}</td>
                <td className="px-4 py-3">{customer.managementStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
