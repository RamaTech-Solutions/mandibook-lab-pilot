import Link from "next/link";
import { requireFirm } from "@/lib/auth";
import { getDashboardStats } from "@/actions/reports";
import { AppHeader } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { PlusCircle, Receipt, BarChart3 } from "lucide-react";

export default async function DashboardPage() {
  const { firm } = await requireFirm();
  const stats = await getDashboardStats();

  const cards = [
    { label: "Aaj ki Transactions", value: stats.todayTransactionCount.toString() },
    { label: "Aaj ki Gross Sale", value: formatINR(stats.todayGross) },
    { label: "Aaj ki Commission", value: formatINR(stats.todayCommission) },
    { label: "Total Kisan Baki", value: formatINR(stats.totalKisanBaki) },
    { label: "Total Vyapari Baki", value: formatINR(stats.totalVyapariBaki) },
  ];

  return (
    <>
      <AppHeader title="Dashboard" firmName={`${firm.name} — ${firm.mandiName}`} />
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
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            <Button asChild size="lg" className="h-14">
              <Link href="/entry">
                <PlusCircle className="mr-2 h-5 w-5" />
                Kisan Entry
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="h-14">
              <Link href="/payments">
                <Receipt className="mr-2 h-5 w-5" />
                Payment
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14">
              <Link href="/reports/daily-closing">
                <BarChart3 className="mr-2 h-5 w-5" />
                Aaj ka Closing
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
