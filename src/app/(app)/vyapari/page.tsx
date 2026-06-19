import { getParties } from "@/actions/parties";
import { VyapariListView } from "@/components/vyapari/vyapari-list-view";

export default async function VyapariListPage() {
  const parties = await getParties("VYAPARI");

  return (
    <VyapariListView
      parties={parties.map((p) => ({
        id: p.id,
        name: p.name,
        village: p.village,
        balance: p.balance,
      }))}
    />
  );
}
