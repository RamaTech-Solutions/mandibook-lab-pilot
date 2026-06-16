"use server";

import { prisma } from "@/lib/db";
import { requireFirm } from "@/lib/auth";
import { commoditySchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

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
    return { success: true };
  } catch {
    return { error: "Maal already exists" };
  }
}

export async function getCommodities(activeOnly = false) {
  const { firmId } = await requireFirm();

  return prisma.commodity.findMany({
    where: { firmId, ...(activeOnly ? { isActive: true } : {}) },
    orderBy: { name: "asc" },
  });
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
  return { success: true };
}
