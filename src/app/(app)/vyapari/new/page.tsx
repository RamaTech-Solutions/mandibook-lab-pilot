import { getParties } from "@/actions/parties";
import { getCommoditiesWithStock } from "@/actions/commodities";
import { requireFirm } from "@/lib/auth";
import { VyapariEntryForm } from "@/components/forms/vyapari-entry-form";

export default async function NewVyapariPage() {
  const { firm } = await requireFirm();
  const [traders, commodities] = await Promise.all([
    getParties("VYAPARI"),
    getCommoditiesWithStock(true),
  ]);

  return (
    <VyapariEntryForm
      traders={traders.map((v) => ({
        id: v.id,
        name: v.name,
        phone: v.phone,
        address: v.address,
      }))}
      commodities={commodities.map((c) => ({
        id: c.id,
        name: c.name,
        unit: c.unit,
        totalWeight: c.totalWeight,
      }))}
      defaultCommissionRate={Number(firm.defaultCommissionRate)}
    />
  );
}
