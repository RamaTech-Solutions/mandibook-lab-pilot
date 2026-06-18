"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  PlusCircle,
  MoreHorizontal,
  Wheat,
  Receipt,
  Settings,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/entry", label: "Kisan Entry", icon: PlusCircle },
  { href: "/kisan", label: "Kisan", icon: Users },
  { href: "/vyapari", label: "Vyapari", icon: Store },
];

const moreNav = [
  { href: "/maal", label: "Maal", icon: Wheat },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/payments", label: "Payment", icon: Receipt },
  { href: "/reports/daily-closing", label: "Aaj ka Closing", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const isMoreActive = moreNav.some((n) => pathname.startsWith(n.href));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card safe-bottom md:hidden">
      <div className="flex items-stretch justify-around">
        {mainNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium min-h-touch",
                active ? "text-mandi-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
        <details className="relative flex flex-1 flex-col">
          <summary
            className={cn(
              "flex list-none flex-col items-center gap-1 py-2 text-xs font-medium cursor-pointer min-h-touch",
              isMoreActive ? "text-mandi-primary" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            Aur
          </summary>
          <div className="absolute bottom-full right-0 mb-2 w-48 rounded-lg border border-border bg-card shadow-lg">
            {moreNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-mandi-light"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const allNav = [...mainNav, ...moreNav];

  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-border md:bg-card md:min-h-screen">
      <div className="p-4">
        <p className="text-lg font-bold text-mandi-primary">MandiBook Lab</p>
        <p className="text-xs text-muted-foreground">Ramatech Innovation</p>
      </div>
      <nav className="flex flex-col gap-1 px-2">
        {allNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-mandi-surface text-mandi-dark"
                  : "text-muted-foreground hover:bg-mandi-light hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AppHeader({ title, firmName }: { title: string; firmName?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
      <h1 className="text-lg font-semibold">{title}</h1>
      {firmName && <p className="text-xs text-muted-foreground">{firmName}</p>}
    </header>
  );
}
