import { notFound } from "next/navigation";
import { getParty } from "@/actions/parties";
import { requireFirm } from "@/lib/auth";
import { PartyDetailView } from "@/components/party/party-detail-view";
import { buildKisanStatement, buildWhatsAppUrl } from "@/lib/whatsapp";

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

  return (
    <PartyDetailView
      partyType="KISAN"
      name={party.name}
      subtitle={party.village ?? undefined}
      balance={party.balance}
      openingBalance={party.openingBalance.toString()}
      balanceType={party.balanceType}
      entries={party.ledgerEntries.map((e) => ({
        ...e,
        amount: e.amount.toString(),
      }))}
      waUrl={buildWhatsAppUrl(party.phone, waText)}
    />
  );
}
