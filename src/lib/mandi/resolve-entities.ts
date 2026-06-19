import type { CommodityUnit, PartyType, Prisma } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

export async function resolveParty(
  tx: TxClient,
  firmId: string,
  userId: string,
  type: PartyType,
  id: string | undefined,
  name: string,
  extras?: { village?: string; phone?: string; address?: string }
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
      address: extras?.address?.trim() || null,
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

export async function resolveCommodity(
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
