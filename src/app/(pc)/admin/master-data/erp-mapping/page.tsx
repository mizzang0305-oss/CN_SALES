import Link from "next/link";
import { Check, Search, X } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/app-shell";

const rows = [
  {
    name: "거래처 후보",
    erpCode: "VENDOR-CODE",
    erpName: "ERP vendor",
    reason: "normalized_name",
    confidence: "0.92",
    status: "pending",
  },
  {
    name: "상품 후보",
    erpCode: "PRODUCT-CODE",
    erpName: "ERP product",
    reason: "barcode",
    confidence: "0.98",
    status: "pending",
  },
];

export default function ErpMappingPage() {
  return (
    <AppShell activePath="/admin/master-data">
      <PageHeader
        title="ERP 매칭"
        description="public ERP 테이블은 read-only reference로 조회하고 cn_sales 매칭 후보만 관리합니다."
        action={
          <Link
            href="/admin/master-data"
            className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            기초코드
          </Link>
        }
      />

      <section className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="min-w-[920px] w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">cn-sales 거래처명 / 상품명</th>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">ERP 후보 코드</th>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">ERP 후보명</th>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">매칭 사유</th>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">신뢰도</th>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">상태</th>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">승인</th>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">거절</th>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">수동 선택</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.name}:${row.erpCode}`} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-950">{row.name}</td>
                <td className="px-4 py-3 text-slate-600">{row.erpCode}</td>
                <td className="px-4 py-3 text-slate-600">{row.erpName}</td>
                <td className="px-4 py-3 text-slate-600">{row.reason}</td>
                <td className="px-4 py-3 text-slate-600">{row.confidence}</td>
                <td className="px-4 py-3 text-slate-600">{row.status}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    title="승인"
                    aria-label="승인"
                    disabled
                    className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-400"
                  >
                    <Check className="size-4" />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    title="거절"
                    aria-label="거절"
                    disabled
                    className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-400"
                  >
                    <X className="size-4" />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    title="수동 선택"
                    aria-label="수동 선택"
                    disabled
                    className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-400"
                  >
                    <Search className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
