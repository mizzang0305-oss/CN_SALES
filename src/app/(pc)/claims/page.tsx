import { CheckCircle2, Paperclip, Save, Search, ShieldCheck } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";

const mediaBucketName = "cn-sales-claim-media";
const claimResolutionHistory = [
  { status: "진행", summary: "거래처 확인 대기", date: "2026-06-09" },
  { status: "접수", summary: "사진 증빙 접수", date: "2026-06-08" },
];
const productSolutionGuides = [
  { id: "guide-1", title: "동일 상품 품질 확인", meta: "최근 90일 / 사용 8회" },
  { id: "guide-2", title: "입고 검수 후 교환", meta: "최근 90일 / 사용 5회" },
  { id: "guide-3", title: "거래처 보관 상태 확인", meta: "최근 90일 / 사용 3회" },
];

const claimFields = [
  { id: "claimDate", label: "접수일", type: "date" },
  { id: "partCode", label: "파트" },
  { id: "salesRepId", label: "영업사원" },
  { id: "customerId", label: "거래처" },
  { id: "productId", label: "상품" },
  { id: "issueType", label: "유형" },
];

const selectFields = [
  { id: "status", label: "상태", values: ["접수", "진행", "처리완료", "보류", "재확인필요"] },
  { id: "causeType", label: "원인", values: ["불량", "배송", "보관", "거래처 확인", "미확인"] },
  { id: "actionType", label: "조치", values: ["교환", "회수", "재출고", "확인 요청", "보류"] },
  { id: "solutionGuideId", label: "해결방안", values: productSolutionGuides.map((guide) => guide.title) },
];

const claimRows = [
  { customer: "거래처 확인 필요", product: "상품 확인 필요", issue: "품질", status: "진행", media: "2", due: "2026-06-10" },
  { customer: "미디어 재확인 필요", product: "상품 확인 필요", issue: "배송", status: "접수", media: "1", due: "2026-06-11" },
];

export default function ClaimsPage() {
  return (
    <AppShell activePath="/claims">
      <PageHeader title="처리 이슈" description="클레임 접수, 증빙 첨부, 처리 결과와 재발방지를 관리합니다." />

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        {["상태 필터", "유형 필터", "파트 필터", "검색"].map((label) => (
          <label key={label} className="text-sm font-semibold text-slate-700">
            {label}
            <div className="mt-2 flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3">
              {label === "검색" && <Search className="size-4 text-slate-400" />}
              <input className="w-full bg-transparent text-sm outline-none" />
            </div>
          </label>
        ))}
      </div>

      <section className="mb-6 overflow-hidden rounded-md border border-slate-200 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {["거래처", "상품", "유형", "상태", "첨부", "처리 일정"].map((column) => (
                <th key={column} className="border-b border-slate-200 px-4 py-3 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {claimRows.map((row) => (
              <tr key={`${row.customer}:${row.issue}`} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-950">{row.customer}</td>
                <td className="px-4 py-3 text-slate-600">{row.product}</td>
                <td className="px-4 py-3 text-slate-600">{row.issue}</td>
                <td className="px-4 py-3 text-slate-600">{row.status}</td>
                <td className="px-4 py-3 text-slate-600">{row.media}</td>
                <td className="px-4 py-3 text-slate-600">{row.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <form className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
          {claimFields.map((field) => (
            <label key={field.id} htmlFor={field.id} className="text-[15px] font-semibold text-slate-800">
              {field.label}
              <input
                id={field.id}
                name={field.id}
                type={field.type ?? "text"}
                className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-[15px]"
              />
            </label>
          ))}

          {selectFields.map((field) => (
            <label key={field.id} htmlFor={field.id} className="text-[15px] font-semibold text-slate-800">
              {field.label}
              <select id={field.id} name={field.id} className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-[15px]">
                {field.values.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          ))}

          <label htmlFor="issueSummary" className="text-[15px] font-semibold text-slate-800 sm:col-span-2 lg:col-span-3">
            접수 내용
            <textarea id="issueSummary" name="issueSummary" className="mt-2 min-h-24 w-full rounded-md border border-slate-300 p-3 text-[15px]" />
          </label>
          <label htmlFor="actionSummary" className="text-[15px] font-semibold text-slate-800 sm:col-span-2 lg:col-span-3">
            처리 요약
            <textarea id="actionSummary" name="actionSummary" className="mt-2 min-h-20 w-full rounded-md border border-slate-300 p-3 text-[15px]" />
          </label>
          <label htmlFor="finalResolution" className="text-[15px] font-semibold text-slate-800 sm:col-span-2">
            최종 해결방안
            <textarea id="finalResolution" name="finalResolution" className="mt-2 min-h-24 w-full rounded-md border border-slate-300 p-3 text-[15px]" />
          </label>
          <label htmlFor="preventionNote" className="text-[15px] font-semibold text-slate-800 sm:col-span-2 lg:col-span-1">
            재발방지
            <textarea id="preventionNote" name="preventionNote" className="mt-2 min-h-24 w-full rounded-md border border-slate-300 p-3 text-[15px]" />
          </label>
          <label htmlFor="claimMedia" className="text-[15px] font-semibold text-slate-800 sm:col-span-2 lg:col-span-3">
            사진/동영상/파일 첨부
            <input
              id="claimMedia"
              name="claimMedia"
              type="file"
              accept="image/*,video/*,application/pdf,application/octet-stream"
              multiple
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-[15px]"
            />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
            <Button type="button" className="h-10">
              <Save aria-hidden="true" />
              저장
            </Button>
            <Button type="button" variant="outline" className="h-10">
              <CheckCircle2 aria-hidden="true" />
              처리완료
            </Button>
          </div>
        </form>

        <aside className="space-y-4">
          <section className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ShieldCheck className="size-4" />
              private storage
            </div>
            <dl className="mt-3 space-y-2 text-sm text-slate-600">
              <div className="flex justify-between gap-3">
                <dt>bucket</dt>
                <dd className="font-medium text-slate-950">{mediaBucketName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>metadata</dt>
                <dd className="font-medium text-slate-950">storage_path</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Paperclip className="size-4" />
              claimResolutionHistory
            </div>
            <div className="mt-3 space-y-2">
              {claimResolutionHistory.map((item) => (
                <div key={`${item.status}:${item.date}`} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
                  <div className="font-medium text-slate-950">{item.status}</div>
                  <div className="text-slate-600">{item.summary}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-800">productSolutionGuides</div>
            <div className="mt-3 space-y-2">
              {productSolutionGuides.map((guide) => (
                <label key={guide.id} htmlFor={guide.id} className="flex gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                  <input id={guide.id} name="guide" type="radio" className="mt-1" />
                  <span>
                    <span className="block font-medium text-slate-950">{guide.title}</span>
                    <span className="text-slate-600">{guide.meta}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </AppShell>
  );
}
