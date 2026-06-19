import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "@/lib/i18n/types";

function parseLocale(value: string | undefined): Locale {
  return value === "hi" ? "hi" : DEFAULT_LOCALE;
}

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}
