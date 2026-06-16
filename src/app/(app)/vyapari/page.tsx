import Link from "next/link";
import { getParties } from "@/actions/parties";
import { AppHeader } from "@/components/layout/app-shell";
import { BalanceBadge } from "@/components/ledger/balance-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus } from "lucide-react";

export default async function VyapariListPage() {
  const parties = await getParties("VYAPARI");

  return (
    <>
      <AppHeader title="Vyapari" />
      <main className="space-y-4 p-4">
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/vyapari/new">
              <Plus className="mr-2 h-4 w-4" />
              Naya Vyapari
            </Link>
          </Button>
        </div>

        {parties.length === 0 ? (
          <EmptyState
            title="Koi Vyapari nahi"
            description="Pehla vyapari jod kar shuru karein"
            actionLabel="Pehla Vyapari jodein"
            actionHref="/vyapari/new"
          />
        ) : (
          <ul className="space-y-2">
            {parties.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/vyapari/${p.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-mandi-light/50"
                >
                  <div>
                    <p className="font-medium">{p.name}</p>
                    {p.phone && <p className="text-xs text-muted-foreground">{p.phone}</p>}
                  </div>
                  <BalanceBadge partyType="VYAPARI" balance={p.balance} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
