import Link from "next/link";
import { AppShell, PageHeader } from "@/components/app/app-shell";

const tabs = [
  "파트",
  "영업사원",
  "거래처",
  "상품",
  "상품군",
  "ERP 거래처 매칭",
  "ERP 상품 매칭",
  "중복/병합 후보",
];

const masterRows = [
  { area: "파트", source: "원장 import", status: "자동 upsert" },
  { area: "거래처", source: "customer_total / item_detail", status: "alias 정규화" },
  { area: "상품", source: "item_detail", status: "alias + 사용 이력" },
  { area: "ERP reference", source: "public ERP select", status: "optional 후보" },
];

export default function MasterDataPage() {
  return (
    <AppShell activePath="/admin/master-data">
      <PageHeader
        title="기초코드 관리"
        description="원장 기준 master-data와 ERP read-only 매칭 후보를 관리합니다."
        action={
          <Link
            href="/admin/master-data/erp-mapping"
            className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            ERP 매칭
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={tab.startsWith("ERP") ? "/admin/master-data/erp-mapping" : "/admin/master-data"}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          >
            {tab}
          </Link>
        ))}
      </div>

      <section className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">영역</th>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">기준 데이터</th>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {masterRows.map((row) => (
              <tr key={row.area} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-950">{row.area}</td>
                <td className="px-4 py-3 text-slate-600">{row.source}</td>
                <td className="px-4 py-3 text-slate-600">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
