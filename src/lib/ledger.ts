import Decimal from "decimal.js";
import type { BalanceType, Direction, PartyType } from "@prisma/client";

export type LedgerEntryLike = {
  direction: Direction;
  amount: Decimal | number | string;
};

export function signedOpeningBalance(
  openingBalance: Decimal | number | string,
  balanceType: BalanceType
): Decimal {
  const amount = new Decimal(openingBalance);
  if (balanceType === "RECEIVABLE") return amount;
  if (balanceType === "PAYABLE") return amount.negated();
  return new Decimal(0);
}

export function calculatePartyBalance(
  partyType: PartyType,
  entries: LedgerEntryLike[],
  openingBalance: Decimal | number | string,
  balanceType: BalanceType
): Decimal {
  let credits = new Decimal(0);
  let debits = new Decimal(0);

  for (const entry of entries) {
    const amt = new Decimal(entry.amount);
    if (entry.direction === "CREDIT") credits = credits.plus(amt);
    else debits = debits.plus(amt);
  }

  const opening = signedOpeningBalance(openingBalance, balanceType);

  if (partyType === "KISAN") {
    // Positive = firm owes farmer (Baki to pay)
    return credits.minus(debits).plus(opening);
  }

  // VYAPARI: Positive = trader owes firm (Baki to receive)
  return debits.minus(credits).plus(opening);
}

export function balanceLabel(partyType: PartyType, balance: Decimal): string {
  if (balance.isZero()) return "Clear";
  if (partyType === "KISAN") {
    return balance.gt(0) ? "Baki (Dena hai)" : "Jama (Advance)";
  }
  return balance.gt(0) ? "Baki (Lena hai)" : "Jama (Advance)";
}

export function runningBalances(
  partyType: PartyType,
  entries: Array<LedgerEntryLike & { id: string; entryDate: Date; description?: string | null }>,
  openingBalance: Decimal | number | string,
  balanceType: BalanceType
): Array<(typeof entries)[0] & { runningBalance: Decimal }> {
  const opening = signedOpeningBalance(openingBalance, balanceType);
  let running =
    partyType === "KISAN"
      ? opening
      : opening;

  return entries.map((entry) => {
    const amt = new Decimal(entry.amount);
    if (partyType === "KISAN") {
      running =
        entry.direction === "CREDIT" ? running.plus(amt) : running.minus(amt);
    } else {
      running =
        entry.direction === "DEBIT" ? running.plus(amt) : running.minus(amt);
    }
    return { ...entry, runningBalance: running };
  });
}
