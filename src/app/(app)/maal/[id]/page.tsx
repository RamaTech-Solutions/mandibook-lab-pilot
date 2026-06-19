import { notFound } from "next/navigation";
import { getCommodityTransactions } from "@/actions/commodities";
import { MaalDetailView } from "@/components/maal/maal-detail-view";

export default async function MaalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { id } = await params;
  const { from, to } = await searchParams;
  const data = await getCommodityTransactions(id, from, to);

  if (!data) notFound();

  const hasDateFilter = Boolean(from || to);
  const backParams = new URLSearchParams();
  if (from) backParams.set("from", from);
  if (to) backParams.set("to", to);
  const backQs = backParams.toString();
  const backHref = backQs ? `/maal?${backQs}` : "/maal";

  return (
    <MaalDetailView
      commodityName={data.commodity.name}
      totalWeight={data.commodity.totalWeight}
      hasDateFilter={hasDateFilter}
      backHref={backHref}
      transactions={data.transactions}
    />
  );
}
