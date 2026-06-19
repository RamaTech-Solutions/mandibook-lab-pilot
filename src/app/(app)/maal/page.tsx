import { getCommoditiesWithStock } from "@/actions/commodities";
import { MaalPageClient } from "@/components/forms/maal-page-client";

export default async function MaalPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const commodities = await getCommoditiesWithStock(false, from, to);
  return (
    <MaalPageClient
      initialDateFrom={from ?? ""}
      initialDateTo={to ?? ""}
      commodities={commodities.map((c) => ({
        id: c.id,
        name: c.name,
        unit: c.unit,
        isActive: c.isActive,
        totalWeight: c.totalWeight,
      }))}
    />
  );
}
