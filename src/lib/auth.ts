import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const user = await getUser();
  if (!user) return null;

  return prisma.profile.findUnique({
    where: { userId: user.id },
    include: { firm: true },
  });
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireFirm() {
  const user = await requireUser();
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    include: { firm: true },
  });

  if (!profile) redirect("/onboarding");

  return { user, profile, firmId: profile.firmId, firm: profile.firm };
}

export async function requireOwner() {
  const ctx = await requireFirm();
  if (ctx.profile.role !== "OWNER") {
    throw new Error("Only owner can perform this action");
  }
  return ctx;
}

export async function getMunimInviteForPhone(phone: string) {
  const normalized = phone.replace(/\D/g, "").slice(-10);
  return prisma.munimInvite.findFirst({
    where: {
      phone: { endsWith: normalized },
    },
    include: { firm: true },
  });
}
