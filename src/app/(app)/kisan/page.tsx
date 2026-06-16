import Link from "next/link";
import { getParties } from "@/actions/parties";
import { AppHeader } from "@/components/layout/app-shell";
import { BalanceBadge } from "@/components/ledger/balance-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus } from "lucide-react";

export default async function KisanListPage() {
  const parties = await getParties("KISAN");

  return (
    <>
      <AppHeader title="Kisan" />
      <main className="space-y-4 p-4">
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/kisan/new">
              <Plus className="mr-2 h-4 w-4" />
              Naya Kisan
            </Link>
          </Button>
        </div>

        {parties.length === 0 ? (
          <EmptyState
            title="Koi Kisan nahi"
            description="Pehla kisan jod kar shuru karein"
            actionLabel="Pehla Kisan jodein"
            actionHref="/kisan/new"
          />
        ) : (
          <ul className="space-y-2">
            {parties.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/kisan/${p.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-mandi-light/50"
                >
                  <div>
                    <p className="font-medium">{p.name}</p>
                    {p.village && <p className="text-xs text-muted-foreground">{p.village}</p>}
                  </div>
                  <BalanceBadge partyType="KISAN" balance={p.balance} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
