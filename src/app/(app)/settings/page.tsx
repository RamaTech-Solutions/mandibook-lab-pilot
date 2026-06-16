import { requireFirm } from "@/lib/auth";
import { getMunimInvites } from "@/actions/firm";
import { SettingsPageClient } from "@/components/forms/settings-page-client";

export default async function SettingsPage() {
  const { firm, profile } = await requireFirm();
  const invites = profile.role === "OWNER" ? await getMunimInvites() : [];

  return (
    <SettingsPageClient
      firm={firm}
      invites={invites}
      isOwner={profile.role === "OWNER"}
      role={profile.role}
    />
  );
}
