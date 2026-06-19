import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { getServerLocale } from "@/lib/i18n/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "MandiBook Lab",
  description: "Digital mandi bahi-khata for adatiyas — Ramatech Innovation",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-background">
        <I18nProvider locale={locale}>{children}</I18nProvider>
        <Toaster />
      </body>
    </html>
  );
}
