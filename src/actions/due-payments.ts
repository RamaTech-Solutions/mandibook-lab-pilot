"use server";

import { prisma } from "@/lib/db";
import { requireFirm } from "@/lib/auth";
import { createPaymentRecord } from "@/lib/payments/create-payment-record";
import {
  DUE_NOTE_PREFIX,
  isDuePending,
  markDuePaid,
  parseDueFromNotes,
  parseDuePaidFromNotes,
  todayIST,
  toISODateString,
} from "@/lib/format";
import { revalidatePath } from "next/cache";
import type { PaymentMode } from "@prisma/client";

export type DuePaymentItem = {
  transactionId: string;
  farmerId: string;
  farmerName: string;
  commodityName: string;
  saleDate: Date;
  amount: number;
  dueDate: string;
  status: "TODAY" | "OVERDUE";
};

export async function getDuePayments(): Promise<DuePaymentItem[]> {
  const { firmId } = await requireFirm();
  const today = todayIST();
  const todayStr = toISODateString(today);

  const transactions = await prisma.transaction.findMany({
    where: {
      firmId,
      notes: { contains: DUE_NOTE_PREFIX },
    },
    include: {
      farmer: { select: { id: true, name: true } },
      commodity: { select: { name: true } },
    },
    orderBy: [{ transactionDate: "desc" }],
  });

  const items: DuePaymentItem[] = [];

  for (const txn of transactions) {
    if (!txn.notes || !isDuePending(txn.notes)) continue;

    const due = parseDueFromNotes(txn.notes);
    if (!due) continue;

    if (due.dueDate > todayStr) continue;

    items.push({
      transactionId: txn.id,
      farmerId: txn.farmer.id,
      farmerName: txn.farmer.name,
      commodityName: txn.commodity.name,
      saleDate: txn.transactionDate,
      amount: due.amount,
      dueDate: due.dueDate,
      status: due.dueDate === todayStr ? "TODAY" : "OVERDUE",
    });
  }

  items.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "OVERDUE" ? -1 : 1;
    }
    return a.dueDate.localeCompare(b.dueDate);
  });

  return items;
}

export async function settleDuePayment(transactionId: string, paymentMode: PaymentMode) {
  const { firmId, user } = await requireFirm();

  const txn = await prisma.transaction.findFirst({
    where: { id: transactionId, firmId },
    include: {
      farmer: { select: { id: true, name: true } },
      commodity: { select: { name: true } },
    },
  });

  if (!txn) return { error: "Transaction not found" };
  if (!txn.notes) return { error: "Is transaction par koi baaki due nahi hai" };

  if (parseDuePaidFromNotes(txn.notes)) {
    return { error: "Ye due pehle se paid mark ho chuka hai" };
  }

  const due = parseDueFromNotes(txn.notes);
  if (!due) return { error: "Pending due nahi mila" };

  const paymentDate = todayIST();
  const paidDateStr = toISODateString(paymentDate);

  try {
    await prisma.$transaction(async (tx) => {
      await createPaymentRecord(tx, {
        firmId,
        userId: user.id,
        partyId: txn.farmer.id,
        paymentDate,
        amount: due.amount,
        paymentMode,
        direction: "PAID",
        ledgerDirection: "DEBIT",
        description: `Baaki payment — ${txn.commodity.name} (due settled)`,
        transactionId: txn.id,
        auditValues: {
          source: "due_settlement",
          transactionId: txn.id,
          amount: due.amount,
          paymentMode,
          dueDate: due.dueDate,
          paidDate: paidDateStr,
        },
      });

      await tx.transaction.update({
        where: { id: txn.id },
        data: {
          notes: markDuePaid(txn.notes ?? "", due.amount, due.dueDate, paidDateStr),
        },
      });
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Payment settle failed" };
  }

  revalidatePath("/payments");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath(`/kisan/${txn.farmer.id}`);

  return { success: true };
}
