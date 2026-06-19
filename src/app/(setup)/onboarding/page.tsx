import { requireUser, getMunimInviteForEmail } from "@/lib/auth";
import { OnboardingForm } from "@/components/forms/onboarding-form";
import { MunimJoinCard } from "@/components/forms/munim-join-card";
import { SetupPageShell } from "@/components/layout/setup-page-shell";

export default async function OnboardingPage() {
  const user = await requireUser();
  const email = user.email?.trim().toLowerCase() ?? "";
  const invite = email ? await getMunimInviteForEmail(email) : null;

  return (
    <SetupPageShell>
      {invite && <MunimJoinCard invite={invite} />}
      {!invite && <OnboardingForm defaultPhone="" />}
    </SetupPageShell>
  );
}
