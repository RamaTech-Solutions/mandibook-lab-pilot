"use server";

import { prisma } from "@/lib/db";
import { requireFirm } from "@/lib/auth";
import { paymentSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createPayment(formData: FormData) {
  const { firmId, user } = await requireFirm();

  const parsed = paymentSchema.safeParse({
    partyId: formData.get("partyId"),
    paymentDate: formData.get("paymentDate"),
    amount: formData.get("amount"),
    paymentMode: formData.get("paymentMode"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;

  const party = await prisma.party.findFirst({
    where: { id: data.partyId, firmId, deletedAt: null },
  });

  if (!party) return { error: "Party not found" };

  const direction = party.type === "KISAN" ? "PAID" : "RECEIVED";
  const ledgerDirection = party.type === "KISAN" ? "DEBIT" : "CREDIT";

  const paymentDate = new Date(data.paymentDate);
  paymentDate.setHours(0, 0, 0, 0);

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        firmId,
        partyId: data.partyId,
        paymentDate,
        amount: data.amount,
        paymentMode: data.paymentMode,
        direction,
        notes: data.notes,
        createdBy: user.id,
      },
    });

    await tx.ledgerEntry.create({
      data: {
        firmId,
        partyId: data.partyId,
        paymentId: payment.id,
        entryDate: paymentDate,
        entryType: "PAYMENT",
        direction: ledgerDirection,
        amount: data.amount,
        description:
          party.type === "KISAN"
            ? `Payment to kisan (${data.paymentMode})`
            : `Payment from vyapari (${data.paymentMode})`,
      },
    });

    await tx.auditLog.create({
      data: {
        firmId,
        userId: user.id,
        action: "CREATE",
        entityType: "payment",
        entityId: payment.id,
        newValues: data,
      },
    });
  });

  revalidatePath("/payments");
  revalidatePath("/dashboard");
  revalidatePath(party.type === "KISAN" ? `/kisan/${party.id}` : `/vyapari/${party.id}`);

  return { success: true };
}

export async function getPayments(limit = 50) {
  const { firmId } = await requireFirm();

  return prisma.payment.findMany({
    where: { firmId },
    orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: { party: { select: { name: true, type: true } } },
  });
}

export async function getAllPartiesForPayment() {
  const { firmId } = await requireFirm();

  return prisma.party.findMany({
    where: { firmId, deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, type: true },
  });
}
