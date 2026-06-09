import Link from "next/link";
import { AppShell, PageHeader } from "@/components/app/app-shell";
import { formatWon } from "@/lib/format";
import { customers } from "@/lib/data/mock";

export default function ArPage() {
  const sorted = [...customers].sort((a, b) => b.currentArBalance - a.currentArBalance);

  return (
    <AppShell activePath="/ar">
      <PageHeader title="미수관리" description="기준일별 외상잔액과 입금 약속 상태를 확인합니다." />
      <div className="grid gap-3">
        {sorted.map((customer) => (
          <Link key={customer.id} href={`/customers/${customer.id}`} className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-400">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-semibold">{customer.name}</div>
                <div className="mt-1 text-[15px] text-slate-500">
                  최근입금 {customer.lastReceiptDate} · 약속일 {customer.nextPromiseDate}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-[24px] font-semibold">{formatWon(customer.currentArBalance)}</div>
                <div className="mt-1 text-[15px] font-semibold text-blue-700">{customer.managementStatus}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
