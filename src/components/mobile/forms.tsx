import { Button } from "@/components/ui/button";

export function VisitForm() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <form className="grid gap-4 sm:grid-cols-2">
        {["거래처", "방문일시", "방문 목적", "상담 유형", "약속일", "약속금액"].map((label) => (
          <label key={label} className="text-[15px] font-semibold">
            {label}
            <input className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3" />
          </label>
        ))}
        <label className="sm:col-span-2 text-[15px] font-semibold">
          상담 요약
          <textarea className="mt-2 min-h-32 w-full rounded-md border border-slate-300 p-3" />
        </label>
        <Button type="button" className="h-11 sm:w-40">방문일지 저장</Button>
      </form>
    </section>
  );
}
