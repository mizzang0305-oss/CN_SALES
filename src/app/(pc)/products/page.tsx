import { AppShell, PageHeader } from "@/components/app/app-shell";

export default function ProductsPage() {
  return <AppShell activePath="/products"><PageHeader title="상품/단가" description="item_detail 기준 상품 사용 상태와 단가 변동을 관리합니다." /></AppShell>;
}
