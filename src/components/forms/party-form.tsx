"use client";

import { createParty } from "@/actions/parties";
import { AppHeader } from "@/components/layout/app-shell";
import { useLanguage } from "@/components/i18n/language-provider";
import { translateError } from "@/lib/i18n/translate-error";
import { getMessages } from "@/lib/i18n/get-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { PartyType } from "@prisma/client";

export function PartyForm({ type }: { type: PartyType }) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [balanceType, setBalanceType] = useState("NONE");
  const isKisan = type === "KISAN";

  async function handleSubmit(formData: FormData) {
    formData.set("balanceType", balanceType);
    setLoading(true);
    const result = await createParty(type, formData);
    if (result?.error) {
      toast.error(translateError(getMessages(locale), result.error));
      setLoading(false);
      return;
    }
    toast.success(isKisan ? t("kisan.added") : t("vyapari.added"));
    router.push(isKisan ? "/kisan" : "/vyapari");
  }

  return (
    <>
      <AppHeader title={isKisan ? t("kisan.newTitle") : t("vyapari.newTitle")} />
      <main className="p-4">
        <Card>
          <CardContent className="pt-6">
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("common.name")} *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("common.phone")}</Label>
                <Input id="phone" name="phone" maxLength={10} placeholder="9876543210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="village">{t("kisan.village")}</Label>
                <Input id="village" name="village" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openingBalance">{t("kisan.openingBalance")}</Label>
                <Input id="openingBalance" name="openingBalance" type="number" min="0" step="0.01" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label>{t("kisan.balanceType")}</Label>
                <Select value={balanceType} onValueChange={setBalanceType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">{t("common.none")}</SelectItem>
                    <SelectItem value="RECEIVABLE">{t("kisan.receivable")}</SelectItem>
                    <SelectItem value="PAYABLE">{t("kisan.payable")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t("common.notes")}</Label>
                <Input id="notes" name="notes" />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? t("common.saving") : t("kisan.save")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
