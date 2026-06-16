"use server";

import { prisma } from "@/lib/db";
import { requireFirm } from "@/lib/auth";
import { calculatePartyBalance } from "@/lib/ledger";
import { todayIST, startOfDayIST, endOfDayIST } from "@/lib/format";
import Decimal from "decimal.js";

export async function getDashboardStats() {
  const { firmId } = await requireFirm();

  const today = todayIST();
  const dayStart = startOfDayIST(today);
  const dayEnd = endOfDayIST(today);

  const [todayTxns, kisans, vyaparis] = await Promise.all([
    prisma.transaction.findMany({
      where: { firmId, transactionDate: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.party.findMany({
      where: { firmId, type: "KISAN", deletedAt: null },
      include: { ledgerEntries: { select: { direction: true, amount: true } } },
    }),
    prisma.party.findMany({
      where: { firmId, type: "VYAPARI", deletedAt: null },
      include: { ledgerEntries: { select: { direction: true, amount: true } } },
    }),
  ]);

  let todayGross = new Decimal(0);
  let todayCommission = new Decimal(0);

  for (const t of todayTxns) {
    todayGross = todayGross.plus(t.grossAmount.toString());
    todayCommission = todayCommission.plus(t.commissionAmount.toString());
  }

  let totalKisanBaki = new Decimal(0);
  for (const k of kisans) {
    const bal = calculatePartyBalance(k.type, k.ledgerEntries, k.openingBalance, k.balanceType);
    if (bal.gt(0)) totalKisanBaki = totalKisanBaki.plus(bal);
  }

  let totalVyapariBaki = new Decimal(0);
  for (const v of vyaparis) {
    const bal = calculatePartyBalance(v.type, v.ledgerEntries, v.openingBalance, v.balanceType);
    if (bal.gt(0)) totalVyapariBaki = totalVyapariBaki.plus(bal);
  }

  return {
    todayTransactionCount: todayTxns.length,
    todayGross: todayGross.toFixed(2),
    todayCommission: todayCommission.toFixed(2),
    totalKisanBaki: totalKisanBaki.toFixed(2),
    totalVyapariBaki: totalVyapariBaki.toFixed(2),
  };
}

export async function getDailyClosing(dateStr?: string) {
  const { firmId, firm } = await requireFirm();

  const date = dateStr ? new Date(dateStr) : todayIST();
  const dayStart = startOfDayIST(date);
  const dayEnd = endOfDayIST(date);

  const [transactions, payments, kisans, vyaparis] = await Promise.all([
    prisma.transaction.findMany({
      where: { firmId, transactionDate: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.payment.findMany({
      where: { firmId, paymentDate: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.party.findMany({
      where: { firmId, type: "KISAN", deletedAt: null },
      include: { ledgerEntries: { select: { direction: true, amount: true } } },
    }),
    prisma.party.findMany({
      where: { firmId, type: "VYAPARI", deletedAt: null },
      include: { ledgerEntries: { select: { direction: true, amount: true } } },
    }),
  ]);

  const sum = (items: { toString(): string }[]) =>
    items.reduce((acc, i) => acc.plus(i.toString()), new Decimal(0));

  let totalKisanBaki = new Decimal(0);
  for (const k of kisans) {
    const bal = calculatePartyBalance(k.type, k.ledgerEntries, k.openingBalance, k.balanceType);
    if (bal.gt(0)) totalKisanBaki = totalKisanBaki.plus(bal);
  }

  let totalVyapariBaki = new Decimal(0);
  for (const v of vyaparis) {
    const bal = calculatePartyBalance(v.type, v.ledgerEntries, v.openingBalance, v.balanceType);
    if (bal.gt(0)) totalVyapariBaki = totalVyapariBaki.plus(bal);
  }

  const paymentsPaid = payments.filter((p) => p.direction === "PAID");
  const paymentsReceived = payments.filter((p) => p.direction === "RECEIVED");

  return {
    firm,
    date: dayStart,
    transactionCount: transactions.length,
    grossSale: sum(transactions.map((t) => t.grossAmount)).toFixed(2),
    commission: sum(transactions.map((t) => t.commissionAmount)).toFixed(2),
    farmerPayable: sum(transactions.map((t) => t.farmerPayable)).toFixed(2),
    traderReceivable: sum(transactions.map((t) => t.traderReceivable)).toFixed(2),
    paymentsPaid: sum(paymentsPaid.map((p) => p.amount)).toFixed(2),
    paymentsReceived: sum(paymentsReceived.map((p) => p.amount)).toFixed(2),
    totalKisanBaki: totalKisanBaki.toFixed(2),
    totalVyapariBaki: totalVyapariBaki.toFixed(2),
  };
}
