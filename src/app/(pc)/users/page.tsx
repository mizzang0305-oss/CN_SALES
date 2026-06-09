import { AppShell, PageHeader } from "@/components/app/app-shell";

export default function UsersPage() {
  return <AppShell activePath="/users"><PageHeader title="사용자" description="권한과 담당 파트 연결을 관리합니다." /></AppShell>;
}
