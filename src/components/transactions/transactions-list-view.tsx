"use client";

import Link from "next/link";
import { AppHeader } from "@/components/layout/app-shell";
import { useLanguage } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatDueStatusLine, formatINR, formatTransactionSummary, isPerKgRateTransaction } from "@/lib/format";
import { buildTransactionReceipt, buildWhatsAppUrl } from "@/lib/whatsapp";
import { Plus } from "lucide-react";

type Transaction = {
  id: string;
  weight: { toString(): string };
  rate: { toString(): string };
  grossAmount: { toString(): string };
  commissionAmount: { toString(): string };
  deductions: { toString(): string };
  farmerPayable: { toString(): string };
  traderReceivable: { toString(): string };
  transactionDate: Date;
  notes: string | null;
  farmer: { name: string };
  trader: { name: string };
  commodity: { name: string; unit: string };
};

export function TransactionsListView({
  transactions,
  firm,
}: {
  transactions: Transaction[];
  firm: { name: string; mandiName: string };
}) {
  const { t } = useLanguage();

  return (
    <>
      <AppHeader title={t("transactions.title")} />
      <main className="space-y-4 p-4">
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/transactions/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("transactions.new")}
            </Link>
          </Button>
        </div>

        {transactions.length === 0 ? (
          <EmptyState
            title={t("transactions.emptyTitle")}
            description={t("transactions.emptyDesc")}
            actionLabel={t("transactions.new")}
            actionHref="/transactions/new"
          />
        ) : (
          <ul className="space-y-2">
            {transactions.map((txn) => {
              const perKg = isPerKgRateTransaction(txn.notes);
              const displayUnit = perKg ? "QUINTAL" : txn.commodity.unit;

              const receipt = buildTransactionReceipt({
                farmerName: txn.farmer.name,
                traderName: txn.trader.name,
                commodity: txn.commodity.name,
                unit: txn.commodity.unit,
                weight: txn.weight.toString(),
                rate: txn.rate.toString(),
                grossAmount: txn.grossAmount.toString(),
                commissionAmount: txn.commissionAmount.toString(),
                deductions: txn.deductions.toString(),
                farmerPayable: txn.farmerPayable.toString(),
                traderReceivable: txn.traderReceivable.toString(),
                date: txn.transactionDate,
                firm,
                ratePerKg: perKg,
              });
              const waUrl = buildWhatsAppUrl(null, receipt);
              const dueStatus = formatDueStatusLine(txn.notes);

              return (
                <li key={txn.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {formatTransactionSummary({
                          commodity: txn.commodity.name,
                          weight: txn.weight.toString(),
                          unit: displayUnit,
                          rate: txn.rate.toString(),
                          notes: txn.notes,
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
                        {formatDate(txn.transactionDate)} · {txn.farmer.name} → {txn.trader.name}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-mandi-dark">
                        {formatINR(txn.grossAmount.toString())}
                      </p>
                    </div>
                    <Button asChild variant="secondary" size="sm">
                      <a href={waUrl} target="_blank" rel="noopener noreferrer">
                        {t("common.share")}
                      </a>
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
