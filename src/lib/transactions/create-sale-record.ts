import type { Prisma } from "@prisma/client";
import type { TransactionCalcResult } from "@/lib/calculations";

export type CreateSaleRecordInput = {
  firmId: string;
  userId: string;
  farmerId: string;
  traderId: string;
  commodityId: string;
  commodityName: string;
  transactionDate: Date;
  weight: number;
  rate: number;
  commissionRate: number;
  deductions: number;
  notes?: string;
  calc: TransactionCalcResult;
  auditValues: Prisma.InputJsonValue;
  ledgerDescription?: string;
};

export async function createSaleRecord(
  tx: Prisma.TransactionClient,
  input: CreateSaleRecordInput
) {
  const transaction = await tx.transaction.create({
    data: {
      firmId: input.firmId,
      farmerId: input.farmerId,
      traderId: input.traderId,
      commodityId: input.commodityId,
      transactionDate: input.transactionDate,
      weight: input.weight,
      rate: input.rate,
      grossAmount: input.calc.grossAmount.toNumber(),
      commissionRate: input.commissionRate,
      commissionAmount: input.calc.commissionAmount.toNumber(),
      deductions: input.deductions,
      farmerPayable: input.calc.farmerPayable.toNumber(),
      traderReceivable: input.calc.traderReceivable.toNumber(),
      notes: input.notes,
      createdBy: input.userId,
    },
  });

  const saleBase = input.ledgerDescription ?? `Sale ${input.commodityName}`;

  await tx.ledgerEntry.createMany({
    data: [
      {
        firmId: input.firmId,
        partyId: input.farmerId,
        transactionId: transaction.id,
        entryDate: input.transactionDate,
        entryType: "TRANSACTION",
        direction: "CREDIT",
        amount: input.calc.farmerPayable.toNumber(),
        description: `${saleBase} — kisan payable`,
      },
      {
        firmId: input.firmId,
        partyId: input.traderId,
        transactionId: transaction.id,
        entryDate: input.transactionDate,
        entryType: "TRANSACTION",
        direction: "DEBIT",
        amount: input.calc.traderReceivable.toNumber(),
        description: `${saleBase} — vyapari receivable`,
      },
    ],
  });

  await tx.auditLog.create({
    data: {
      firmId: input.firmId,
      userId: input.userId,
      action: "CREATE",
      entityType: "transaction",
      entityId: transaction.id,
      newValues: input.auditValues,
    },
  });

  return transaction;
}
