import { getParties } from "@/actions/parties";
import { getCommodities } from "@/actions/commodities";
import { requireFirm } from "@/lib/auth";
import { TransactionForm } from "@/components/forms/transaction-form";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

export default async function NewTransactionPage() {
  const { firm } = await requireFirm();
  const [kisans, vyaparis, commodities] = await Promise.all([
    getParties("KISAN"),
    getParties("VYAPARI"),
    getCommodities(true),
  ]);

  if (kisans.length === 0 || vyaparis.length === 0 || commodities.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          title="Pehle setup complete karein"
          description="Kisan, Vyapari aur Maal add karein sale record karne se pehle"
          actionLabel="Dashboard"
          actionHref="/dashboard"
        />
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {kisans.length === 0 && <li><Link href="/kisan/new" className="text-mandi-primary underline">+ Kisan add karein</Link></li>}
          {vyaparis.length === 0 && <li><Link href="/vyapari/new" className="text-mandi-primary underline">+ Vyapari add karein</Link></li>}
          {commodities.length === 0 && <li><Link href="/maal" className="text-mandi-primary underline">+ Maal add karein</Link></li>}
        </ul>
      </div>
    );
  }

  return (
    <TransactionForm
      kisans={kisans.map((k) => ({ id: k.id, name: k.name }))}
      vyaparis={vyaparis.map((v) => ({ id: v.id, name: v.name }))}
      commodities={commodities.map((c) => ({ id: c.id, name: c.name, unit: c.unit }))}
      defaultCommissionRate={Number(firm.defaultCommissionRate)}
    />
  );
}
