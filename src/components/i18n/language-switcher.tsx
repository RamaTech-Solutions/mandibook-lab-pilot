"use client";

import { useLanguage } from "@/components/i18n/language-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Locale } from "@/lib/i18n/types";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
      <SelectTrigger className={className ?? "h-9 w-[120px] shrink-0"} aria-label="Language">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{t("lang.english")}</SelectItem>
        <SelectItem value="hi">{t("lang.hindi")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
