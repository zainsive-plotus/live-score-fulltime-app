// ===== src/app/[locale]/404/page.tsx (CORRECTED SERVER COMPONENT) =====

import { Suspense } from "react";
import Header from "@/components/Header";
import { HeaderSkeleton } from "@/components/LayoutSkeletons";
import NotFoundClientContent from "@/components/NotFoundClientContent"; // Import the new client component
import { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { I18nProviderClient } from "@/lib/i18n/client"; // We need this to provide translations to the client part
import { i18nCache } from "@/lib/i18n/i18n.cache";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getI18n(params.locale);
  const title = t("seo_404_page_title");
  const description = t("seo_404_page_description");

  return {
    title,
    description,
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function Custom404Page({
  params: { locale },
}: {
  params: { locale: string };
}) {
  // Fetch translations on the server for the client component
  const translations = (await i18nCache.getTranslations(locale)) || {};

  return (
    <div className="min-h-screen flex flex-col bg-brand-dark">
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>

      {/* 
        Wrap the Client Component in the I18nProvider to pass down
        the locale and translations fetched on the server.
      */}
      <I18nProviderClient locale={locale} translations={translations}>
        <NotFoundClientContent />
      </I18nProviderClient>
    </div>
  );
}
