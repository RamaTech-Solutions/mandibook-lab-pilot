"use client";

import Link from "next/link";
import { AppHeader } from "@/components/layout/app-shell";
import { useLanguage } from "@/components/i18n/language-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { PlusCircle, Receipt, BarChart3 } from "lucide-react";

type Stats = {
  todayTransactionCount: number;
  todayGross: string | number;
  todayCommission: string | number;
  totalKisanBaki: string | number;
  totalVyapariBaki: string | number;
};

export function DashboardView({
  firmName,
  mandiName,
  stats,
}: {
  firmName: string;
  mandiName: string;
  stats: Stats;
}) {
  const { t } = useLanguage();

  const cards = [
    { label: t("dashboard.todayTxns"), value: stats.todayTransactionCount.toString() },
    { label: t("dashboard.todayGross"), value: formatINR(stats.todayGross) },
    { label: t("dashboard.todayCommission"), value: formatINR(stats.todayCommission) },
    { label: t("dashboard.kisanDue"), value: formatINR(stats.totalKisanBaki) },
    { label: t("dashboard.vyapariDue"), value: formatINR(stats.totalVyapariBaki) },
  ];

  return (
    <>
      <AppHeader title={t("nav.dashboard")} firmName={`${firmName} — ${mandiName}`} />
      <main className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Card key={c.label}>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-mandi-dark">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            <Button asChild size="lg" className="h-14">
              <Link href="/entry">
                <PlusCircle className="mr-2 h-5 w-5" />
                {t("nav.kisanEntry")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="h-14">
              <Link href="/payments">
                <Receipt className="mr-2 h-5 w-5" />
                {t("nav.payment")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14">
              <Link href="/reports/daily-closing">
                <BarChart3 className="mr-2 h-5 w-5" />
                {t("nav.closing")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
