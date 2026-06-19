"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  PlusCircle,
  MoreHorizontal,
  Wheat,
  Receipt,
  Settings,
  BarChart3,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useLanguage } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

const mainNav = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/entry", labelKey: "nav.kisanEntry", icon: PlusCircle },
  { href: "/vyapari", labelKey: "nav.vyapari", icon: Store },
];

const moreNav = [
  { href: "/maal", labelKey: "nav.maal", icon: Wheat },
  { href: "/transactions", labelKey: "nav.transactions", icon: Receipt },
  { href: "/payments", labelKey: "nav.payment", icon: Receipt },
  { href: "/reports/daily-closing", labelKey: "nav.closing", icon: BarChart3 },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const isMoreActive = moreNav.some((n) => pathname.startsWith(n.href));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card safe-bottom md:hidden">
      <div className="flex items-stretch justify-around">
        {mainNav.map(({ href, labelKey, icon: Icon }) => {
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
              {t(labelKey)}
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
            {t("nav.more")}
          </summary>
          <div className="absolute bottom-full right-0 mb-2 w-48 rounded-lg border border-border bg-card shadow-lg">
            {moreNav.map(({ href, labelKey, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-mandi-light"
              >
                <Icon className="h-4 w-4" />
                {t(labelKey)}
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
  const { t } = useLanguage();
  const allNav = [...mainNav, ...moreNav];

  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-border md:bg-card md:min-h-screen">
      <div className="p-4">
        <p className="text-lg font-bold text-mandi-primary">MandiBook Lab</p>
        <p className="text-xs text-muted-foreground">Ramatech Innovation</p>
      </div>
      <nav className="flex flex-col gap-1 px-2">
        {allNav.map(({ href, labelKey, icon: Icon }) => {
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
              {t(labelKey)}
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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold">{title}</h1>
          {firmName && <p className="text-xs text-muted-foreground">{firmName}</p>}
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
