"use server";

import { prisma } from "@/lib/db";
import { requireFirm } from "@/lib/auth";
import { transactionSchema } from "@/lib/validations";
import { calculateTransaction } from "@/lib/calculations";
import { createSaleRecord } from "@/lib/transactions/create-sale-record";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTransaction(formData: FormData) {
  const { firmId, user, firm } = await requireFirm();

  const parsed = transactionSchema.safeParse({
    farmerId: formData.get("farmerId"),
    traderId: formData.get("traderId"),
    commodityId: formData.get("commodityId"),
    transactionDate: formData.get("transactionDate"),
    weight: formData.get("weight"),
    rate: formData.get("rate"),
    commissionRate: formData.get("commissionRate") ?? firm.defaultCommissionRate.toString(),
    deductions: formData.get("deductions") ?? 0,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;

  if (data.farmerId === data.traderId) {
    return { error: "Kisan aur Vyapari alag hone chahiye" };
  }

  let calc;
  try {
    calc = calculateTransaction({
      weight: data.weight,
      rate: data.rate,
      commissionRate: data.commissionRate,
      deductions: data.deductions,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Calculation error" };
  }

  const [farmer, trader, commodity] = await Promise.all([
    prisma.party.findFirst({ where: { id: data.farmerId, firmId, type: "KISAN", deletedAt: null } }),
    prisma.party.findFirst({ where: { id: data.traderId, firmId, type: "VYAPARI", deletedAt: null } }),
    prisma.commodity.findFirst({ where: { id: data.commodityId, firmId, isActive: true } }),
  ]);

  if (!farmer || !trader || !commodity) {
    return { error: "Invalid kisan, vyapari, or maal" };
  }

  const txDate = new Date(data.transactionDate);
  txDate.setHours(0, 0, 0, 0);

  const txn = await prisma.$transaction(async (tx) =>
    createSaleRecord(tx, {
      firmId,
      userId: user.id,
      farmerId: data.farmerId,
      traderId: data.traderId,
      commodityId: data.commodityId,
      commodityName: commodity.name,
      transactionDate: txDate,
      weight: data.weight,
      rate: data.rate,
      commissionRate: data.commissionRate,
      deductions: data.deductions,
      notes: data.notes,
      calc,
      auditValues: data,
    })
  );

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath(`/kisan/${data.farmerId}`);
  revalidatePath(`/vyapari/${data.traderId}`);
  redirect(`/transactions?created=${txn.id}`);
}

export async function getTransactions(limit = 50) {
  const { firmId } = await requireFirm();

  return prisma.transaction.findMany({
    where: { firmId },
    orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      farmer: { select: { name: true } },
      trader: { select: { name: true } },
      commodity: { select: { name: true, unit: true } },
    },
  });
}

export async function getTransaction(id: string) {
  const { firmId, firm } = await requireFirm();

  const txn = await prisma.transaction.findFirst({
    where: { id, firmId },
    include: {
      farmer: true,
      trader: true,
      commodity: true,
    },
  });

  if (!txn) return null;

  return { transaction: txn, firm };
}
