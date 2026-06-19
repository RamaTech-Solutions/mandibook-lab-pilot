"use server";

import { prisma } from "@/lib/db";
import { requireFirm } from "@/lib/auth";
import { vyapariEntrySchema, validateVyapariEntryPayments } from "@/lib/validations";
import { calculateTransactionQuintalPerKg } from "@/lib/calculations";
import { appendDueTag, appendPerKgTag, appendVyapariSourceTag } from "@/lib/format";
import { resolveCommodity, resolveParty } from "@/lib/mandi/resolve-entities";
import { createSaleRecord } from "@/lib/transactions/create-sale-record";
import { createPaymentRecord } from "@/lib/payments/create-payment-record";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Decimal from "decimal.js";

export async function createVyapariEntry(formData: FormData) {
  const { firmId, user, firm } = await requireFirm();

  const parsed = vyapariEntrySchema.safeParse({
    traderId: formData.get("traderId") || undefined,
    traderName: formData.get("traderName"),
    traderPhone: formData.get("traderPhone") || undefined,
    traderCity: formData.get("traderCity") || undefined,
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

  const traderReceivable = calc.traderReceivable.toNumber();
  const paymentError = validateVyapariEntryPayments(data, traderReceivable);
  if (paymentError) {
    return { error: paymentError };
  }

  const totalReceived = new Decimal(data.cashPayment).plus(data.onlinePayment);
  const remaining = calc.traderReceivable.minus(totalReceived).toDecimalPlaces(2);

  let storedNotes = appendVyapariSourceTag(appendPerKgTag(data.notes));
  if (remaining.gt(0) && data.remainingDueDate) {
    storedNotes = appendDueTag(storedNotes, remaining.toNumber(), data.remainingDueDate);
  }

  const purchaseBase = `Purchase ${data.commodityName.trim()} — ${data.weight} Quintal @ ₹${data.rate}/kg`;

  const txDate = new Date(data.transactionDate);
  txDate.setHours(0, 0, 0, 0);

  const stockFarmerName = `${firm.name} (Stock)`;

  let txn;
  let traderIdForRevalidate: string | undefined;
  try {
    txn = await prisma.$transaction(async (tx) => {
      const trader = await resolveParty(tx, firmId, user.id, "VYAPARI", data.traderId, data.traderName, {
        phone: data.traderPhone,
        address: data.traderCity,
      });

      const farmer = await resolveParty(tx, firmId, user.id, "KISAN", undefined, stockFarmerName);

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
        ledgerDescription: purchaseBase,
        auditValues: {
          ...data,
          source: "vyapari_entry",
          ratePerKg: true,
          commodityUnit: "QUINTAL",
          stockFarmerName,
          remainingAmount: remaining.gt(0) ? remaining.toNumber() : 0,
        },
      });

      if (data.cashPayment > 0) {
        await createPaymentRecord(tx, {
          firmId,
          userId: user.id,
          partyId: trader.id,
          paymentDate: txDate,
          amount: data.cashPayment,
          paymentMode: "CASH",
          direction: "RECEIVED",
          ledgerDirection: "CREDIT",
          description: `${purchaseBase} — cash received (same day)`,
          transactionId: transaction.id,
        });
      }

      if (data.onlinePayment > 0) {
        await createPaymentRecord(tx, {
          firmId,
          userId: user.id,
          partyId: trader.id,
          paymentDate: txDate,
          amount: data.onlinePayment,
          paymentMode: "UPI",
          direction: "RECEIVED",
          ledgerDirection: "CREDIT",
          description: `${purchaseBase} — online/UPI received (same day)`,
          transactionId: transaction.id,
        });
      }

      traderIdForRevalidate = trader.id;
      return transaction;
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Save failed" };
  }

  revalidatePath("/transactions");
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  revalidatePath("/vyapari");
  revalidatePath("/maal");
  if (traderIdForRevalidate) {
    revalidatePath(`/vyapari/${traderIdForRevalidate}`);
  }
  redirect(`/transactions?created=${txn.id}`);
}
