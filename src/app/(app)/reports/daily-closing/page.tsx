import { getDailyClosing } from "@/actions/reports";
import { AppHeader } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate, todayIST } from "@/lib/format";
import { buildDailyClosing, buildWhatsAppUrl } from "@/lib/whatsapp";
import { DailyClosingDatePicker } from "@/components/forms/daily-closing-date-picker";

export default async function DailyClosingPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const report = await getDailyClosing(date);
  const defaultDate = (date ?? todayIST().toISOString().split("T")[0]);

  const waText = buildDailyClosing({
    date: report.date,
    transactionCount: report.transactionCount,
    grossSale: report.grossSale,
    commission: report.commission,
    farmerPayable: report.farmerPayable,
    traderReceivable: report.traderReceivable,
    paymentsPaid: report.paymentsPaid,
    paymentsReceived: report.paymentsReceived,
    totalKisanBaki: report.totalKisanBaki,
    totalVyapariBaki: report.totalVyapariBaki,
    firm: { name: report.firm.name, mandiName: report.firm.mandiName },
  });

  const waUrl = buildWhatsAppUrl(null, waText);

  const rows = [
    { label: "Transactions", value: String(report.transactionCount) },
    { label: "Gross Sale", value: formatINR(report.grossSale) },
    { label: "Commission", value: formatINR(report.commission) },
    { label: "Farmer Payable", value: formatINR(report.farmerPayable) },
    { label: "Trader Receivable", value: formatINR(report.traderReceivable) },
    { label: "Payments Paid", value: formatINR(report.paymentsPaid) },
    { label: "Payments Received", value: formatINR(report.paymentsReceived) },
    { label: "Total Kisan Baki", value: formatINR(report.totalKisanBaki) },
    { label: "Total Vyapari Baki", value: formatINR(report.totalVyapariBaki) },
  ];

  return (
    <>
      <AppHeader title="Aaj ka Closing" firmName={formatDate(report.date)} />
      <main className="space-y-4 p-4">
        <DailyClosingDatePicker defaultDate={defaultDate} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{report.firm.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.map((r) => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-semibold">{r.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button asChild size="lg" className="w-full">
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            WhatsApp par Share Karein
          </a>
        </Button>
      </main>
    </>
  );
}
