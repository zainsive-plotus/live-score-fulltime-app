// ===== src/app/[locale]/contact-us/page.tsx (AI Crawlability Enhanced) =====

import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ContactFormClient from "@/components/ContactFormClient";
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import { getI18n } from "@/lib/i18n/server";
import { generateHreflangTags } from "@/lib/hreflang";
import Script from "next/script";
import {
  WithContext,
  ContactPage,
  Organization,
  BreadcrumbList,
  PostalAddress,
} from "schema-dts";

const PAGE_PATH = "/contact-us";
const BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getI18n(locale);
  const pageTitle = t("contact_us_meta_title");
  const pageDescription = t("contact_us_meta_description");
  const hreflangAlternates = await generateHreflangTags(PAGE_PATH, "", locale);

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: hreflangAlternates,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `${BASE_URL}${PAGE_PATH}`,
      siteName: "Fan Skor",
      type: "website",
    },
  };
}

export default async function ContactUsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getI18n(locale);
  const contactPageSeoText = t("contact_us_seo_text");

  const address: PostalAddress = {
    "@type": "PostalAddress",
    streetAddress: "123 Futbol Sokak, Spor Mahallesi",
    addressLocality: "Istanbul",
    postalCode: "34000",
    addressCountry: "TR",
  };

  // --- ENHANCED JSON-LD STRUCTURED DATA ---
  const jsonLd: WithContext<ContactPage | BreadcrumbList>[] = [
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: t("contact_us_meta_title"),
      description: t("contact_us_meta_description"),
      url: `${BASE_URL}/${locale}${PAGE_PATH}`,
      mainEntity: {
        "@type": "Organization",
        name: "Fan Skor",
        url: BASE_URL,
        logo: `${BASE_URL}/fanskor-transparent.webp`,
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: "+90-555-123-4567",
            contactType: "customer support",
            email: "support@fanskor.com",
            areaServed: "TR",
            availableLanguage: [
              "English",
              "Turkish",
              "Africans",
              "Spanish",
              "French",
              "Italians",
            ],
          },
        ],
        address: address,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: t("homepage"),
          item: `${BASE_URL}/${locale}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: t("contact_us_form_title"),
        },
      ],
    },
  ];

  return (
    <>
      <Script
        id="contact-page-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr_288px] lg:gap-8 lg:items-start p-4 lg:p-0 lg:py-6">
          <Sidebar />
          <main className="min-w-0">
            <div className="bg-brand-secondary p-6 rounded-lg shadow-xl mb-8">
              <h1 className="text-3xl font-bold text-white mb-3">
                {t("contact_us_form_title")}
              </h1>
              <p className="text-brand-light text-base leading-relaxed">
                {contactPageSeoText}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8">
              <ContactFormClient />
              <div className="bg-brand-secondary p-8 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold text-white mb-6">
                  {t("contact_information_title")}
                </h2>
                <div className="space-y-6 text-brand-light">
                  <div className="flex items-center gap-4">
                    <Mail size={24} className="text-brand-purple" />
                    <div>
                      <h3 className="font-semibold text-white">{t("email")}</h3>
                      <p className="text-brand-muted">support@fanskor.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Phone size={24} className="text-brand-purple" />
                    <div>
                      <h3 className="font-semibold text-white">{t("phone")}</h3>
                      <p className="text-brand-muted">+90 (555) 123 45 67</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <MapPin size={24} className="text-brand-purple" />
                    <div>
                      <h3 className="font-semibold text-white">
                        {t("address")}
                      </h3>
                      <p
                        className="text-brand-muted"
                        dangerouslySetInnerHTML={{
                          __html: t("contact_address_html"),
                        }}
                      ></p>
                    </div>
                  </div>
                  <div className="text-sm pt-4 border-t border-gray-700 text-brand-muted">
                    {t("contact_response_time_info")}
                  </div>
                </div>
              </div>
            </div>
          </main>
          <aside className="lg:col-span-1 space-y-8 min-w-0 mt-8 lg:mt-0">
            <RecentNewsWidget />
            <AdSlotWidget location="homepage_right_sidebar" />
          </aside>
        </div>
      </div>
    </>
  );
}
