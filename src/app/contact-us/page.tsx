import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import ContactFormClient from "@/components/ContactFormClient";
import AdSlotWidget from "@/components/AdSlotWidget";
import RecentNewsWidget from "@/components/RecentNewsWidget";
import { getI18n } from "@/lib/i18n/server"; // <-- Import server helper

// --- Metadata for the Contact Us page (Server-side) ---
export const metadata: Metadata = {
  title: "Contact Us | Fan Skor Destek",
  description:
    "Get in touch with Fanskor support team. Send us your questions, feedback, or inquiries through our contact form or find our contact details here.",
  alternates: {
    canonical: `/contact-us`,
  },
  openGraph: {
    title: "Contact Us | Fan Skor Destek",
    description:
      "Get in touch with Fanskor support team. Send us your questions, feedback, or inquiries through our contact form or find our contact details here.",
    url: `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/contact-us`,
    siteName: "Fan Skor",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18n(); // <-- Get translations
  const pageTitle = t("contact_us_page_title");
  const pageDescription = t("contact_us_page_description");

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: `/contact-us`,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/contact-us`,
      siteName: "Fan Skor",
      type: "website",
    },
  };
}

export default async function ContactUsPage() {
  const t = await getI18n(); // <-- Get translations
  const contactPageSeoText = t("contact_us_seo_text");

  return (
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
                    <h3 className="font-semibold text-white">{t("address")}</h3>
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
  );
}
