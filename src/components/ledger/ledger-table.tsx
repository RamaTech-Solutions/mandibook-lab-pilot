import { formatINR, formatDate } from "@/lib/format";
import { runningBalances } from "@/lib/ledger";
import type { BalanceType, Direction, PartyType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Entry = {
  id: string;
  entryDate: Date;
  entryType: string;
  direction: Direction;
  amount: string;
  description: string | null;
};

export function LedgerTable({
  partyType,
  entries,
  openingBalance,
  balanceType,
}: {
  partyType: PartyType;
  entries: Entry[];
  openingBalance: string;
  balanceType: BalanceType;
}) {
  const withRunning = runningBalances(
    partyType,
    entries.map((e) => ({ ...e, amount: e.amount })),
    openingBalance,
    balanceType
  );

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Abhi koi ledger entry nahi hai
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Hisaab</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-mandi-light/50 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Detail</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {withRunning.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(e.entryDate)}</td>
                  <td className="px-4 py-3">{e.description ?? e.entryType ?? "Entry"}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {e.direction === "CREDIT" ? "+" : "-"}
                    {formatINR(e.amount.toString())}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-mandi-dark">
                    {formatINR(e.runningBalance.toString())}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
