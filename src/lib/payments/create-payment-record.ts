import type { Prisma } from "@prisma/client";
import type { Direction, PaymentDirection, PaymentMode } from "@prisma/client";

export type CreatePaymentRecordInput = {
  firmId: string;
  userId: string;
  partyId: string;
  paymentDate: Date;
  amount: number;
  paymentMode: PaymentMode;
  direction: PaymentDirection;
  ledgerDirection: Direction;
  description: string;
  notes?: string;
  transactionId?: string;
  auditValues?: Prisma.InputJsonValue;
};

export async function createPaymentRecord(
  tx: Prisma.TransactionClient,
  input: CreatePaymentRecordInput
) {
  const payment = await tx.payment.create({
    data: {
      firmId: input.firmId,
      partyId: input.partyId,
      paymentDate: input.paymentDate,
      amount: input.amount,
      paymentMode: input.paymentMode,
      direction: input.direction,
      notes: input.notes,
      createdBy: input.userId,
    },
  });

  await tx.ledgerEntry.create({
    data: {
      firmId: input.firmId,
      partyId: input.partyId,
      paymentId: payment.id,
      transactionId: input.transactionId,
      entryDate: input.paymentDate,
      entryType: "PAYMENT",
      direction: input.ledgerDirection,
      amount: input.amount,
      description: input.description,
    },
  });

  await tx.auditLog.create({
    data: {
      firmId: input.firmId,
      userId: input.userId,
      action: "CREATE",
      entityType: "payment",
      entityId: payment.id,
      newValues: input.auditValues ?? {
        partyId: input.partyId,
        amount: input.amount,
        paymentMode: input.paymentMode,
        direction: input.direction,
        transactionId: input.transactionId,
      },
    },
  });

  return payment;
}
