import { getParties } from "@/actions/parties";
import { KisanListView } from "@/components/kisan/kisan-list-view";

export default async function KisanListPage() {
  const parties = await getParties("KISAN");

  return (
    <KisanListView
      parties={parties.map((p) => ({
        id: p.id,
        name: p.name,
        village: p.village,
        balance: p.balance,
      }))}
    />
  );
}
