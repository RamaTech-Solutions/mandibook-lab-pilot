import { formatINR } from "@/lib/format";
import { balanceLabel } from "@/lib/ledger";
import type { PartyType } from "@prisma/client";
import Decimal from "decimal.js";
import { cn } from "@/lib/utils";

export function BalanceBadge({
  partyType,
  balance,
  className,
}: {
  partyType: PartyType;
  balance: string | number;
  className?: string;
}) {
  const bal = new Decimal(balance);
  const label = balanceLabel(partyType, bal);
  const isPositive = bal.gt(0);

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
        isPositive ? "bg-amber-100 text-amber-800" : bal.lt(0) ? "bg-blue-100 text-blue-800" : "bg-mandi-surface text-mandi-dark",
        className
      )}
    >
      {bal.isZero() ? "Clear" : `${formatINR(bal.abs().toString())} — ${label}`}
    </span>
  );
}
