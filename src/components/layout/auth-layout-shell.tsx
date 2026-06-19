"use client";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";

export function AuthLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-mandi-light p-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-mandi-primary">MandiBook Lab</h1>
        <p className="text-sm text-muted-foreground">Ramatech Innovation Pvt Ltd</p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
