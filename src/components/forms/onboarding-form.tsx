"use client";

import { createFirm } from "@/actions/firm";
import { useLanguage } from "@/components/i18n/language-provider";
import { translateError } from "@/lib/i18n/translate-error";
import { getMessages } from "@/lib/i18n/get-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";

export function OnboardingForm({ defaultPhone }: { defaultPhone?: string }) {
  const { t, locale } = useLanguage();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await createFirm(formData);
    if (result?.error) {
      toast.error(translateError(getMessages(locale), result.error));
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("onboarding.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("onboarding.firmName")}</Label>
            <Input id="name" name="name" required placeholder={t("onboarding.firmPlaceholder")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mandiName">{t("onboarding.mandiName")}</Label>
            <Input id="mandiName" name="mandiName" required placeholder={t("onboarding.mandiPlaceholder")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerName">{t("onboarding.ownerName")}</Label>
            <Input id="ownerName" name="ownerName" required placeholder={t("onboarding.ownerPlaceholder")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("onboarding.shopPhone")}</Label>
            <Input
              id="phone"
              name="phone"
              required
              defaultValue={defaultPhone}
              placeholder="9876543210"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">{t("onboarding.phoneHint")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">{t("onboarding.address")}</Label>
            <Input id="address" name="address" placeholder={t("onboarding.addressPlaceholder")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultCommissionRate">{t("onboarding.commission")}</Label>
            <Input id="defaultCommissionRate" name="defaultCommissionRate" type="number" step="0.01" defaultValue="2" />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? t("common.saving") : t("onboarding.start")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
