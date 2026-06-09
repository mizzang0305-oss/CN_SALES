import Link from "next/link";
import { formatWon } from "@/lib/format";
import { customers } from "@/lib/data/mock";

export default function MobileDashboardPage() {
  const todayTasks = customers;
  return (
    <main className="min-h-screen bg-slate-50 p-4 pb-20">
      <header className="sticky top-0 z-10 -mx-4 bg-slate-50 px-4 py-3">
        <h1 className="text-2xl font-semibold">오늘 확인</h1>
        <input className="mt-3 h-11 w-full rounded-md border border-slate-300 px-3 text-[16px]" placeholder="거래처 검색" />
      </header>
      <section className="mt-3 space-y-3">
        {todayTasks.map((customer) => (
          <Link key={customer.id} href={`/m/customers/${customer.id}`} className="block rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">{customer.name}</div>
                <div className="mt-1 text-[15px] text-slate-500">{customer.managementStatus}</div>
              </div>
              <div className="text-right text-[22px] font-semibold">{formatWon(customer.currentArBalance)}</div>
            </div>
            <div className="mt-3 text-[15px] text-slate-600">약속일 {customer.nextPromiseDate} · 최근입금 {customer.lastReceiptDate}</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
