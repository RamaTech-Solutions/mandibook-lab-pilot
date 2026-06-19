import { notFound } from "next/navigation";
import { getParty } from "@/actions/parties";
import { requireFirm } from "@/lib/auth";
import { PartyDetailView } from "@/components/party/party-detail-view";
import { buildVyapariStatement, buildWhatsAppUrl } from "@/lib/whatsapp";

export default async function VyapariDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { firm } = await requireFirm();
  const party = await getParty(id);

  if (!party || party.type !== "VYAPARI") notFound();

  const waText = buildVyapariStatement({
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
      partyType="VYAPARI"
      name={party.name}
      subtitle={party.phone ?? undefined}
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
