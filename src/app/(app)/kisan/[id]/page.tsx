import { notFound } from "next/navigation";
import { getParty } from "@/actions/parties";
import { requireFirm } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-shell";
import { BalanceBadge } from "@/components/ledger/balance-badge";
import { LedgerTable } from "@/components/ledger/ledger-table";
import { buildKisanStatement, buildWhatsAppUrl } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function KisanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { firm } = await requireFirm();
  const party = await getParty(id);

  if (!party || party.type !== "KISAN") notFound();

  const waText = buildKisanStatement({
    name: party.name,
    entries: party.ledgerEntries.map((e) => ({
      entryDate: e.entryDate,
      description: e.description,
      direction: e.direction,
      amount: e.amount,
    })),
    balance: party.balance,
    firm: { name: firm.name, mandiName: firm.mandiName },
  });

  const waUrl = buildWhatsAppUrl(party.phone, waText);

  return (
    <>
      <AppHeader title={party.name} firmName={party.village ?? undefined} />
      <main className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <BalanceBadge partyType="KISAN" balance={party.balance} />
          <div className="flex gap-2">
            <Button asChild variant="secondary" size="sm">
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                WhatsApp Share
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/payments">Payment</Link>
            </Button>
          </div>
        </div>
        <LedgerTable
          partyType="KISAN"
          entries={party.ledgerEntries}
          openingBalance={party.openingBalance}
          balanceType={party.balanceType}
        />
      </main>
    </>
  );
}
