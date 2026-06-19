"use server";

import { prisma } from "@/lib/db";
import { requireFirm } from "@/lib/auth";
import { partySchema } from "@/lib/validations";
import { calculatePartyBalance } from "@/lib/ledger";
import { revalidatePath } from "next/cache";
import type { PartyType } from "@prisma/client";

export async function createParty(type: PartyType, formData: FormData) {
  const { firmId, user } = await requireFirm();

  const parsed = partySchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || "",
    village: formData.get("village") || undefined,
    address: formData.get("address") || undefined,
    openingBalance: formData.get("openingBalance") || 0,
    balanceType: formData.get("balanceType") || "NONE",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const party = await prisma.party.create({
    data: {
      firmId,
      type,
      ...parsed.data,
      phone: parsed.data.phone || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      firmId,
      userId: user.id,
      action: "CREATE",
      entityType: "party",
      entityId: party.id,
      newValues: parsed.data,
    },
  });

  revalidatePath(type === "KISAN" ? "/kisan" : "/vyapari");
  return { success: true, id: party.id };
}

export async function getParties(type: PartyType, search?: string) {
  const { firmId } = await requireFirm();

  const parties = await prisma.party.findMany({
    where: {
      firmId,
      type,
      deletedAt: null,
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
    include: {
      ledgerEntries: { select: { direction: true, amount: true } },
    },
  });

  return parties.map((p) => ({
    ...p,
    openingBalance: p.openingBalance.toString(),
    balance: calculatePartyBalance(
      p.type,
      p.ledgerEntries,
      p.openingBalance,
      p.balanceType
    ).toString(),
  }));
}

export async function getParty(id: string) {
  const { firmId } = await requireFirm();

  const party = await prisma.party.findFirst({
    where: { id, firmId, deletedAt: null },
    include: {
      ledgerEntries: {
        orderBy: [{ entryDate: "asc" }, { createdAt: "asc" }],
        include: {
          transaction: { include: { commodity: true } },
          payment: true,
        },
      },
    },
  });

  if (!party) return null;

  const balance = calculatePartyBalance(
    party.type,
    party.ledgerEntries,
    party.openingBalance,
    party.balanceType
  );

  return {
    ...party,
    openingBalance: party.openingBalance.toString(),
    balance: balance.toString(),
    ledgerEntries: party.ledgerEntries.map((e) => ({
      ...e,
      amount: e.amount.toString(),
    })),
  };
}

export async function getKisanByName(name: string) {
  const { firmId } = await requireFirm();
  const trimmed = name.trim();
  if (!trimmed) return null;

  const party = await prisma.party.findFirst({
    where: {
      firmId,
      type: "KISAN",
      deletedAt: null,
      name: { equals: trimmed, mode: "insensitive" },
    },
    include: {
      ledgerEntries: {
        orderBy: [{ entryDate: "asc" }, { createdAt: "asc" }],
        include: {
          transaction: { include: { commodity: true } },
          payment: true,
        },
      },
    },
  });

  if (!party) return null;

  const balance = calculatePartyBalance(
    party.type,
    party.ledgerEntries,
    party.openingBalance,
    party.balanceType
  );

  return {
    id: party.id,
    name: party.name,
    type: party.type,
    balanceType: party.balanceType,
    openingBalance: party.openingBalance.toString(),
    balance: balance.toString(),
    ledgerEntries: party.ledgerEntries.map((e) => ({
      id: e.id,
      entryDate: e.entryDate,
      entryType: e.entryType,
      direction: e.direction,
      amount: e.amount.toString(),
      description: e.description,
    })),
  };
}

export async function deleteParty(id: string) {
  const { firmId, user } = await requireFirm();

  await prisma.party.updateMany({
    where: { id, firmId },
    data: { deletedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      firmId,
      userId: user.id,
      action: "DELETE",
      entityType: "party",
      entityId: id,
    },
  });

  revalidatePath("/kisan");
  revalidatePath("/vyapari");
  return { success: true };
}
