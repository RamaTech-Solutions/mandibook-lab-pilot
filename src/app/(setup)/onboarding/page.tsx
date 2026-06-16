import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OnboardingForm } from "@/components/forms/onboarding-form";
import { MunimJoinCard } from "@/components/forms/munim-join-card";

export default async function OnboardingPage() {
  const user = await requireUser();
  const phone = user.phone?.replace(/\D/g, "").slice(-10) ?? "";
  const invite = phone
    ? await prisma.munimInvite.findFirst({
        where: { phone: { endsWith: phone } },
        include: { firm: true },
      })
    : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-mandi-light p-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-mandi-primary">MandiBook Lab</h1>
        <p className="text-sm text-muted-foreground">Apni dukan setup karein</p>
      </div>
      <div className="w-full max-w-md space-y-4">
        {invite && <MunimJoinCard invite={invite} />}
        {!invite && <OnboardingForm defaultPhone={phone} />}
      </div>
    </div>
  );
}
