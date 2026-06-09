import { AppShell, PageHeader } from "@/components/app/app-shell";

export default function SettingsPage() {
  return <AppShell activePath="/settings"><PageHeader title="설정" description="회사, 파트, 업로드 규칙 설정을 관리합니다." /></AppShell>;
}
