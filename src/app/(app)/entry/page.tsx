import { getParties } from "@/actions/parties";
import { getCommodities } from "@/actions/commodities";
import { requireFirm } from "@/lib/auth";
import { KisanEntryForm } from "@/components/forms/kisan-entry-form";

export default async function EntryPage() {
  const { firm } = await requireFirm();
  const [kisans, vyaparis, commodities] = await Promise.all([
    getParties("KISAN"),
    getParties("VYAPARI"),
    getCommodities(true),
  ]);

  return (
    <KisanEntryForm
      kisans={kisans.map((k) => ({ id: k.id, name: k.name, village: k.village }))}
      vyaparis={vyaparis.map((v) => ({ id: v.id, name: v.name }))}
      commodities={commodities.map((c) => ({ id: c.id, name: c.name, unit: c.unit }))}
      defaultCommissionRate={Number(firm.defaultCommissionRate)}
    />
  );
}
