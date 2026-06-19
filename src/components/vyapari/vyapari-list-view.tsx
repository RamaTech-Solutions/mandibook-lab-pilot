"use client";

import Link from "next/link";
import { AppHeader } from "@/components/layout/app-shell";
import { useLanguage } from "@/components/i18n/language-provider";
import { BalanceBadge } from "@/components/ledger/balance-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus } from "lucide-react";

type Party = {
  id: string;
  name: string;
  village: string | null;
  balance: string | number;
};

export function VyapariListView({ parties }: { parties: Party[] }) {
  const { t } = useLanguage();

  return (
    <>
      <AppHeader title={t("vyapari.title")} />
      <main className="space-y-4 p-4">
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/vyapari/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("vyapari.new")}
            </Link>
          </Button>
        </div>

        {parties.length === 0 ? (
          <EmptyState
            title={t("vyapari.emptyTitle")}
            description={t("vyapari.emptyDesc")}
            actionLabel={t("vyapari.emptyAction")}
            actionHref="/vyapari/new"
          />
        ) : (
          <ul className="space-y-2">
            {parties.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/vyapari/${p.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-mandi-light/50"
                >
                  <div>
                    <p className="font-medium">{p.name}</p>
                    {p.village && <p className="text-xs text-muted-foreground">{p.village}</p>}
                  </div>
                  <BalanceBadge partyType="VYAPARI" balance={p.balance} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
