import { getCommodities } from "@/actions/commodities";
import { MaalPageClient } from "@/components/forms/maal-page-client";

export default async function MaalPage() {
  const commodities = await getCommodities();
  return (
    <MaalPageClient
      commodities={commodities.map((c) => ({
        id: c.id,
        name: c.name,
        unit: c.unit,
        isActive: c.isActive,
      }))}
    />
  );
}
