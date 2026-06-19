"use client";

import Link from "next/link";
import { AppHeader } from "@/components/layout/app-shell";
import { useLanguage } from "@/components/i18n/language-provider";
import { BalanceBadge } from "@/components/ledger/balance-badge";
import { LedgerTable } from "@/components/ledger/ledger-table";
import { Button } from "@/components/ui/button";
import type { BalanceType, PartyType } from "@prisma/client";

type LedgerEntry = Parameters<typeof LedgerTable>[0]["entries"][number];

export function PartyDetailView({
  partyType,
  name,
  subtitle,
  balance,
  openingBalance,
  balanceType,
  entries,
  waUrl,
}: {
  partyType: PartyType;
  name: string;
  subtitle?: string;
  balance: string | number;
  openingBalance: string;
  balanceType: BalanceType;
  entries: LedgerEntry[];
  waUrl: string;
}) {
  const { t } = useLanguage();

  return (
    <>
      <AppHeader title={name} firmName={subtitle} />
      <main className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <BalanceBadge partyType={partyType} balance={balance} />
          <div className="flex gap-2">
            <Button asChild variant="secondary" size="sm">
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                {t("kisan.whatsappShare")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/payments">{t("kisan.paymentLink")}</Link>
            </Button>
          </div>
        </div>
        <LedgerTable
          partyType={partyType}
          entries={entries}
          openingBalance={openingBalance}
          balanceType={balanceType}
        />
      </main>
    </>
  );
}
