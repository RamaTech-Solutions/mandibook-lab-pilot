"use client";

import { updateFirmSettings, inviteMunim } from "@/actions/firm";
import { AppHeader } from "@/components/layout/app-shell";
import { useLanguage } from "@/components/i18n/language-provider";
import { translateError } from "@/lib/i18n/translate-error";
import { getMessages } from "@/lib/i18n/get-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Firm = {
  name: string;
  mandiName: string;
  ownerName: string;
  phone: string;
  address: string | null;
  defaultCommissionRate: { toString(): string };
};

type Invite = { id: string; fullName: string; email: string };

export function SettingsPageClient({
  firm,
  invites,
  isOwner,
  role,
}: {
  firm: Firm;
  invites: Invite[];
  isOwner: boolean;
  role: string;
}) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [loading, setLoading] = useState(false);

  async function handleFirmUpdate(formData: FormData) {
    setLoading(true);
    const result = await updateFirmSettings(formData);
    if (result?.error) toast.error(translateError(getMessages(locale), result.error));
    else toast.success(t("settings.saved"));
    setLoading(false);
    router.refresh();
  }

  async function handleInvite(formData: FormData) {
    setLoading(true);
    const result = await inviteMunim(formData);
    if (result?.error) toast.error(translateError(getMessages(locale), result.error));
    else toast.success(t("settings.inviteSaved"));
    setLoading(false);
    router.refresh();
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <AppHeader title={t("settings.title")} firmName={`${t("settings.role")} ${role}`} />
      <main className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.firmDetails")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleFirmUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("settings.firmName")}</Label>
                <Input id="name" name="name" defaultValue={firm.name} required disabled={!isOwner} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mandiName">{t("settings.mandiName")}</Label>
                <Input id="mandiName" name="mandiName" defaultValue={firm.mandiName} required disabled={!isOwner} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName">{t("settings.ownerName")}</Label>
                <Input id="ownerName" name="ownerName" defaultValue={firm.ownerName} required disabled={!isOwner} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("common.phone")}</Label>
                <Input id="phone" name="phone" defaultValue={firm.phone} required disabled={!isOwner} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t("settings.address")}</Label>
                <Input id="address" name="address" defaultValue={firm.address ?? ""} disabled={!isOwner} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultCommissionRate">{t("settings.defaultCommission")}</Label>
                <Input
                  id="defaultCommissionRate"
                  name="defaultCommissionRate"
                  type="number"
                  step="0.01"
                  defaultValue={firm.defaultCommissionRate.toString()}
                  disabled={!isOwner}
                />
              </div>
              {isOwner && (
                <Button type="submit" disabled={loading}>
                  {t("settings.saveSettings")}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("settings.addMunim")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("settings.munimName")}</Label>
                  <Input id="fullName" name="fullName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="munimEmail">{t("settings.munimEmail")}</Label>
                  <Input
                    id="munimEmail"
                    name="email"
                    type="email"
                    required
                    placeholder={t("settings.munimEmailPlaceholder")}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t("settings.munimHint")}</p>
                <Button type="submit" variant="secondary" disabled={loading}>
                  {t("settings.inviteMunim")}
                </Button>
              </form>
              {invites.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("settings.pendingInvites")}</p>
                  {invites.map((i) => (
                    <p key={i.id} className="text-sm text-muted-foreground">
                      {i.fullName} — {i.email}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Button variant="outline" className="w-full" onClick={handleLogout}>
          {t("settings.logout")}
        </Button>
      </main>
    </>
  );
}
