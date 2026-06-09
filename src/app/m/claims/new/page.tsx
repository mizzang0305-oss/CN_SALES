import { Camera, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MobileClaimNewPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-950">
      <header className="mb-5">
        <h1 className="text-xl font-semibold tracking-normal">처리 이슈 등록</h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">사진, 동영상, 파일 증빙과 처리 결과를 함께 남깁니다.</p>
      </header>

      <form className="space-y-4">
        {[
          { id: "customerId", label: "거래처" },
          { id: "productId", label: "상품" },
          { id: "issueType", label: "유형" },
        ].map((field) => (
          <label key={field.id} htmlFor={field.id} className="block text-[15px] font-semibold">
            {field.label}
            <input id={field.id} name={field.id} className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-[15px]" />
          </label>
        ))}

        <label htmlFor="status" className="block text-[15px] font-semibold">
          상태
          <select id="status" name="status" className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-[15px]">
            {["접수", "진행", "처리완료", "보류", "재확인필요"].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>

        <label htmlFor="issueSummary" className="block text-[15px] font-semibold">
          내용
          <textarea id="issueSummary" name="issueSummary" className="mt-2 min-h-28 w-full rounded-md border border-slate-300 bg-white p-3 text-[15px]" />
        </label>

        <label htmlFor="claimMedia" className="block text-[15px] font-semibold">
          사진/동영상/파일
          <span className="mt-2 flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-600">
            <span className="flex gap-2">
              <Camera className="size-5" />
              <Upload className="size-5" />
            </span>
            갤러리, 카메라, 파일 선택
          </span>
          <input
            id="claimMedia"
            name="claimMedia"
            type="file"
            accept="image/*,video/*,application/pdf,application/octet-stream"
            multiple
            className="sr-only"
          />
        </label>

        <label htmlFor="finalResolution" className="block text-[15px] font-semibold">
          최종 해결방안
          <textarea id="finalResolution" name="finalResolution" className="mt-2 min-h-24 w-full rounded-md border border-slate-300 bg-white p-3 text-[15px]" />
        </label>

        <label htmlFor="preventionNote" className="block text-[15px] font-semibold">
          재발방지
          <textarea id="preventionNote" name="preventionNote" className="mt-2 min-h-20 w-full rounded-md border border-slate-300 bg-white p-3 text-[15px]" />
        </label>

        <Button type="button" className="h-11 w-full">
          <Save aria-hidden="true" />
          저장
        </Button>
      </form>
    </main>
  );
}
