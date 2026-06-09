import { AppShell, PageHeader } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";

export default function ClaimsPage() {
  return (
    <AppShell activePath="/claims">
      <PageHeader title="처리 이슈" description="클레임은 수동 등록부터 관리합니다." />
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <form className="grid gap-4 sm:grid-cols-2">
          {["처리일", "거래처명", "상품명", "유형", "상태", "담당자"].map((label) => (
            <label key={label} className="text-[15px] font-semibold">
              {label}
              <input className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3" />
            </label>
          ))}
          <label className="sm:col-span-2 text-[15px] font-semibold">
            처리 내용
            <textarea className="mt-2 min-h-28 w-full rounded-md border border-slate-300 p-3" />
          </label>
          <Button type="button" className="h-11 sm:w-40">수동 등록</Button>
        </form>
      </section>
    </AppShell>
  );
}
