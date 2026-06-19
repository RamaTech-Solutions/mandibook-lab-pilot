"use client";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useLanguage } from "@/components/i18n/language-provider";

export function SetupPageShell({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-mandi-light p-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-mandi-primary">MandiBook Lab</h1>
        <p className="text-sm text-muted-foreground">{t("onboarding.subtitle")}</p>
      </div>
      <div className="w-full max-w-md space-y-4">{children}</div>
    </div>
  );
}
