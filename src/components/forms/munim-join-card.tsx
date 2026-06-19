"use client";

import { joinAsMunim } from "@/actions/firm";
import { useLanguage } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";

type Invite = {
  id: string;
  fullName: string;
  firm: { name: string; mandiName: string };
};

export function MunimJoinCard({ invite }: { invite: Invite }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setLoading(true);
    const result = await joinAsMunim(invite.id);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
  }

  return (
    <Card className="border-mandi-primary">
      <CardHeader>
        <CardTitle>{t("munim.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          {t("munim.body", { firm: invite.firm.name, mandi: invite.firm.mandiName })}
        </p>
        <Button onClick={handleJoin} className="w-full" size="lg" disabled={loading}>
          {loading ? t("munim.joining") : t("munim.join")}
        </Button>
      </CardContent>
    </Card>
  );
}
