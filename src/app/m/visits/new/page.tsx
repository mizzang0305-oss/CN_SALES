import { VisitForm } from "@/components/mobile/forms";

export default function MobileVisitNewPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <h1 className="mb-4 text-2xl font-semibold">방문일지 작성</h1>
      <VisitForm />
    </main>
  );
}
