"use client";

import Link from "next/link";
import { AppHeader } from "@/components/layout/app-shell";
import { useLanguage } from "@/components/i18n/language-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatQuintal } from "@/lib/format";

type Props = {
  commodityName: string;
  totalWeight: number;
  hasDateFilter: boolean;
  backHref: string;
  transactions: Array<{
    id: string;
    weight: number;
    signedWeight: number;
    direction: "CREDIT" | "DEBIT";
    partyName: string;
    transactionDate: Date;
  }>;
};

export function MaalDetailView({
  commodityName,
  totalWeight,
  hasDateFilter,
  backHref,
  transactions,
}: Props) {
  const { t } = useLanguage();
  const weightLabel = hasDateFilter ? t("common.period") : t("common.total");

  return (
    <>
      <AppHeader
        title={commodityName}
        firmName={`${weightLabel}: ${formatQuintal(totalWeight)} ${t("common.quintal")}`}
      />
      <main className="space-y-4 p-4">
        <Link
          href={backHref}
          className="inline-block text-sm font-medium text-mandi-primary hover:underline"
        >
          ← {t("maal.back")}
        </Link>

        {transactions.length === 0 ? (
          <EmptyState
            title={hasDateFilter ? t("maal.noEntryFiltered") : t("maal.noEntryTitle")}
            description={t("maal.noEntryDesc")}
          />
        ) : (
          <ul className="space-y-2">
            {transactions.map((txn) => {
              const isDebit = txn.direction === "DEBIT";
              const sign = isDebit ? "−" : "+";
              const absWeight = formatQuintal(Math.abs(txn.signedWeight));

              return (
                <li
                  key={txn.id}
                  className={`rounded-xl border bg-card p-4 ${
                    isDebit ? "border-amber-200 bg-amber-50/40" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{txn.partyName}</p>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        isDebit ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
                      }`}
                    >
                      {isDebit ? t("maal.stockOut") : t("maal.stockIn")}
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-xs ${
                      isDebit ? "font-medium text-amber-800" : "text-muted-foreground"
                    }`}
                  >
                    {sign}
                    {absWeight} {t("common.quintal")}
                    {isDebit ? ` · ${t("maal.debit")}` : ""} · {formatDate(txn.transactionDate)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
