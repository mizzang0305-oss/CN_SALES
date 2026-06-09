import { AppShell, PageHeader } from "@/components/app/app-shell";
import { customers } from "@/lib/data/mock";

export default function TasksPage() {
  const tasks = customers.flatMap((customer) => [
    { customer: customer.name, title: "입금 일정 확인", date: customer.nextPromiseDate, status: customer.managementStatus.includes("재확인") ? "지연" : "오늘" },
  ]);

  return (
    <AppShell activePath="/tasks">
      <PageHeader title="약속관리" description="오늘 할 일과 약속일 확인 필요 항목을 통합 관리합니다." />
      <section className="grid gap-3">
        {tasks.map((task) => (
          <div key={`${task.customer}-${task.title}`} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-lg font-semibold">{task.title}</div>
            <div className="mt-1 text-[15px] text-slate-500">{task.customer} · {task.date}</div>
            <div className="mt-3 inline-flex rounded-md bg-blue-50 px-2 py-1 text-[14px] font-semibold text-blue-700">{task.status}</div>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
