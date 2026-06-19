import { LanguageProvider } from "@/components/i18n/language-provider";
import type { Locale } from "@/lib/i18n/types";

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>;
}
