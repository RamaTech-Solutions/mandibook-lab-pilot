import Link from "next/link";
import { getTransactions } from "@/actions/transactions";
import { requireFirm } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatINR, formatDate, formatDueStatusLine, formatTransactionSummary, isPerKgRateTransaction } from "@/lib/format";
import { buildTransactionReceipt, buildWhatsAppUrl } from "@/lib/whatsapp";
import { Plus } from "lucide-react";

export default async function TransactionsPage() {
  const { firm } = await requireFirm();
  const transactions = await getTransactions();

  return (
    <>
      <AppHeader title="Transactions" />
      <main className="space-y-4 p-4">
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/transactions/new">
              <Plus className="mr-2 h-4 w-4" />
              Nayi Sale
            </Link>
          </Button>
        </div>

        {transactions.length === 0 ? (
          <EmptyState
            title="Koi transaction nahi"
            description="Pehli sale record karein"
            actionLabel="Nayi Sale"
            actionHref="/transactions/new"
          />
        ) : (
          <ul className="space-y-2">
            {transactions.map((t) => {
              const perKg = isPerKgRateTransaction(t.notes);
              const displayUnit = perKg ? "QUINTAL" : t.commodity.unit;

              const receipt = buildTransactionReceipt({
                farmerName: t.farmer.name,
                traderName: t.trader.name,
                commodity: t.commodity.name,
                unit: t.commodity.unit,
                weight: t.weight.toString(),
                rate: t.rate.toString(),
                grossAmount: t.grossAmount.toString(),
                commissionAmount: t.commissionAmount.toString(),
                deductions: t.deductions.toString(),
                farmerPayable: t.farmerPayable.toString(),
                traderReceivable: t.traderReceivable.toString(),
                date: t.transactionDate,
                firm: { name: firm.name, mandiName: firm.mandiName },
                ratePerKg: perKg,
              });
              const waUrl = buildWhatsAppUrl(null, receipt);

              const dueStatus = formatDueStatusLine(t.notes);

              return (
                <li key={t.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {formatTransactionSummary({
                          commodity: t.commodity.name,
                          weight: t.weight.toString(),
                          unit: displayUnit,
                          rate: t.rate.toString(),
                          notes: t.notes,
                        })}
                      </p>
                      {dueStatus && (
                        <p
                          className={`text-xs font-medium ${
                            dueStatus.variant === "paid" ? "text-green-700" : "text-amber-700"
                          }`}
                        >
                          {dueStatus.text}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(t.transactionDate)} · {t.farmer.name} → {t.trader.name}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-mandi-dark">{formatINR(t.grossAmount.toString())}</p>
                    </div>
                    <Button asChild variant="secondary" size="sm">
                      <a href={waUrl} target="_blank" rel="noopener noreferrer">Share</a>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
