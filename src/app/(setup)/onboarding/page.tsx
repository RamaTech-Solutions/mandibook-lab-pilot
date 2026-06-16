import { requireUser, getMunimInviteForEmail } from "@/lib/auth";
import { OnboardingForm } from "@/components/forms/onboarding-form";
import { MunimJoinCard } from "@/components/forms/munim-join-card";

export default async function OnboardingPage() {
  const user = await requireUser();
  const email = user.email?.trim().toLowerCase() ?? "";
  const invite = email ? await getMunimInviteForEmail(email) : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-mandi-light p-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-mandi-primary">MandiBook Lab</h1>
        <p className="text-sm text-muted-foreground">Apni dukan setup karein</p>
      </div>
      <div className="w-full max-w-md space-y-4">
        {invite && <MunimJoinCard invite={invite} />}
        {!invite && <OnboardingForm defaultPhone="" />}
      </div>
    </div>
  );
}
