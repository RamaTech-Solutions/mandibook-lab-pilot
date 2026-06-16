import { requireUser, getProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SetupLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = await getProfile();
  if (profile) redirect("/dashboard");
  return <>{children}</>;
}
