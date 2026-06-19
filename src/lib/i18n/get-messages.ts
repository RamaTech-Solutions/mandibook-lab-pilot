import type { Locale, Messages } from "./types";
import en from "@/messages/en.json";
import hi from "@/messages/hi.json";

const catalogs: Record<Locale, Messages> = {
  en: en as Messages,
  hi: hi as Messages,
};

export function getMessages(locale: Locale): Messages {
  return catalogs[locale] ?? catalogs.en;
}

export function getNestedMessage(messages: Messages, key: string): string | undefined {
  return messages[key];
}
