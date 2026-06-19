import { getParties } from "@/actions/parties";
import { getCommoditiesWithStock } from "@/actions/commodities";
import { requireFirm } from "@/lib/auth";
import { KisanEntryForm } from "@/components/forms/kisan-entry-form";

export default async function EntryPage() {
  const { firm } = await requireFirm();
  const [kisans, commodities] = await Promise.all([
    getParties("KISAN"),
    getCommoditiesWithStock(true),
  ]);

  return (
    <KisanEntryForm
      kisans={kisans.map((k) => ({ id: k.id, name: k.name, village: k.village }))}
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
