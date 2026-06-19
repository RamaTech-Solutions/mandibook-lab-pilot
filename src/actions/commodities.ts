"use server";

import { prisma } from "@/lib/db";
import { requireFirm } from "@/lib/auth";
import { commoditySchema } from "@/lib/validations";
import { computeNetWeight, isStockOutTransaction } from "@/lib/format";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

function buildTransactionDateFilter(
  dateFrom?: string,
  dateTo?: string
): Prisma.TransactionWhereInput {
  if (!dateFrom?.trim() && !dateTo?.trim()) return {};

  const fromStr = dateFrom?.trim() || dateTo!.trim();
  const toStr = dateTo?.trim() || dateFrom!.trim();

  const start = new Date(fromStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(toStr);
  end.setHours(23, 59, 59, 999);

  if (end < start) {
    end.setTime(start.getTime());
    end.setHours(23, 59, 59, 999);
  }

  return { transactionDate: { gte: start, lte: end } };
}

function safeNetWeight(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export async function createCommodity(formData: FormData) {
  const { firmId, user } = await requireFirm();

  const parsed = commoditySchema.safeParse({
    name: formData.get("name"),
    unit: formData.get("unit"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const commodity = await prisma.commodity.create({
      data: { firmId, ...parsed.data },
    });

    await prisma.auditLog.create({
      data: {
        firmId,
        userId: user.id,
        action: "CREATE",
        entityType: "commodity",
        entityId: commodity.id,
        newValues: parsed.data,
      },
    });

    revalidatePath("/maal");
    revalidatePath("/entry");
    return { success: true };
  } catch {
    return { error: "Maal already exists" };
  }
}

export type CommodityWithStock = {
  id: string;
  name: string;
  unit: string;
  isActive: boolean;
  totalWeight: number;
};

export async function getCommodities(activeOnly = false) {
  const { firmId } = await requireFirm();

  return prisma.commodity.findMany({
    where: { firmId, ...(activeOnly ? { isActive: true } : {}) },
    orderBy: { name: "asc" },
  });
}

export async function getCommoditiesWithStock(
  activeOnly = false,
  dateFrom?: string,
  dateTo?: string
): Promise<CommodityWithStock[]> {
  const { firmId } = await requireFirm();
  const dateFilter = buildTransactionDateFilter(dateFrom, dateTo);

  const [commodities, stockRows] = await Promise.all([
    prisma.commodity.findMany({
      where: { firmId, ...(activeOnly ? { isActive: true } : {}) },
    }),
    prisma.transaction.findMany({
      where: { firmId, ...dateFilter },
      select: {
        commodityId: true,
        weight: true,
        notes: true,
        farmer: { select: { name: true } },
      },
    }),
  ]);

  const stockMap = new Map<string, number>();
  for (const row of stockRows) {
    const net = computeNetWeight(Number(row.weight), row.notes, row.farmer.name);
    stockMap.set(row.commodityId, safeNetWeight((stockMap.get(row.commodityId) ?? 0) + net));
  }

  return commodities
    .map((c) => ({
      id: c.id,
      name: c.name,
      unit: c.unit,
      isActive: c.isActive,
      totalWeight: safeNetWeight(stockMap.get(c.id) ?? 0),
    }))
    .sort((a, b) => {
      if (b.totalWeight !== a.totalWeight) return b.totalWeight - a.totalWeight;
      return a.name.localeCompare(b.name);
    });
}

export type CommodityTransactionRow = {
  id: string;
  weight: number;
  signedWeight: number;
  direction: "CREDIT" | "DEBIT";
  partyName: string;
  transactionDate: Date;
  farmerName: string;
};

export type CommodityWithTransactions = {
  commodity: CommodityWithStock;
  transactions: CommodityTransactionRow[];
};

export async function getCommodityTransactions(
  commodityId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<CommodityWithTransactions | null> {
  const { firmId } = await requireFirm();
  const dateFilter = buildTransactionDateFilter(dateFrom, dateTo);

  const commodity = await prisma.commodity.findFirst({
    where: { id: commodityId, firmId },
  });

  if (!commodity) return null;

  const transactions = await prisma.transaction.findMany({
    where: { firmId, commodityId, ...dateFilter },
    orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
    include: {
      farmer: { select: { name: true } },
      trader: { select: { name: true } },
    },
  });

  const rows: CommodityTransactionRow[] = transactions.map((t) => {
    const weight = Number(t.weight);
    const isOut = isStockOutTransaction(t.notes, t.farmer.name);
    const signedWeight = computeNetWeight(weight, t.notes, t.farmer.name);
    return {
      id: t.id,
      weight,
      signedWeight,
      direction: isOut ? "DEBIT" : "CREDIT",
      partyName: isOut ? t.trader.name : t.farmer.name,
      transactionDate: t.transactionDate,
      farmerName: t.farmer.name,
    };
  });

  const totalWeight = safeNetWeight(rows.reduce((sum, r) => sum + r.signedWeight, 0));

  return {
    commodity: {
      id: commodity.id,
      name: commodity.name,
      unit: commodity.unit,
      isActive: commodity.isActive,
      totalWeight,
    },
    transactions: rows,
  };
}

export async function toggleCommodity(id: string) {
  const { firmId, user } = await requireFirm();

  const commodity = await prisma.commodity.findFirst({ where: { id, firmId } });
  if (!commodity) return { error: "Not found" };

  await prisma.commodity.update({
    where: { id },
    data: { isActive: !commodity.isActive },
  });

  await prisma.auditLog.create({
    data: {
      firmId,
      userId: user.id,
      action: "TOGGLE",
      entityType: "commodity",
      entityId: id,
    },
  });

  revalidatePath("/maal");
  revalidatePath("/entry");
  return { success: true };
}
