"use server";

import { prisma } from "@/lib/db";
import { requireFirm, requireOwner, requireUser } from "@/lib/auth";
import { firmSchema, munimInviteSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createFirm(formData: FormData) {
  const user = await requireUser();

  const existing = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (existing) redirect("/dashboard");

  const parsed = firmSchema.safeParse({
    name: formData.get("name"),
    mandiName: formData.get("mandiName"),
    ownerName: formData.get("ownerName"),
    phone: formData.get("phone"),
    address: formData.get("address") || undefined,
    defaultCommissionRate: formData.get("defaultCommissionRate") || 2,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    const firm = await tx.firm.create({
      data: {
        name: data.name,
        mandiName: data.mandiName,
        ownerName: data.ownerName,
        phone: data.phone,
        address: data.address,
        defaultCommissionRate: data.defaultCommissionRate,
      },
    });

    await tx.profile.create({
      data: {
        userId: user.id,
        firmId: firm.id,
        fullName: data.ownerName,
        phone: data.phone,
        role: "OWNER",
      },
    });

    await tx.auditLog.create({
      data: {
        firmId: firm.id,
        userId: user.id,
        action: "CREATE",
        entityType: "firm",
        entityId: firm.id,
        newValues: data,
      },
    });
  });

  redirect("/dashboard");
}

export async function joinAsMunim(inviteId: string) {
  const user = await requireUser();

  const invite = await prisma.munimInvite.findUnique({
    where: { id: inviteId },
    include: { firm: true },
  });

  if (!invite) return { error: "Invite not found" };

  const existing = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (existing) redirect("/dashboard");

  await prisma.profile.create({
    data: {
      userId: user.id,
      firmId: invite.firmId,
      fullName: invite.fullName,
      phone: invite.phone,
      role: "MUNIM",
    },
  });

  await prisma.munimInvite.delete({ where: { id: inviteId } });

  redirect("/dashboard");
}

export async function updateFirmSettings(formData: FormData) {
  const { firmId, user } = await requireOwner();

  const parsed = firmSchema.safeParse({
    name: formData.get("name"),
    mandiName: formData.get("mandiName"),
    ownerName: formData.get("ownerName"),
    phone: formData.get("phone"),
    address: formData.get("address") || undefined,
    defaultCommissionRate: formData.get("defaultCommissionRate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  await prisma.firm.update({
    where: { id: firmId },
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      firmId,
      userId: user.id,
      action: "UPDATE",
      entityType: "firm",
      entityId: firmId,
      newValues: parsed.data,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function inviteMunim(formData: FormData) {
  const { firmId, user } = await requireOwner();

  const parsed = munimInviteSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  await prisma.munimInvite.upsert({
    where: {
      firmId_phone: { firmId, phone: parsed.data.phone },
    },
    create: {
      firmId,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
    },
    update: {
      fullName: parsed.data.fullName,
    },
  });

  await prisma.auditLog.create({
    data: {
      firmId,
      userId: user.id,
      action: "INVITE",
      entityType: "munim_invite",
      entityId: parsed.data.phone,
      newValues: parsed.data,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function getMunimInvites() {
  const { firmId } = await requireFirm();
  return prisma.munimInvite.findMany({ where: { firmId }, orderBy: { createdAt: "desc" } });
}
