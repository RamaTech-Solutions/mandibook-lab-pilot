"use server";

import { prisma } from "@/lib/db";
import { requireFirm } from "@/lib/auth";
import { mandiEntrySchema, validateMandiEntryPayments } from "@/lib/validations";
import { calculateTransactionQuintalPerKg } from "@/lib/calculations";
import { appendDueTag, appendPerKgTag } from "@/lib/format";
import { createSaleRecord } from "@/lib/transactions/create-sale-record";
import { createPaymentRecord } from "@/lib/payments/create-payment-record";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CommodityUnit, PartyType, Prisma } from "@prisma/client";
import Decimal from "decimal.js";

type TxClient = Prisma.TransactionClient;

async function resolveParty(
  tx: TxClient,
  firmId: string,
  userId: string,
  type: PartyType,
  id: string | undefined,
  name: string,
  extras?: { village?: string; phone?: string }
) {
  const trimmedName = name.trim();

  if (id) {
    const existing = await tx.party.findFirst({
      where: { id, firmId, type, deletedAt: null },
    });
    if (existing) return existing;
  }

  const byName = await tx.party.findFirst({
    where: {
      firmId,
      type,
      deletedAt: null,
      name: { equals: trimmedName, mode: "insensitive" },
    },
  });
  if (byName) return byName;

  const party = await tx.party.create({
    data: {
      firmId,
      type,
      name: trimmedName,
      village: extras?.village?.trim() || null,
      phone: extras?.phone?.trim() || null,
    },
  });

  await tx.auditLog.create({
    data: {
      firmId,
      userId,
      action: "CREATE",
      entityType: "party",
      entityId: party.id,
      newValues: { type, name: trimmedName, ...extras },
    },
  });

  return party;
}

async function resolveCommodity(
  tx: TxClient,
  firmId: string,
  userId: string,
  id: string | undefined,
  name: string,
  unit: CommodityUnit
) {
  const trimmedName = name.trim();

  if (id) {
    const existing = await tx.commodity.findFirst({
      where: { id, firmId, isActive: true },
    });
    if (existing) return existing;
  }

  const byName = await tx.commodity.findFirst({
    where: {
      firmId,
      name: { equals: trimmedName, mode: "insensitive" },
    },
  });
  if (byName) return byName;

  const commodity = await tx.commodity.create({
    data: { firmId, name: trimmedName, unit },
  });

  await tx.auditLog.create({
    data: {
      firmId,
      userId,
      action: "CREATE",
      entityType: "commodity",
      entityId: commodity.id,
      newValues: { name: trimmedName, unit },
    },
  });

  return commodity;
}

export async function createMandiEntry(formData: FormData) {
  const { firmId, user, firm } = await requireFirm();

  const parsed = mandiEntrySchema.safeParse({
    farmerId: formData.get("farmerId") || undefined,
    farmerName: formData.get("farmerName"),
    farmerVillage: formData.get("farmerVillage") || undefined,
    farmerPhone: formData.get("farmerPhone") || undefined,
    traderId: formData.get("traderId") || undefined,
    traderName: formData.get("traderName"),
    commodityId: formData.get("commodityId") || undefined,
    commodityName: formData.get("commodityName"),
    commodityUnit: "QUINTAL",
    weight: formData.get("weight"),
    rate: formData.get("rate"),
    commissionRate: formData.get("commissionRate") ?? firm.defaultCommissionRate.toString(),
    deductions: formData.get("deductions") ?? 0,
    transactionDate: formData.get("transactionDate"),
    notes: formData.get("notes") || undefined,
    cashPayment: formData.get("cashPayment") ?? 0,
    onlinePayment: formData.get("onlinePayment") ?? 0,
    remainingDueDate: formData.get("remainingDueDate") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;

  let calc;
  try {
    calc = calculateTransactionQuintalPerKg({
      weightQuintal: data.weight,
      ratePerKg: data.rate,
      commissionRate: data.commissionRate,
      deductions: data.deductions,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Calculation error" };
  }

  const farmerPayable = calc.farmerPayable.toNumber();
  const paymentError = validateMandiEntryPayments(data, farmerPayable);
  if (paymentError) {
    return { error: paymentError };
  }

  const totalPaid = new Decimal(data.cashPayment).plus(data.onlinePayment);
  const remaining = calc.farmerPayable.minus(totalPaid).toDecimalPlaces(2);

  let storedNotes = appendPerKgTag(data.notes);
  if (remaining.gt(0) && data.remainingDueDate) {
    storedNotes = appendDueTag(storedNotes, remaining.toNumber(), data.remainingDueDate);
  }

  const saleBase = `Sale ${data.commodityName.trim()} — ${data.weight} Quintal @ ₹${data.rate}/kg`;

  const txDate = new Date(data.transactionDate);
  txDate.setHours(0, 0, 0, 0);

  let txn;
  let farmerIdForRevalidate: string | undefined;
  try {
    txn = await prisma.$transaction(async (tx) => {
      const farmer = await resolveParty(tx, firmId, user.id, "KISAN", data.farmerId, data.farmerName, {
        village: data.farmerVillage,
        phone: data.farmerPhone,
      });

      const trader = await resolveParty(tx, firmId, user.id, "VYAPARI", data.traderId, data.traderName);

      if (farmer.id === trader.id) {
        throw new Error("Kisan aur Vyapari alag hone chahiye");
      }

      const commodity = await resolveCommodity(
        tx,
        firmId,
        user.id,
        data.commodityId,
        data.commodityName,
        "QUINTAL"
      );

      const transaction = await createSaleRecord(tx, {
        firmId,
        userId: user.id,
        farmerId: farmer.id,
        traderId: trader.id,
        commodityId: commodity.id,
        commodityName: commodity.name,
        transactionDate: txDate,
        weight: data.weight,
        rate: data.rate,
        commissionRate: data.commissionRate,
        deductions: data.deductions,
        notes: storedNotes,
        calc,
        ledgerDescription: saleBase,
        auditValues: {
          ...data,
          source: "mandi_entry",
          ratePerKg: true,
          commodityUnit: "QUINTAL",
          remainingAmount: remaining.gt(0) ? remaining.toNumber() : 0,
        },
      });

      if (data.cashPayment > 0) {
        await createPaymentRecord(tx, {
          firmId,
          userId: user.id,
          partyId: farmer.id,
          paymentDate: txDate,
          amount: data.cashPayment,
          paymentMode: "CASH",
          direction: "PAID",
          ledgerDirection: "DEBIT",
          description: `${saleBase} — cash (same day)`,
          transactionId: transaction.id,
        });
      }

      if (data.onlinePayment > 0) {
        await createPaymentRecord(tx, {
          firmId,
          userId: user.id,
          partyId: farmer.id,
          paymentDate: txDate,
          amount: data.onlinePayment,
          paymentMode: "UPI",
          direction: "PAID",
          ledgerDirection: "DEBIT",
          description: `${saleBase} — online/UPI (same day)`,
          transactionId: transaction.id,
        });
      }

      farmerIdForRevalidate = farmer.id;
      return transaction;
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Save failed" };
  }

  revalidatePath("/transactions");
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  revalidatePath("/kisan");
  revalidatePath("/vyapari");
  revalidatePath("/maal");
  revalidatePath("/entry");
  if (farmerIdForRevalidate) {
    revalidatePath(`/kisan/${farmerIdForRevalidate}`);
  }
  redirect(`/transactions?created=${txn.id}`);
}
