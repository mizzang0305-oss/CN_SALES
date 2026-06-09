import { AppShell, PageHeader } from "@/components/app/app-shell";
import { UploadCenter } from "@/components/uploads/upload-center";

export default function UploadsPage() {
  return (
    <AppShell activePath="/uploads">
      <PageHeader title="업로드센터" description="원장 엑셀을 preview 후 confirm 단계에서 DB에 반영합니다." />
      <UploadCenter />
    </AppShell>
  );
}
