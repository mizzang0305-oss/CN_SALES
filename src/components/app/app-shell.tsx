import Link from "next/link";
import { BarChart3, ClipboardList, FileSpreadsheet, Handshake, Home, Package, Settings, Smartphone, Upload, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const pcNav = [
  { href: "/dashboard", label: "대시보드", icon: Home },
  { href: "/uploads", label: "업로드센터", icon: Upload },
  { href: "/sales", label: "매출", icon: BarChart3 },
  { href: "/receipts", label: "회입", icon: FileSpreadsheet },
  { href: "/ar", label: "미수관리", icon: Handshake },
  { href: "/customers", label: "거래처", icon: Users },
  { href: "/products", label: "상품/단가", icon: Package },
  { href: "/claims", label: "처리 이슈", icon: ClipboardList },
  { href: "/visits", label: "방문일지", icon: Smartphone },
  { href: "/tasks", label: "약속관리", icon: ClipboardList },
  { href: "/settings", label: "설정", icon: Settings },
];

export function AppShell({ children, activePath = "/dashboard" }: { children: React.ReactNode; activePath?: string }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-200 bg-white px-4 py-5 lg:block">
        <Link href="/dashboard" className="block border-b border-slate-200 pb-4">
          <div className="text-xl font-semibold">cn-sales</div>
          <div className="mt-1 text-sm text-slate-500">영업 관리센터</div>
        </Link>
        <nav className="mt-5 space-y-1">
          {pcNav.map((item) => {
            const Icon = item.icon;
            const active = activePath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-[15px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                  active && "bg-slate-900 text-white hover:bg-slate-900 hover:text-white",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <header className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">{title}</h1>
        <p className="mt-1 text-[15px] leading-6 text-slate-600">{description}</p>
      </div>
      {action}
    </header>
  );
}
